# DeployHub — Architecture

**Version:** 1 · **Scope:** MVP

Defines **how** DeployHub is built. For **what** it must do, see [`SRS.md`](./SRS.md).

---

## 1. Overview

DeployHub separates the **control plane** (orchestration) from the **execution layer** (Agent on VPS).

```text
Browser (React)  →  Backend (Express)  →  Agent (VPS)  →  Docker
                         ↓
                   PostgreSQL + Redis
```

| Component | Role |
|-----------|------|
| **Frontend** | Dashboard UI, forms, live logs |
| **Backend** | REST API, auth, jobs, WebSocket server |
| **Worker** | BullMQ — deployments, webhooks, cleanup |
| **Agent** | Git, Docker, Compose, health checks on VPS |
| **PostgreSQL** | All platform data |
| **Redis** | Job queues + live log fan-out |

---

## 2. Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Vite, React, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand, Zod, Axios |
| Backend | Express, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO |
| Agent | Node.js, TypeScript, Socket.IO client, Git, Docker CLI |

**Express is required.** The Agent does not use Express.

---

## 3. Request Flow

```text
Route → Controller → Service → Prisma / Redis / GitHub / Socket.IO
```

- Controllers: parse request, return response — **no business logic**
- Services: all business rules
- Every query scoped by authenticated `userId`

---

## 4. Communication

### REST API
All CRUD and actions. Auth uses two HTTP-only cookies:

| Cookie | Purpose | Lifetime |
|--------|---------|----------|
| `deployhub_access_token` | JWT for API requests | 15 minutes |
| `deployhub_refresh_token` | Opaque token (hashed in DB) | 7 days |

Refresh via `POST /api/auth/refresh` with token rotation. Frontend axios interceptor retries on 401.

### User WebSocket (browser)
Real-time deployment logs. Socket.IO rooms: `deployment:{id}`

### Agent WebSocket (VPS)
Structured commands only. Separate namespace: `/agent`

**Agent messages (examples):**

```json
{ "type": "DEPLOY", "deploymentId": "...", "method": "DOCKERFILE" }
{ "type": "DEPLOYMENT_LOG", "deploymentId": "...", "message": "Building..." }
{ "type": "DEPLOYMENT_STATUS", "deploymentId": "...", "status": "SUCCESS" }
```

**Rule:** No arbitrary shell commands. Allowlisted operations only.

---

## 5. Deployment Flow

```text
User clicks Deploy
  → API creates Deployment (PENDING)
  → BullMQ job (QUEUED)
  → Worker sends DEPLOY to Agent (RUNNING)
  → Agent executes strategy + streams logs
  → Health check → SUCCESS or FAILED
```

**Statuses:** `PENDING → QUEUED → RUNNING → SUCCESS | FAILED | CANCELLED`

**Concurrency:** One active deployment per Project + Environment.

---

## 6. Deployment Strategies (Agent)

| Method | Agent action |
|--------|--------------|
| Dockerfile | Clone → build → run |
| Docker Compose | Clone → `docker compose up -d` |
| Pre-built image | Pull → run |

**VPS workspace:** `/var/lib/deployhub/{projectId}/{environmentId}/`

---

## 7. Data Model

```text
User
 ├── GitHubIntegration
 ├── Server → Agent
 └── Project
      ├── Service
      ├── Environment → EnvironmentVariable (encrypted secrets)
      └── Deployment → DeploymentLog
```

**Key rule:** Environment owns target server, branch, env vars, and auto-deploy setting.

---

## 8. GitHub Integration

- Connect via **GitHub App** (never store GitHub passwords)
- Short-lived installation token passed to Agent per deployment
- Webhooks: `POST /api/github/webhook` → verify signature → enqueue deployment job

---

## 9. Security

| Area | Approach |
|------|----------|
| Passwords | bcrypt |
| Session | Access JWT + refresh token in HTTP-only cookies |
| Refresh tokens | Hashed in PostgreSQL, rotated on refresh, revoked on logout |
| Email verify | Token hashed in DB; link opens page; user clicks Verify button |
| Email delivery | Resend API (dev: link logged to console) |
| Agent auth | Token per agent, hashed at rest |
| Secrets | AES-256-GCM encryption at rest, masked in UI |
| Agent | Structured commands only — no remote shell |

---

## 10. Frontend Design

Modern, clean developer-tool UI (shadcn/ui + Tailwind):

- Sidebar + header layout shell
- Consistent spacing, status badges, empty states
- Monospace log viewer with auto-scroll
- Secrets always masked
- Inline form validation (Zod)

**Folder rules:**

| Folder | Purpose |
|--------|---------|
| `pages/` | Routed screens |
| `components/` | Reusable UI |
| `services/` | API calls |
| `hooks/` | TanStack Query + custom hooks |
| `stores/` | Zustand client state |

---

## 11. Backend Modules

```text
auth/  users/  servers/  agents/  projects/  environments/
deployments/  github/  health/
```

Services (deployable components) live inside the `projects/` module.

Workers: `deployment.worker`, `webhook.worker`, `cleanup.worker`

---

## 12. Local Development

```text
docker compose up          # PostgreSQL + Redis
npm run dev:backend        # Express + Socket.IO
npm run worker             # BullMQ
npm run dev:frontend       # Vite
npm run dev:agent          # Agent (optional)
```

---

## 13. Repository Structure

```text
DeployHub/
├── frontend/              # Vite + React dashboard
├── backend/               # Express API + workers
│   ├── prisma/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       ├── workers/
│       └── utils/
├── agent/                 # VPS deployment agent
│   ├── src/
│   │   ├── connection/
│   │   ├── commands/
│   │   ├── deployment/strategies/
│   │   ├── docker/
│   │   └── git/
│   └── scripts/
├── docker-compose.yml
├── SRS.md
├── ARCHITECTURE.md
├── PROGRESS.md
└── README.md
```

---

## 14. Key Decisions

| Decision | Choice |
|----------|--------|
| Auth | Access + refresh tokens in HTTP-only cookies |
| Email verify | Manual button click after opening email link |
| Build order | Backend API first, then frontend UI |
| Log storage | PostgreSQL + Socket.IO live stream |
| Webhooks | `github/` module + webhook worker |
| Services | Managed inside `projects/` module |
