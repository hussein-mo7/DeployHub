# DeployHub — Requirements (SRS)

**Version:** 1 · **Scope:** MVP

Defines **what** DeployHub must do. For **how** it is built, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 1. Product Summary

DeployHub is a **self-hosted deployment platform**. Users manage deployments from a web dashboard; a lightweight **Agent** on each VPS runs Docker operations.

```text
User → DeployHub Dashboard → Agent on VPS → Docker / Compose → Application
```

**Not in scope:** hosted cloud platform, CMS, Node.js-only apps, arbitrary remote shell.

---

## 2. Core Concepts

| Term | Meaning |
|------|---------|
| **User** | Account owner |
| **Server** | Linux VPS registered as deploy target |
| **Agent** | Software on VPS that executes deployments |
| **Project** | Deployable application (may have multiple Services) |
| **Service** | One deployable component inside a Project |
| **Environment** | Deployment context (Production, Staging, etc.) |
| **Deployment** | One deploy attempt with status and logs |

**Deployment methods:** Dockerfile · Docker Compose · Pre-built Docker image

---

## 3. Product Model

```text
User
 ├── Servers
 │    └── Projects
 │         ├── Services
 │         ├── Environments (server, branch, env vars)
 │         └── Deployments → Logs
 └── GitHub Integration → Repositories
```

---

## 4. Functional Requirements

### 4.1 Authentication

- Register with name, email, password
- **Email verification** — send link on register; user opens link and clicks **Verify** button (no auto-verify on link open)
- Login only after email is verified
- Logout and protected routes
- **Access token** (short-lived) + **refresh token** (long-lived), both in HTTP-only cookies
- Refresh token rotation on `/api/auth/refresh`
- Passwords hashed — never stored in plaintext
- Resend verification email option

### 4.2 GitHub

- Connect via **GitHub App** (no GitHub password storage)
- List and select authorized repositories
- Select branch or source reference
- Support private repositories
- Webhooks for automatic deployments (separate from OAuth)

### 4.3 Servers

- Add and manage Linux VPS servers
- Generate agent installation command per server
- One-time registration token for agent setup
- Display status: Online, Offline, Connecting, Unregistered, Unhealthy
- Support multiple servers per user

### 4.4 Agent

- Persistent WebSocket connection to control plane
- Execute structured commands only — **no arbitrary shell**
- Git clone/pull, Docker build/run, Compose, image pull
- Stream logs and report deployment status
- Run health checks after deploy
- Auto-reconnect on connection loss
- Run as persistent Linux service (systemd)

### 4.5 Projects & Services

- Create projects with name, description, deployment config
- Project may contain one or many Services
- Multiple projects can run on the same server
- Each Service supports Dockerfile, Compose, or image deployment

### 4.6 Environments

- Multiple environments per project (Production, Staging, Development)
- Each environment defines: target server, branch/tag, env vars, auto-deploy toggle

### 4.7 Deployments

- Manual deploy from dashboard
- Record version: commit SHA, branch, tag, or image reference
- Async job queue — API must not block on long deploys
- Status lifecycle: Pending → Queued → Running → Success / Failed / Cancelled
- One active deployment per project + environment at a time
- Real-time logs streamed from agent to dashboard
- Deployment history with trigger source and timestamps

**Agent deploy steps (git-based):**
1. Clone/checkout source → 2. Build or pull image → 3. Start containers → 4. Apply env vars → 5. Health check → 6. Report result

### 4.8 Environment Variables & Secrets

- Configure env vars per project/service/environment
- Encrypt secrets at rest; mask in UI, API, and logs
- **Save** — store config, running app unchanged
- **Save & Redeploy** — store config + trigger new deployment

### 4.9 Health Checks

- Verify HTTP endpoint, container health, or service readiness after deploy
- Failed health check = failed deployment

### 4.10 Rollback

- Redeploy a previous successful version using stored metadata
- Must not rely on uncontrolled `git pull`

### 4.11 Automatic Deployments

- GitHub push → webhook → deployment queue → agent
- Only for projects/environments with auto-deploy enabled

### 4.12 Dashboard & UI

**Dashboard:** server count, online/offline status, projects, recent deployments, failures

**Project details:** services, environment, source, method, env vars, history, logs, health, rollback

---

## 5. Authorization

- Account-level isolation — users access only their own resources
- No cross-user access to servers, projects, deployments, secrets, or GitHub data
- Team RBAC is future scope

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | Auth, encrypted secrets, agent tokens, rate limiting, no remote shell |
| **Reliability** | Agent reconnection, job retry, deployment state preserved |
| **Performance** | Async deploys, real-time logs without page refresh |
| **Scalability** | Multiple users, servers, projects, concurrent jobs |
| **Observability** | Status, logs, health checks on every deployment |

**Background jobs:** BullMQ for deployments and webhooks. Worker orchestrates; Agent executes.

---

## 7. MVP Features

| Area | Included |
|------|----------|
| Auth | Register, login, logout, protected routes |
| GitHub | App connect, repos, branches, private repos, webhooks |
| Servers | Add server, agent install, online status |
| Projects | Create, configure source/method/server/environment |
| Deploy | Dockerfile, Compose, image — manual + auto |
| Config | Env vars, encrypted secrets, Save / Save & Redeploy |
| Ops | Live logs, health checks, history, rollback |

---

## 8. MVP Acceptance Criteria

MVP is complete when all five scenarios pass:

**1. Dockerfile deploy**
Register → login → connect GitHub → add VPS → install agent → create project → configure env → deploy → logs stream → health check passes → success

**2. Docker Compose deploy**
Multi-service app (e.g. frontend + backend + postgres + redis) as one project

**3. Environment update**
- Save: config changes, app keeps running
- Save & Redeploy: new deployment, containers updated

**4. Rollback**
Select previous successful deployment → redeploy that version

**5. Auto deploy**
Enable auto-deploy → GitHub push triggers deployment

---

## 9. Priorities

**P0 (required):** Auth, GitHub, servers, agent, projects, all deploy methods, queue, logs, health checks, env vars, history, rollback

**P1 (important):** Auto deploy via webhook, dashboard polish, agent reconnection, deploy cancellation

**P2 (future):** Teams, RBAC, monitoring, notifications, blue/green, canary, preview envs, other git providers, billing

---

## 10. Constraints

1. Deployed apps must be containerized (Docker)
2. Agent runs on user's VPS — user owns infrastructure
3. GitHub via App only — no password collection
4. Env var changes do not auto-redeploy (unless Save & Redeploy)
5. Multiple projects per server; multiple services per project
6. Reliable deploy workflows over advanced infra features

---

## 11. Design Principles

- **Simple** — deploy without manual SSH each time
- **Self-hosted** — apps run on user infrastructure
- **Separated** — control plane orchestrates, agent executes
- **Container-first** — Docker is the deployment unit
- **Secure by default** — secrets and agent comms protected
- **Observable** — always know what, where, which version, and why it failed
