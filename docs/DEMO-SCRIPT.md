# DeployHub — 5-minute demo script

For recruiters or screen recording. Adjust names/URLs to your fork.

---

## Setup (before recording)

- Control plane live (or localhost with tunnel for VPS)
- `PUBLIC_API_URL` + `AGENT_DOCKER_IMAGE` configured ([`GHCR-AGENT.md`](./GHCR-AGENT.md))
- One VPS with SSH access
- GitHub App connected to a small demo repo (Dockerfile deploy)

---

## Script

1. **Hook (15 s)** — “DeployHub is a self-hosted control plane: connect GitHub, add a VPS, deploy with live logs—without cloning my platform repo onto the server.”

2. **Login** — Dashboard, API status OK.

3. **GitHub** — Settings → Integrations → show connected account.

4. **Server** — Create server → open detail → **Install agent via SSH** → show log stream → agent **ONLINE**.

5. **Project** — New project from GitHub repo → production environment on that server → one env var (non-secret is fine).

6. **Deploy** — Deploy → full-screen or panel logs → success → mention health check / URL if applicable.

7. **Close (15 s)** — Stack: React, Express, Postgres, Redis, BullMQ, Socket.IO, agent in Docker on the VPS.

---

## Optional B-roll

- Architecture diagram in [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`RELEASE-2.0.md`](./RELEASE-2.0.md) phase list (SSH one-time, no stored credentials)
