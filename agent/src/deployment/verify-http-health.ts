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
  const url = `http://127.0.0.1:${port}${path === "/" ? "/" : path}`;

  log(`Health check: GET ${url} (up to ${DEFAULT_ATTEMPTS} attempts)...`);

  let lastError = "No response";

  for (let attempt = 1; attempt <= DEFAULT_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        log(`Health check passed (${response.status}) for "${service.name}".`);
        return;
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Request failed";
    }

    if (attempt < DEFAULT_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new Error(
    `Health check failed for "${service.name}" at ${url}: ${lastError}`,
  );
}
