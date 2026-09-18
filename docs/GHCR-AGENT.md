# Publish the DeployHub agent image (GHCR)

The VPS never clones this repo. The agent runs from a **pre-built image** pushed by CI.

**Workflow:** [`.github/workflows/agent-docker.yml`](../.github/workflows/agent-docker.yml)  
**Image name pattern:** `ghcr.io/<github-owner>/deployhub-agent:latest`

---

## One-time setup

### 1. Push to `main` (or run workflow manually)

CI builds `agent/Dockerfile` and pushes to GHCR when `agent/**` or the workflow file changes.

GitHub → **Actions** → **Publish agent image** → confirm a green run.

### 2. Make the package public (recommended for portfolio VPS)

1. GitHub → your profile or org → **Packages**
2. Open **deployhub-agent**
3. **Package settings** → **Change visibility** → **Public**

Private packages work if every VPS runs `docker login ghcr.io` first (not ideal for demos).

### 3. Control plane env

On the machine hosting the API (local `.env` or production host):

```env
PUBLIC_API_URL=https://api.yourdomain.com
AGENT_DOCKER_IMAGE=ghcr.io/<github-owner>/deployhub-agent:latest
```

Replace `<github-owner>` with your GitHub username or org (same as `github.repository_owner` in CI).

Restart API + **worker** after changing env.

### 4. Verify from UI

**GET** `/api/config/public` should return:

```json
{
  "publicApiUrl": "https://api.yourdomain.com",
  "agentDockerImage": "ghcr.io/you/deployhub-agent:latest",
  "agentInstallMode": "docker"
}
```

Servers → open a server → **Install agent via SSH** should be enabled (not “manual only”).

---

## Local image (no GHCR)

From repo root:

```powershell
npm run docker:agent
```

Set `AGENT_DOCKER_IMAGE=deployhub-agent:local` only on a dev control plane; VPS must reach that tag (usually dev-only).
