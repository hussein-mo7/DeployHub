# DeployHub — Agent on VPS (interim)

**Release 2.0** adds **one-time SSH bootstrap** from the UI. Until then, use this guide.

**Canonical plan:** [RELEASE-2.0.md](./RELEASE-2.0.md)

---

## How the agent gets on the VPS (no DeployHub git clone)

1. **Register** — `install.sh` writes `/etc/deployhub/agent.env` (`CONTROL_PLANE_URL`, `AGENT_TOKEN`).
2. **Run agent** — **`docker pull`** + **`docker run`** (official image from CI).  
   Do **not** clone the DeployHub monorepo on the customer VPS.

Build image locally (from repo root):

```bash
docker build -f agent/Dockerfile -t deployhub-agent:local .
```

On VPS after register (when `AGENT_DOCKER_IMAGE` is set on backend, install.sh runs this automatically):

```bash
docker run -d --name deployhub-agent --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --env-file /etc/deployhub/agent.env \
  deployhub-agent:local
```

---

## Backend env (control plane)

```env
PUBLIC_API_URL=https://api.yourdomain.com
AGENT_DOCKER_IMAGE=ghcr.io/you/deployhub-agent:latest
```

Without `AGENT_DOCKER_IMAGE`, install.sh only registers and prints manual Docker commands.

---

## Windows local dev

Use **Servers → Windows (local dev)** in the UI: PowerShell register → `agent/.env` → `npm run dev:agent`.

---

## Release 2.0 target

User pastes SSH key or password **once** → worker runs [`scripts/vps-bootstrap.sh`](../scripts/vps-bootstrap.sh) → Docker agent **ONLINE** → credentials discarded.
