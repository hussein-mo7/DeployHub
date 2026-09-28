# DeployHub — Operations (VPS, agent, GHCR)

How to connect a Linux VPS, publish the agent image, and run the control plane so installs and deploys work in production (not only on localhost).

**Full control-plane install (Postgres + Redis on the VPS):** [VPS-DEPLOY.md](./VPS-DEPLOY.md)  
**Product context:** [RELEASE-2.0.md](./RELEASE-2.0.md) · **Local API testing:** [TESTING.md](./TESTING.md)

---

## Control plane environment

On the machine running the API + worker (`backend/.env`):

```env
PUBLIC_API_URL=https://api.yourdomain.com
AGENT_DOCKER_IMAGE=ghcr.io/<github-owner>/deployhub-agent:latest
```

| Variable | Purpose |
|----------|---------|
| `PUBLIC_API_URL` | URL the **VPS** uses for `install.sh`, agent WebSocket, and registration (HTTPS in production) |
| `AGENT_DOCKER_IMAGE` | Pre-built agent container pulled on the VPS — **not** a git clone of this repo |

Replace `<github-owner>` with your GitHub user/org (same as CI `repository_owner`). Restart **API** and **`npm run worker`** after changes.

**Verify:** `GET /api/config/public` → `agentInstallMode: "docker"` and your image URL.

**Local dev + real VPS:** `PUBLIC_API_URL` must be reachable from the internet (e.g. ngrok to port **3001**). The VPS cannot use `http://localhost:3001` on itself.

---

## Publish the agent image (GHCR)

CI: [`.github/workflows/agent-docker.yml`](../.github/workflows/agent-docker.yml)  
Image: `ghcr.io/<github-owner>/deployhub-agent:latest`

1. Push to `main` or run **Publish agent image** in GitHub Actions (green run).
2. GitHub → **Packages** → **deployhub-agent** → **Public** (recommended for portfolio VPS).
3. Set `AGENT_DOCKER_IMAGE` on the control plane (above).

**Local image (dev only):**

```powershell
npm run docker:agent
```

Use `AGENT_DOCKER_IMAGE=deployhub-agent:local` only when the VPS can reach that tag.

**Agent container note:** The image includes Alpine `docker-cli`. Deployments that use **BuildKit** (`RUN --mount=…` in Dockerfiles) require **docker buildx** in the agent image — see [PRODUCT-IMPROVEMENT-PLAN.md](./PRODUCT-IMPROVEMENT-PLAN.md) (PLT-1). Do not mount the host’s `/usr/bin/docker` into the Alpine agent (glibc vs musl).

---

## Recommended: Install agent via SSH (UI)

1. **Servers** → create server → open detail.
2. **Install agent via SSH** — host, port, user, private key **or** password (one time).
3. Watch bootstrap logs → status **CONNECTING** → **ONLINE**.

Credentials are **not stored**; only host, port, and SSH username are saved.

**Requires:** `AGENT_DOCKER_IMAGE` set, **worker** running, Redis up.

The worker runs [`scripts/vps-bootstrap.sh`](../scripts/vps-bootstrap.sh) over SSH: install Docker/Git if needed → `install.sh` → `docker pull` + `docker run` agent.

---

## Manual install (SSH on VPS yourself)

1. Create server in UI → copy install command (must use **public** API URL, not localhost on the VPS).
2. On VPS:

```bash
curl -fsSL "$PUBLIC_API_URL/api/agents/install.sh" | bash -s -- <REGISTRATION_TOKEN>
```

If Docker is missing, the script registers and prints `docker pull` / `docker run` commands. Prefer SSH bootstrap so Docker is installed first.

Config written: `/etc/deployhub/agent.env` (`CONTROL_PLANE_URL`, `AGENT_TOKEN`).

---

## Windows local dev (no VPS)

**Servers** → manual registration → configure `agent/.env` → `npm run dev:agent`.

---

## Clean reset on a VPS

Remove agent container, `deployhub-*` app containers/images, and `/etc/deployhub`. Optional full Docker uninstall — see team runbook or ask in issues. Deleting a server in the UI **does not** remove the agent from the VPS.

---

## Processes to run locally

| Terminal | Command |
|----------|---------|
| App | `npm run dev` |
| Jobs (bootstrap, deploy, webhooks) | `npm run worker` |
| Redis | `docker compose up redis -d` |
