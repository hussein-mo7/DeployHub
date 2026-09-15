import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/error.middleware.js";
import { ERROR_CODES } from "../../constants/errors.js";
import {
  assertWebhookConfigured,
  enqueueGithubPushDeployments,
  findAutoDeployTargets,
  parseGithubPushEvent,
  verifyGithubWebhookSignature,
} from "./github-webhook.service.js";

export async function githubWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertWebhookConfigured();

    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      next(new AppError(400, "Expected raw JSON body", ERROR_CODES.VALIDATION_ERROR));
      return;
    }

    const signature = req.header("x-hub-signature-256") ?? req.header("X-Hub-Signature-256");
    if (!verifyGithubWebhookSignature(rawBody, signature)) {
      next(new AppError(401, "Invalid webhook signature", ERROR_CODES.GITHUB_WEBHOOK_INVALID));
      return;
    }

    const event = req.header("x-github-event") ?? req.header("X-GitHub-Event") ?? "";

    if (event === "ping") {
      res.status(200).json({ ok: true, message: "pong" });
      return;
    }

    if (event !== "push") {
      res.status(200).json({ ok: true, ignored: true, event });
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      next(new AppError(400, "Invalid JSON payload", ERROR_CODES.VALIDATION_ERROR));
      return;
    }

    const pushEvent = parseGithubPushEvent(payload);
    if (!pushEvent) {
      res.status(200).json({ ok: true, ignored: true, reason: "Not a recognized push payload" });
      return;
    }

    const deliveryId =
      req.header("x-github-delivery") ?? req.header("X-GitHub-Delivery") ?? `local-${Date.now()}`;

    const targets = await findAutoDeployTargets(pushEvent);
    if (targets.length === 0) {
      res.status(200).json({
        ok: true,
        queued: 0,
        message: "No matching environments with auto-deploy enabled",
        repo: `${pushEvent.repoOwner}/${pushEvent.repoName}`,
        branch: pushEvent.branch,
      });
      return;
    }

    const queued = await enqueueGithubPushDeployments(deliveryId, pushEvent, targets);

    res.status(202).json({
      ok: true,
      queued,
      deliveryId,
      repo: `${pushEvent.repoOwner}/${pushEvent.repoName}`,
      branch: pushEvent.branch,
    });
  } catch (error) {
    next(error);
  }
}
