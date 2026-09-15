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

Optional (separate terminals):

```powershell
npm run worker
npm run dev:agent
```

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
| **MVP** | Shipped — deploy loop, agent, webhooks, rollback, secrets (API) |
| **Release 1.1** | Planned — professional UI, env secret reveal, design system ([`ROADMAP.md`](./ROADMAP.md)) |
| **2.0** | Backlog — teams, notifications, advanced deploy ([`ROADMAP.md`](./ROADMAP.md) §2 P2) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [SRS.md](./SRS.md) | MVP functional requirements (frozen) |
| [ROADMAP.md](./ROADMAP.md) | Post-MVP product & UX backlog |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, folder structure, tech decisions |
| [PROGRESS.md](./PROGRESS.md) | MVP phased implementation tracker |
| [docs/DESIGN.md](./docs/DESIGN.md) | UI guidelines for Release 1.1 |
| [TESTING.md](./TESTING.md) | Postman API testing guide |
| [docs/README.md](./docs/README.md) | Documentation index |

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
