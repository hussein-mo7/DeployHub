import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import type { DeployCommandPayload, DeployServicePayload } from "../types/deploy.js";
import { runServiceHealthCheck } from "./verify-http-health.js";
import { gitCloneStderrFilter, runCommand, runCommandCapture } from "../utils/run-command.js";

function sanitizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

function dockerEnvArgs(env: Record<string, string>): string[] {
  const args: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    args.push("-e", `${key}=${value}`);
  }
  return args;
}

function parsePort(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }
  const port = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }
  return port;
}

/** Host publish `-p host:container` (same port on both sides for local dev). */
function dockerPublishArgs(
  service: DeployServicePayload,
  env: Record<string, string>,
): string[] {
  const port = service.port ?? parsePort(env.PORT);
  if (port == null) {
    return [];
  }
  return ["-p", `${port}:${port}`];
}

async function cloneRepository(
  payload: DeployCommandPayload,
  sourceDir: string,
  log: (message: string) => void,
): Promise<string> {
  await rm(sourceDir, { recursive: true, force: true });
  await mkdir(path.dirname(sourceDir), { recursive: true });

  const cloneUrl = `https://x-access-token:${payload.githubToken}@github.com/${payload.repoOwner}/${payload.repoName}.git`;
  const pinSha = payload.gitCommitSha?.trim();

  if (pinSha) {
    log(`Fetching ${payload.repoOwner}/${payload.repoName} @ ${pinSha.slice(0, 7)}...`);
    await mkdir(sourceDir, { recursive: true });
    await runCommand("git", ["init"], { cwd: sourceDir, onLine: log });
    await runCommand("git", ["remote", "add", "origin", cloneUrl], { cwd: sourceDir, onLine: log });
    await runCommand(
      "git",
      ["fetch", "--depth", "1", "origin", pinSha],
      { cwd: sourceDir, onLine: log, stderrLineFilter: gitCloneStderrFilter },
    );
    await runCommand("git", ["checkout", "FETCH_HEAD"], { cwd: sourceDir, onLine: log });
  } else {
    log(`Cloning ${payload.repoOwner}/${payload.repoName} @ ${payload.branch}...`);
    await runCommand(
      "git",
      ["clone", "--progress", "--depth", "1", "--branch", payload.branch, cloneUrl, sourceDir],
      {
        onLine: log,
        stderrLineFilter: gitCloneStderrFilter,
      },
    );
  }

  const sha = await runCommandCapture("git", ["rev-parse", "HEAD"], { cwd: sourceDir });
  log(`Checked out commit ${sha} (${sha.slice(0, 7)})`);
  return sha;
}

async function deployDockerfileService(
  payload: DeployCommandPayload,
  service: DeployServicePayload,
  sourceDir: string,
  log: (message: string) => void,
): Promise<void> {
  const tag = `deployhub-${sanitizeName(payload.projectId)}-${sanitizeName(service.name)}`;
  const containerName = tag;
  const dockerfilePath = path.join(sourceDir, service.dockerfilePath);
  const buildContext = path.join(sourceDir, service.buildContext);

  log(`Building Dockerfile service "${service.name}"...`);
  await runCommand(
    "docker",
    ["build", "-f", dockerfilePath, "-t", tag, buildContext],
    { onLine: log },
  );

  log(`Starting container ${containerName}...`);
  await runCommand("docker", ["rm", "-f", containerName], { onLine: log }).catch(() => undefined);

  const publishArgs = dockerPublishArgs(service, payload.env);
  if (publishArgs.length > 0) {
    log(`Publishing port ${publishArgs[1]} on the host...`);
  }

  await runCommand(
    "docker",
    ["run", "-d", "--name", containerName, ...publishArgs, ...dockerEnvArgs(payload.env), tag],
    { onLine: log },
  );

  await runServiceHealthCheck(service, payload.env, log);
}

async function deployComposeService(
  payload: DeployCommandPayload,
  service: DeployServicePayload,
  sourceDir: string,
  log: (message: string) => void,
): Promise<void> {
  const composeFile = path.join(sourceDir, service.composeFilePath);
  log(`Running docker compose for "${service.name}"...`);

  await runCommand(
    "docker",
    ["compose", "-f", composeFile, "up", "-d", "--build", "--remove-orphans"],
    {
      cwd: sourceDir,
      env: { ...process.env, ...payload.env },
      onLine: log,
    },
  );
}

async function deployImageService(
  payload: DeployCommandPayload,
  service: DeployServicePayload,
  log: (message: string) => void,
): Promise<void> {
  if (!service.imageName) {
    throw new Error(`Service "${service.name}" is missing imageName`);
  }

  const containerName = `deployhub-${sanitizeName(payload.projectId)}-${sanitizeName(service.name)}`;
  log(`Pulling image ${service.imageName}...`);
  await runCommand("docker", ["pull", service.imageName], { onLine: log });

  log(`Starting container ${containerName}...`);
  await runCommand("docker", ["rm", "-f", containerName], { onLine: log }).catch(() => undefined);

  const publishArgs = dockerPublishArgs(service, payload.env);
  if (publishArgs.length > 0) {
    log(`Publishing port ${publishArgs[1]} on the host...`);
  }

  await runCommand(
    "docker",
    [
      "run",
      "-d",
      "--name",
      containerName,
      ...publishArgs,
      ...dockerEnvArgs(payload.env),
      service.imageName,
    ],
    { onLine: log },
  );

  await runServiceHealthCheck(service, payload.env, log);
}

export async function runDeployment(
  payload: DeployCommandPayload,
  log: (message: string) => void,
): Promise<string> {
  const workspaceDir = path.resolve(
    payload.workspaceRoot,
    payload.projectId,
    payload.environmentId,
  );
  const sourceDir = path.join(workspaceDir, "source");

  const gitCommitSha = await cloneRepository(payload, sourceDir, log);

  for (const service of payload.services) {
    log(`Deploying service "${service.name}" (${service.deploymentMethod})...`);

    if (service.deploymentMethod === "DOCKERFILE") {
      await deployDockerfileService(payload, service, sourceDir, log);
    } else if (service.deploymentMethod === "COMPOSE") {
      await deployComposeService(payload, service, sourceDir, log);
      log(`Compose health checks are not automated yet for "${service.name}".`);
    } else if (service.deploymentMethod === "IMAGE") {
      await deployImageService(payload, service, log);
    } else {
      throw new Error(`Unsupported deployment method: ${service.deploymentMethod}`);
    }
  }

  log("All services deployed successfully.");
  return gitCommitSha;
}
