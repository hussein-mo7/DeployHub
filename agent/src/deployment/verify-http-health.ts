import { existsSync, readFileSync } from "node:fs";
import type { DeployServicePayload } from "../types/deploy.js";

const DEFAULT_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

function resolvePublishedPort(
  service: DeployServicePayload,
  env: Record<string, string>,
): number | null {
  if (service.port != null) {
    return service.port;
  }
  const fromEnv = env.PORT?.trim();
  if (!fromEnv) {
    return null;
  }
  const port = Number.parseInt(fromEnv, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }
  return port;
}

function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Docker bridge gateway on Linux — published `-p` ports are reachable here from sibling containers. */
function readDockerBridgeHostIp(): string | null {
  try {
    const route = readFileSync("/proc/net/route", "utf8");
    for (const line of route.split("\n").slice(1)) {
      const parts = line.trim().split(/\s+/);
      if (parts[1] === "00000000" && parts[2] !== "00000000") {
        const hex = parts[2];
        const a = Number.parseInt(hex.slice(6, 8), 16);
        const b = Number.parseInt(hex.slice(4, 6), 16);
        const c = Number.parseInt(hex.slice(2, 4), 16);
        const d = Number.parseInt(hex.slice(0, 2), 16);
        return `${a}.${b}.${c}.${d}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Agent in Docker cannot use 127.0.0.1 for host-published app ports. */
function resolveHealthCheckHosts(): string[] {
  const configured = process.env.HEALTH_CHECK_HOST?.trim();
  if (configured) {
    return [configured];
  }

  if (!existsSync("/.dockerenv")) {
    return ["127.0.0.1"];
  }

  const hosts = ["host.docker.internal"];
  const bridge = readDockerBridgeHostIp();
  if (bridge && !hosts.includes(bridge)) {
    hosts.push(bridge);
  }
  return hosts;
}

export async function runServiceHealthCheck(
  service: DeployServicePayload,
  env: Record<string, string>,
  log: (message: string) => void,
): Promise<void> {
  if (!service.healthCheckEnabled) {
    log(`Health check disabled for service "${service.name}".`);
    return;
  }

  const port = resolvePublishedPort(service, env);
  if (port == null) {
    log(
      `Skipping health check for "${service.name}" (set a host port to enable HTTP checks).`,
    );
    return;
  }

  const path = normalizePath(service.healthCheckPath);
  const hosts = resolveHealthCheckHosts();
  const pathSuffix = path === "/" ? "/" : path;

  log(
    `Health check: GET http://{${hosts.join("|")}}:${port}${pathSuffix} (up to ${DEFAULT_ATTEMPTS} attempts)...`,
  );

  let lastError = "No response";
  let lastUrl = `http://127.0.0.1:${port}${pathSuffix}`;

  for (let attempt = 1; attempt <= DEFAULT_ATTEMPTS; attempt += 1) {
    for (const host of hosts) {
      const url = `http://${host}:${port}${pathSuffix}`;
      lastUrl = url;
      try {
        const response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          log(`Health check passed (${response.status}) for "${service.name}" via ${host}.`);
          return;
        }

        lastError = `HTTP ${response.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Request failed";
      }
    }

    if (attempt < DEFAULT_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new Error(
    `Health check failed for "${service.name}" at ${lastUrl}: ${lastError}`,
  );
}
