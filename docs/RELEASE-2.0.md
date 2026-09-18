# Release 2.0 — DeployHub

**Status:** Feature complete — **browser QA pending** (see [`V2-QA-REPORT.md`](./V2-QA-REPORT.md))  
**MVP:** Shipped (see [`PROGRESS.md`](../PROGRESS.md))  
**This document:** Single source of truth for 2.0 scope, architecture, and build order.

---

## Product goal (recruiter-friendly one-liner)

**DeployHub 2.0** turns “Add VPS” into a **guided, mostly in-browser** experience: one-time SSH (key or password, **never stored**), automatic agent install via **Docker**, then deploy GitHub apps from the dashboard—without cloning the DeployHub repo onto customer servers.

---

## Architecture after 2.0

```text
Browser (React)
    │
    ▼
Control plane (API + Worker + Postgres + Redis)  ← you host (Neon, Railway, etc.)
    │
    │  WebSocket / jobs
    ▼
Agent (Docker on customer VPS)  ← only component on target server
    │
    ▼
User’s app containers (cloned from their GitHub at deploy time)
```

| On VPS | Not on VPS |
|--------|------------|
| Agent container, Docker, Git | DeployHub frontend/backend source |
| User app images/containers | User’s DeployHub monorepo clone |

---

## How the agent is installed (answer: **Docker pull**, not git clone)

### Target flow (2.0 — after one-time SSH)

1. User creates server in UI → enters **host, port, SSH user**, and **private key OR password** (one time).
2. Backend **worker** opens SSH, runs **`scripts/vps-bootstrap.sh`** (idempotent):
   - Ensure Docker (+ Git) installed  
   - `POST /api/agents/register` (registration token created server-side)  
   - Write `/etc/deployhub/agent.env`  
   - **`docker pull $AGENT_DOCKER_IMAGE`**  
   - **`docker run`** agent with `--env-file` + `/var/run/docker.sock`  
3. Credentials **discarded** from memory; UI shows bootstrap log → **ONLINE**.
4. Ongoing: deploy/logs/env via **agent only** (no stored SSH).

**No `git clone` of DeployHub on the VPS.** The agent ships as a **pre-built image** from CI (private repo → public GHCR image).

**Manual fallback** (no SSH from UI): see [`AGENT-SETUP.md`](./AGENT-SETUP.md).

---

## Build phases (do in order)

### Phase 1 — Foundation ✅ done

- [x] `PUBLIC_API_URL` in backend env (install script + UI commands)  
- [x] `agent/Dockerfile` + `npm run docker:agent`  
- [x] `AGENT_DOCKER_IMAGE` env + install.sh pulls/runs container when set  
- [x] `GET /api/config/public` for frontend  
- [x] Docs + README aligned with 2.0  

### Phase 2 — Server UX (in progress)

- [x] Servers page: stat chips  
- [x] Setup panel reads public config (Docker vs manual hints)  
- [x] SSH bootstrap panel + create-server copy points to install flow  
- [ ] Browser sign-off: projects, deployments, settings ([`V2-QA-REPORT.md`](./V2-QA-REPORT.md))  

### Phase 3 — One-time SSH bootstrap

- [x] Server detail: SSH key **or** password  
- [x] `POST /servers/:id/bootstrap` → BullMQ job → `ssh2` + `vps-bootstrap.sh`  
- [x] Stream logs to UI (Socket.IO)  
- [x] Never persist credentials; store host/port/user only  
- [x] Re-run bootstrap from server page (repair / retry)  

### Phase 4 — Polish for portfolio

- [x] CI workflow skeleton: [`.github/workflows/agent-docker.yml`](../.github/workflows/agent-docker.yml) → GHCR  
- [x] GHCR setup doc (public package + private `docker login` note) — [`GHCR-AGENT.md`](./GHCR-AGENT.md)  
- [x] Control plane env documented (`PUBLIC_API_URL`, `AGENT_DOCKER_IMAGE`)  
- [x] Demo script — [`DEMO-SCRIPT.md`](./DEMO-SCRIPT.md)  
- [x] Browser smoke checklist — [`BROWSER-SMOKE-CHECKLIST.md`](./BROWSER-SMOKE-CHECKLIST.md) (run after build complete)  
- [ ] Record demo / link video in README  

---

## Security (SSH bootstrap)

- [x] HTTPS `PUBLIC_API_URL` required in production for bootstrap  
- [x] Job timeout + SSH ready timeout (env)  
- [x] No logging of keys/passwords  
- [x] User consent copy before connect  
- [x] Rate limit bootstrap per account  

---

## Documentation map

| Doc | Purpose |
|-----|---------|
| **RELEASE-2.0.md** (this file) | Scope & phases |
| [DESIGN.md](./DESIGN.md) | UI guidelines |
| [AGENT-SETUP.md](./AGENT-SETUP.md) | VPS agent (SSH + manual) |
| [V2-QA-REPORT.md](./V2-QA-REPORT.md) | Pre-test audit & page matrix |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System design |
| [ROADMAP.md](../ROADMAP.md) | Long-term product backlog |
| [PROGRESS.md](../PROGRESS.md) | MVP history (frozen) |
| [TESTING.md](../TESTING.md) | API testing reference |

Removed as redundant with this file: ~~NEXT-VERSION-REVIEW.md~~, ~~UI-SECTIONS.md~~ (1.1 tracker), ~~RECOMMENDATIONS-AGENT-ONBOARDING.md~~ (merged here).

---

## Changelog

| Date | Note |
|------|------|
| 2026-09-17 | 2.0 kickoff: doc consolidation, PUBLIC_API_URL, agent Docker |
