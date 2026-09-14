import type { Deployment, DeploymentLog, DeploymentTrigger, Project, Service } from "@prisma/client";
import { deploymentQueue } from "../../config/queues.js";
import { prisma } from "../../config/database.js";
import {
  ACTIVE_DEPLOYMENT_STATUSES,
  DEPLOYMENT_QUEUE_JOB,
  type DeploymentTriggerValue,
} from "../../constants/deployments.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { AppError } from "../../middleware/error.middleware.js";
import { getInstallationAccessToken } from "../../utils/github-app.js";
import { getDecryptedEnvironmentVariables } from "../projects/env-variables.service.js";
import { getEnvironment, getOwnedProject } from "../projects/projects.service.js";
import type {
  DeployCommandPayload,
  DeploymentDetail,
  DeploymentLogEntry,
  DeploymentSummary,
} from "./deployments.types.js";

function toDeploymentSummary(
  deployment: Deployment & {
    project: Pick<Project, "name">;
    environment: { name: string };
  },
): DeploymentSummary {
  return {
    id: deployment.id,
    projectId: deployment.projectId,
    environmentId: deployment.environmentId,
    projectName: deployment.project.name,
    environmentName: deployment.environment.name,
    status: deployment.status,
    trigger: deployment.trigger,
    errorMessage: deployment.errorMessage,
    startedAt: deployment.startedAt?.toISOString() ?? null,
    finishedAt: deployment.finishedAt?.toISOString() ?? null,
    createdAt: deployment.createdAt.toISOString(),
    updatedAt: deployment.updatedAt.toISOString(),
  };
}

function toLogEntry(log: DeploymentLog): DeploymentLogEntry {
  return {
    id: log.id,
    deploymentId: log.deploymentId,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
  };
}

async function assertNoActiveDeployment(projectId: string, environmentId: string): Promise<void> {
  const active = await prisma.deployment.findFirst({
    where: {
      projectId,
      environmentId,
      status: { in: [...ACTIVE_DEPLOYMENT_STATUSES] },
    },
  });

  if (active) {
    throw new AppError(
      409,
      "A deployment is already in progress for this environment",
      ERROR_CODES.DEPLOYMENT_IN_PROGRESS,
    );
  }
}

async function getOwnedDeployment(userId: string, deploymentId: string) {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId, userId },
    include: {
      project: { select: { name: true } },
      environment: { select: { name: true } },
    },
  });

  if (!deployment) {
    throw new AppError(404, "Deployment not found", ERROR_CODES.DEPLOYMENT_NOT_FOUND);
  }

  return deployment;
}

export async function createDeploymentForEnvironment(
  userId: string,
  projectId: string,
  environmentId: string,
  trigger: DeploymentTriggerValue,
): Promise<{ deployment: DeploymentSummary }> {
  await getOwnedProject(userId, projectId);
  const { environment } = await getEnvironment(userId, projectId, environmentId);

  const services = await prisma.service.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  if (services.length === 0) {
    throw new AppError(
      400,
      "Project has no services to deploy",
      ERROR_CODES.DEPLOYMENT_NO_SERVICES,
    );
  }

  await assertNoActiveDeployment(projectId, environmentId);

  const installation = await prisma.gitHubInstallation.findUnique({ where: { userId } });
  if (!installation) {
    throw new AppError(400, "GitHub is not connected", ERROR_CODES.GITHUB_NOT_CONNECTED);
  }

  const deployment = await prisma.deployment.create({
    data: {
      userId,
      projectId,
      environmentId,
      trigger: trigger as DeploymentTrigger,
      status: "PENDING",
    },
    include: {
      project: { select: { name: true } },
      environment: { select: { name: true } },
    },
  });

  await deploymentQueue.add(
    DEPLOYMENT_QUEUE_JOB,
    {
      deploymentId: deployment.id,
      userId,
      projectId,
      environmentId,
      serverId: environment.serverId,
      trigger,
    },
    { jobId: `deploy-${deployment.id}` },
  );

  const queued = await prisma.deployment.update({
    where: { id: deployment.id },
    data: { status: "QUEUED" },
    include: {
      project: { select: { name: true } },
      environment: { select: { name: true } },
    },
  });

  return { deployment: toDeploymentSummary(queued) };
}

export async function listEnvironmentDeployments(
  userId: string,
  projectId: string,
  environmentId: string,
): Promise<{ deployments: DeploymentSummary[] }> {
  await getEnvironment(userId, projectId, environmentId);

  const deployments = await prisma.deployment.findMany({
    where: { userId, projectId, environmentId },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true } },
      environment: { select: { name: true } },
    },
  });

  return { deployments: deployments.map(toDeploymentSummary) };
}

export async function getDeployment(
  userId: string,
  deploymentId: string,
): Promise<{ deployment: DeploymentDetail }> {
  const deployment = await getOwnedDeployment(userId, deploymentId);

  const logs = await prisma.deploymentLog.findMany({
    where: { deploymentId },
    orderBy: { createdAt: "asc" },
  });

  return {
    deployment: {
      ...toDeploymentSummary(deployment),
      logs: logs.map(toLogEntry),
    },
  };
}

export async function appendDeploymentLog(
  deploymentId: string,
  message: string,
): Promise<DeploymentLogEntry> {
  const log = await prisma.deploymentLog.create({
    data: { deploymentId, message },
  });

  const entry = toLogEntry(log);
  const { broadcastDeploymentLog } = await import("../../services/deployment-events.service.js");
  broadcastDeploymentLog(deploymentId, entry);
  return entry;
}

export async function markDeploymentRunning(deploymentId: string): Promise<void> {
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      errorMessage: null,
    },
  });

  const { broadcastDeploymentStatus } = await import("../../services/deployment-events.service.js");
  broadcastDeploymentStatus(deploymentId, "RUNNING", null);
}

export async function markDeploymentFinished(
  deploymentId: string,
  status: "SUCCESS" | "FAILED" | "CANCELLED",
  errorMessage?: string,
): Promise<void> {
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status,
      finishedAt: new Date(),
      errorMessage: errorMessage ?? null,
    },
  });

  const { broadcastDeploymentStatus } = await import("../../services/deployment-events.service.js");
  broadcastDeploymentStatus(deploymentId, status, errorMessage ?? null);
}

export async function buildDeployCommandPayload(
  userId: string,
  deploymentId: string,
): Promise<{ serverId: string; payload: DeployCommandPayload }> {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId, userId },
    include: {
      project: true,
      environment: { include: { server: true } },
    },
  });

  if (!deployment) {
    throw new AppError(404, "Deployment not found", ERROR_CODES.DEPLOYMENT_NOT_FOUND);
  }

  const services = await prisma.service.findMany({
    where: { projectId: deployment.projectId },
    orderBy: { createdAt: "asc" },
  });

  const installation = await prisma.gitHubInstallation.findUnique({ where: { userId } });
  if (!installation) {
    throw new AppError(400, "GitHub is not connected", ERROR_CODES.GITHUB_NOT_CONNECTED);
  }

  const githubToken = await getInstallationAccessToken(installation.installationId);
  const envVars = await getDecryptedEnvironmentVariables(deployment.environmentId);

  const workspaceRoot = process.env.DEPLOYHUB_AGENT_WORKSPACE ?? ".deployhub-workspace";

  const payload: DeployCommandPayload = {
    deploymentId: deployment.id,
    projectId: deployment.projectId,
    environmentId: deployment.environmentId,
    repoOwner: deployment.project.repoOwner,
    repoName: deployment.project.repoName,
    branch: deployment.environment.branch,
    githubToken,
    workspaceRoot,
    services: services.map((service: Service) => ({
      id: service.id,
      name: service.name,
      deploymentMethod: service.deploymentMethod,
      dockerfilePath: service.dockerfilePath,
      composeFilePath: service.composeFilePath,
      imageName: service.imageName,
      buildContext: service.buildContext,
      port: service.port,
      healthCheckPath: service.healthCheckPath,
      healthCheckEnabled: service.healthCheckEnabled,
    })),
    env: envVars,
  };

  return { serverId: deployment.environment.serverId, payload };
}

export async function failDeploymentWithLog(
  deploymentId: string,
  message: string,
): Promise<void> {
  await appendDeploymentLog(deploymentId, message);
  await markDeploymentFinished(deploymentId, "FAILED", message);
}

export async function cancelDeployment(
  userId: string,
  deploymentId: string,
): Promise<{ deployment: DeploymentSummary }> {
  const deployment = await getOwnedDeployment(userId, deploymentId);

  if (!ACTIVE_DEPLOYMENT_STATUSES.includes(deployment.status as (typeof ACTIVE_DEPLOYMENT_STATUSES)[number])) {
    throw new AppError(
      400,
      "Only in-progress deployments can be cancelled",
      ERROR_CODES.DEPLOYMENT_NOT_CANCELLABLE,
    );
  }

  const message = "Deployment cancelled by user.";
  await appendDeploymentLog(deploymentId, message);
  await markDeploymentFinished(deploymentId, "CANCELLED", message);

  const updated = await prisma.deployment.findFirstOrThrow({
    where: { id: deploymentId },
    include: {
      project: { select: { name: true } },
      environment: { select: { name: true } },
    },
  });

  const { emitDeploymentStatus } = await import("../../services/deployment-events.service.js");
  emitDeploymentStatus(deploymentId, "CANCELLED", message);

  return { deployment: toDeploymentSummary(updated) };
}