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

## Repository Structure

```text
DeployHub/
├── frontend/           # React dashboard
├── backend/            # Express API + BullMQ workers
├── agent/              # VPS deployment agent
├── docs/               # Design guidelines + doc index
├── docker-compose.yml  # Local Redis (PostgreSQL via Neon)
├── SRS.md              # MVP requirements (frozen)
├── ROADMAP.md          # Post-MVP backlog (1.1 UX + 2.0)
├── ARCHITECTURE.md     # System architecture
├── PROGRESS.md         # MVP phase history
└── TESTING.md          # Postman API testing guide
```

---

## Prerequisites

- **Node.js** 20+ (see `.nvmrc`)
- **Docker** and Docker Compose
- **npm** 10+

---

## Getting Started

### Prerequisites

1. **Node.js 20+** — run `nvm use` if you use nvm
2. **Docker Desktop** — for Redis only (PostgreSQL can be [Neon](https://neon.tech))
3. **Neon account** — for PostgreSQL (`DATABASE_URL` in `backend/.env`)

### Setup (Neon + Docker Redis)

**1. Configure `backend/.env`:**

```env
DATABASE_URL="postgresql://..."          # from Neon dashboard
REDIS_URL="redis://localhost:6379"     # local Docker Redis
CLIENT_URL="http://localhost:5173"
JWT_SECRET="your-secret"
ENCRYPTION_KEY="your-32-char-key"
```

Neon URLs often need `?sslmode=require` at the end — use the connection string Neon gives you.

**2. Install and start Redis:**

```powershell
npm install
docker compose up redis -d
```

**3. Sync database schema to Neon:**

```powershell
npm run db:push
```

**4. Run in development:**

```powershell
npm run dev
```

**Required for deployments and SSH bootstrap** (separate terminal):

```powershell
npm run worker
```

Optional — local agent without Docker on your machine:

```powershell
npm run dev:agent
```

Release 2.0 control plane (when using a real VPS):

```env
PUBLIC_API_URL="https://api.yourdomain.com"
AGENT_DOCKER_IMAGE="ghcr.io/<owner>/deployhub-agent:latest"
```

See [`docs/GHCR-AGENT.md`](./docs/GHCR-AGENT.md).

**5. Build for production check:**

```powershell
npm run build
```

### Verify it works

| Check | URL / command |
|-------|----------------|
| Frontend | http://localhost:5173 |
| API health | http://localhost:5173 → Dashboard shows **API Status: OK** |
| Direct health | http://localhost:3001/api/health |
| Redis running | `docker ps` → `deployhub-redis` |

When health checks pass, the stack is ready for auth and deployments. See [`PROGRESS.md`](./PROGRESS.md) for MVP phase history and [`ROADMAP.md`](./ROADMAP.md) for what comes next.

### URLs (local)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

See [`PROGRESS.md`](./PROGRESS.md) for MVP implementation history.

---

## Project status

| Milestone | State |
|-----------|--------|
| **MVP** | Shipped — full deploy loop ([`PROGRESS.md`](./PROGRESS.md)) |
| **Release 2.0** | **Feature complete — browser QA pending** ([`docs/RELEASE-2.0.md`](./docs/RELEASE-2.0.md), [`docs/V2-QA-REPORT.md`](./docs/V2-QA-REPORT.md)) |
| **Later** | Teams, providers, notifications ([`ROADMAP.md`](./ROADMAP.md)) |

---

## Demo video

Optional for portfolio: record using [`docs/DEMO-SCRIPT.md`](./docs/DEMO-SCRIPT.md), then add the link here:

`Demo:` _(YouTube / Loom URL — not recorded yet)_

---

## Highlights for reviewers

- **Monorepo:** React control panel, Express API, BullMQ workers, Socket.IO live logs, Prisma/Postgres, Redis queues  
- **Agent model:** Lightweight process on each VPS executes Docker/Git deploys; outbound connection to control plane (no inbound SSH required for deploys)  
- **2.0 direction:** One-time SSH bootstrap (credentials not stored) + agent delivered as **Docker image** — not cloning this repo onto customer servers  
- **Docs:** [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/RELEASE-2.0.md`](./docs/RELEASE-2.0.md), frozen MVP scope in [`SRS.md`](./SRS.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [**docs/RELEASE-2.0.md**](./docs/RELEASE-2.0.md) | Current release plan & build phases |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [ROADMAP.md](./ROADMAP.md) | Long-term product backlog |
| [PROGRESS.md](./PROGRESS.md) | MVP phase history |
| [SRS.md](./SRS.md) | MVP requirements (frozen) |
| [docs/DESIGN.md](./docs/DESIGN.md) | UI guidelines |
| [docs/AGENT-SETUP.md](./docs/AGENT-SETUP.md) | Agent install on VPS |
| [docs/GHCR-AGENT.md](./docs/GHCR-AGENT.md) | Publish agent image (GHCR) |
| [docs/BROWSER-SMOKE-CHECKLIST.md](./docs/BROWSER-SMOKE-CHECKLIST.md) | Browser E2E order (after build) |
| [docs/DEMO-SCRIPT.md](./docs/DEMO-SCRIPT.md) | Recruiter demo script |
| [TESTING.md](./TESTING.md) | API testing reference (Postman) |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Git + Postman workflow |

---

## MVP Scope

The MVP delivers a complete deployment workflow: account creation, GitHub integration, server management, agent installation, project configuration, manual and automatic deployments, live logs, health checks, and rollback.

Acceptance criteria: **SRS.md §8**. UI polish and UX improvements are **Release 1.1** — see **ROADMAP.md**.

---

## Development Principles

- Clean architecture with strong separation of concerns
- Backend-first implementation (API before UI)
- Incremental phases — one module at a time
- Modern UI foundation (shadcn/ui) — **professional visual design in Release 1.1**
- No arbitrary shell execution on agents — structured commands only

---

## License

Private project — all rights reserved.
