import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import {
  completeGitHubInstall,
  disconnectGitHub,
  getGitHubInstallUrl,
  getGitHubIntegration,
  listGitHubBranches,
  listGitHubRepositories,
} from "./github.service.js";
import type { GitHubCallbackInput, ListReposQuery, RepoParams } from "./github.schema.js";

export async function installUrlController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = getGitHubInstallUrl(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function callbackController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const integration = await completeGitHubInstall(req.query as unknown as GitHubCallbackInput);

    if (req.query.format === "json") {
      res.json({ message: "GitHub connected successfully", integration });
      return;
    }

    if (env.NODE_ENV === "development") {
      res
        .status(200)
        .type("html")
        .send(
          `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">` +
            `<h1>GitHub connected</h1>` +
            `<p>Account: <strong>${integration.accountLogin ?? "unknown"}</strong></p>` +
            `<p>Installation ID: <strong>${integration.installationId ?? "unknown"}</strong></p>` +
            `<p>Close this tab and continue testing in Postman (<code>3.3</code> → <code>3.4</code> → <code>3.5</code>).</p>` +
            `</body></html>`,
        );
      return;
    }

    res.redirect(`${env.CLIENT_URL}/settings/github?github=connected`);
  } catch (error) {
    next(error);
  }
}

export async function integrationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const integration = await getGitHubIntegration(req.user!.userId);
    res.json({ integration });
  } catch (error) {
    next(error);
  }
}

export async function disconnectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await disconnectGitHub(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listReposController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listGitHubRepositories(
      req.user!.userId,
      req.query as unknown as ListReposQuery,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listBranchesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listGitHubBranches(req.user!.userId, req.params as unknown as RepoParams);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
