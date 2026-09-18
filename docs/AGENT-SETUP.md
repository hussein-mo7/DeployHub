# DeployHub — Agent on VPS

**Canonical plan:** [RELEASE-2.0.md](./RELEASE-2.0.md)

The agent is **not** installed by cloning this monorepo on the customer VPS. It runs from a **Docker image** (`docker pull` + `docker run`).

---

## Recommended: SSH bootstrap (UI)

1. **Servers** → create a server → open its detail page.
2. **Install agent via SSH** — host, port, user, private key **or** password (one time).
3. Watch the log panel; when the script finishes, status moves to **CONNECTING** then **ONLINE** when the agent heartbeats.

Credentials are **not stored**; only host, port, and SSH username are saved for display.

**Requires on control plane:**

```env
PUBLIC_API_URL=https://api.yourdomain.com
AGENT_DOCKER_IMAGE=ghcr.io/<owner>/deployhub-agent:latest
```

See [`GHCR-AGENT.md`](./GHCR-AGENT.md). API and **worker** must both be running.

---

## Manual fallback (SSH yourself)

1. Create server in UI → copy registration token / install command.
2. On VPS:

```bash
curl -fsSL "$PUBLIC_API_URL/api/agents/install.sh" | bash -s -- <REGISTRATION_TOKEN>
```

With `AGENT_DOCKER_IMAGE` set, `install.sh` also pulls and runs the agent container.

---

## Build image locally

```powershell
npm run docker:agent
```

---

## Windows local dev (no VPS)

**Servers** → use the Windows dev path: register via PowerShell → `agent/.env` → `npm run dev:agent`.

---

## Worker script (reference)

The bootstrap worker runs [`scripts/vps-bootstrap.sh`](../scripts/vps-bootstrap.sh) over SSH (Docker + Git + `install.sh`).
