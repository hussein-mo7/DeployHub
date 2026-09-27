# DeployHub

A self-hosted deployment orchestration platform for deploying containerized applications to your own Linux VPS servers.

DeployHub provides a centralized control panel for managing servers, projects, deployments, environments, GitHub repositories, logs, and health checks — with a lightweight Agent that runs on each target server.

---

## What It Does

```text
Register → Connect GitHub → Add VPS → Install Agent → Create Project → Deploy
```

DeployHub supports:

- **Dockerfile** deployments
- **Docker Compose** multi-service deployments
- **Pre-built Docker image** deployments
- Real-time deployment logs
- Environment variables and encrypted secrets
- Health checks and rollback
- Automatic deployments via GitHub webhooks

---

## Architecture

```text
┌─────────────┐     ┌─────────────────────────┐     ┌─────────────┐
│  Frontend   │────▶│  Backend (Control Plane)│────▶│    Agent    │
│  React UI   │◀────│  Express + PostgreSQL   │◀────│  on VPS     │
└─────────────┘     │  Redis + BullMQ         │     └──────┬──────┘
                    └─────────────────────────┘            │
                                                           ▼
                                                    Docker / Compose
```

| Layer | Tech |
|-------|------|
| Frontend | Vite, React, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand |
| Backend | Express, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO |
| Agent | Node.js, TypeScript, Docker, Git |

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for full system design.

---

## Quick start (local)

1. **Node 20+**, **Docker** (Redis), **Neon** (or Postgres) — see `.nvmrc`
2. Copy `backend/.env.example` → `backend/.env` (`DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, …)
3. `npm install` · `docker compose up redis -d` · `npm run db:push`
4. **Terminal 1:** `npm run dev` · **Terminal 2:** `npm run worker`
5. Open http://localhost:5173 — dashboard **API Status: OK**

**Real VPS from localhost:** set `PUBLIC_API_URL` to a tunnel or deployed API URL and `AGENT_DOCKER_IMAGE` — see [`docs/OPERATIONS.md`](./docs/OPERATIONS.md).

| Check | URL |
|-------|-----|
| Frontend | http://localhost:5173 |
| API health | http://localhost:3001/api/health |

---

## Project status

| Milestone | State |
|-----------|--------|
| **MVP** | Shipped — auth, GitHub, deploy loop, logs, env, rollback |
| **Release 2.0** | SSH bootstrap + agent via Docker image — **UX/QA polish ongoing** |
| **Next** | [`docs/PRODUCT-IMPROVEMENT-PLAN.md`](./docs/PRODUCT-IMPROVEMENT-PLAN.md) |

Long-term backlog: [`ROADMAP.md`](./ROADMAP.md). Frozen MVP scope: [`SRS.md`](./SRS.md).

---

## Demo video

Optional: record with [`docs/DEMO-SCRIPT.md`](./docs/DEMO-SCRIPT.md), then add URL here:

`Demo:` _(not recorded yet)_

---

## Highlights for reviewers

- **Monorepo:** React control panel, Express API, BullMQ workers, Socket.IO live logs, Prisma/Postgres, Redis  
- **Agent:** Outbound WebSocket from VPS; structured deploy commands (Docker/Git), not arbitrary shell from the UI  
- **2.0:** One-time SSH bootstrap, agent as **GHCR image** — customer VPS never clones this repo  
- **Docs:** [`docs/README.md`](./docs/README.md) (index), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/OPERATIONS.md`](./docs/OPERATIONS.md)

---

## Documentation

| Read this | Why |
|-----------|-----|
| [**docs/README.md**](./docs/README.md) | Full doc index |
| [**docs/PRODUCT-IMPROVEMENT-PLAN.md**](./docs/PRODUCT-IMPROVEMENT-PLAN.md) | Current priorities (session, UX, agent buildx, …) |
| [**docs/OPERATIONS.md**](./docs/OPERATIONS.md) | VPS, GHCR, `PUBLIC_API_URL` |
| [**docs/RELEASE-2.0.md**](./docs/RELEASE-2.0.md) | 2.0 scope snapshot |
| [**docs/TESTING.md**](./docs/TESTING.md) | Postman API phases |
| [**docs/BROWSER-SMOKE-CHECKLIST.md**](./docs/BROWSER-SMOKE-CHECKLIST.md) | Browser E2E |
| [**docs/DESIGN.md**](./docs/DESIGN.md) | UI guidelines |

Root [`TESTING.md`](./TESTING.md) redirects to `docs/TESTING.md`.

---

## Repository structure

```text
DeployHub/
├── frontend/           # React dashboard
├── backend/            # Express API + BullMQ workers
├── agent/              # VPS deployment agent
├── docs/               # Operations, testing, improvement plan
├── docker-compose.yml  # Local Redis
├── ARCHITECTURE.md
├── ROADMAP.md
└── SRS.md
```

---

## MVP scope

The MVP delivers account creation, GitHub integration, servers, agent install, projects, manual/auto deploy, live logs, health checks, and rollback. Acceptance: **SRS.md §8**. Visual polish: **ROADMAP.md** + improvement plan.

---

## Development principles

- Clean architecture, backend-first phases  
- Structured agent commands only (no arbitrary VPS shell from the product)  
- Incremental delivery with Postman/browser verification  

---

## License

Private project — all rights reserved.
