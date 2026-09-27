# Release 2.0 — DeployHub

**Status:** Feature complete in repo — **browser QA & UX polish in progress** ([PRODUCT-IMPROVEMENT-PLAN.md](./PRODUCT-IMPROVEMENT-PLAN.md))  
**MVP:** Shipped (history: [archive/MVP-PROGRESS.md](./archive/MVP-PROGRESS.md))

---

## One-liner

**DeployHub 2.0** turns “Add VPS” into a **guided, mostly in-browser** flow: one-time SSH (credentials **not stored**), agent install via **Docker image**, then deploy from GitHub — **without cloning this monorepo onto customer servers**.

---

## Architecture

```text
Browser (React) → Control plane (API + Worker + Postgres + Redis)
                        ↕ WebSocket / jobs
                  Agent (Docker on VPS) → user's app containers
```

| On VPS | Not on VPS |
|--------|------------|
| Agent container, Docker, Git, user apps | DeployHub frontend/backend source |

**Operations (install, GHCR, env):** [OPERATIONS.md](./OPERATIONS.md)

---

## Phase checklist

### Foundation ✅

- [x] `PUBLIC_API_URL`, `AGENT_DOCKER_IMAGE`, `GET /api/config/public`
- [x] `agent/Dockerfile`, `install.sh`, CI → GHCR

### Server UX ✅ (QA ongoing)

- [x] SSH bootstrap panel, live logs, manual token fallback
- [ ] Full browser sign-off — [BROWSER-SMOKE-CHECKLIST.md](./BROWSER-SMOKE-CHECKLIST.md)

### SSH bootstrap ✅

- [x] BullMQ + `ssh2` + `vps-bootstrap.sh`, no stored credentials, rate limits

### Portfolio polish 🟡

- [x] Demo script, smoke checklist, GHCR docs (now in OPERATIONS)
- [ ] Demo video in README
- [ ] Agent image includes **docker buildx** (see PLT-1 in improvement plan)

---

## Security (bootstrap)

HTTPS `PUBLIC_API_URL` in production · job timeouts · no logging of SSH secrets · user consent · rate limits.

---

## Doc map (current)

| Doc | Purpose |
|-----|---------|
| **OPERATIONS.md** | Run agent on VPS, GHCR, control plane env |
| **PRODUCT-IMPROVEMENT-PLAN.md** | Active issues & build order |
| **RELEASE-2.0.md** (this file) | 2.0 scope snapshot |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System design |
