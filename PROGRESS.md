# DeployHub — Progress

**Updated:** 2026-09-15 · **MVP:** complete (backend + functional UI) · **Next:** [ROADMAP.md](./ROADMAP.md) — Release **1.1 Product & UX**

---

## After MVP

All new work is tracked in **[ROADMAP.md](./ROADMAP.md)** (UX audit, env secret reveal, design system, settings, 2.0 features).  
UI rules: **[docs/DESIGN.md](./docs/DESIGN.md)**.

---

## Deferred until 1.1 (was “after MVP phases”)

- Professional UI (not just functional pages)
- Secret reveal (eye) on environment variables
- Auth / GitHub / dashboard visual polish
- Optional backend refinements discovered during polish

## Rules (MVP — historical)

- **Backend first, then frontend** for each feature
- Finish backend + Postman testing before frontend for that phase
- **UI polish deferred** during MVP — design pass is Release 1.1
- One phase at a time — verify before moving on
- Mark `[x]` only when done and tested

---

## Phase 0 — Documentation ✅

- [x] SRS, Architecture, Progress, README, project config files

---

## Phase 1 — Foundation ✅

- [x] Monorepo, backend, frontend, agent, Docker Redis, Neon PostgreSQL

**Testing (Postman):** see `TESTING.md` → Phase 1

- [x] 1.1 Health check — DB + Redis connected
- [x] 1.2 API root — returns name + version

---

## Phase 2 — Auth (backend tested ✅)

- [x] User model + register / login / logout API
- [x] Access + refresh tokens (HTTP-only cookies, rotation)
- [x] Email verification API + Resend integration (dev: console link fallback)
- [x] Postman collection + environment (cloud workspace)
- [x] Backend Postman tests pass
- [ ] Auth UI polish (Release 1.1 — see ROADMAP)

**Testing (Postman):** see `TESTING.md` → Phase 2

---

## Phase 3 — GitHub (backend tested ✅)

- [x] GitHubInstallation model + GitHub App env config
- [x] Install URL + callback connect flow API
- [x] List repos + list branches API
- [x] Backend Postman tests pass
- [x] GitHub settings UI (functional — polish in 1.1)

**Testing (Postman):** see `TESTING.md` → Phase 3

- [x] 3.0 Login → 3.1 Install URL → browser install → 3.3 Integration
- [x] 3.4 List repositories
- [x] 3.5 List branches
- [ ] 3.6 Disconnect GitHub (optional)

---

## Phase 4 — Servers & Agent ✅

- [x] Server model + CRUD API
- [x] Registration token + agent register API
- [x] Agent WebSocket auth + online/offline status
- [x] install.sh endpoint
- [x] Postman Phase 4 folder in cloud collection
- [x] Backend Postman tests pass (agent ONLINE verified)
- [x] Servers UI (functional — polish in 1.1)

**Testing (Postman):** see `TESTING.md` → Phase 4

---

## Phase 5 — Projects ✅

- [x] Project, Service, Environment models + API
- [x] Postman tests pass
- [x] Create project flow + project details UI (functional only)

**Testing (Postman):** see `TESTING.md` → Phase 5

---

## Phase 6 — Env Variables ✅

- [x] Encrypted secrets + Save / Save & Redeploy API
- [x] Postman tests pass
- [x] Env vars UI (functional only)
- [ ] Secret reveal + table UX (Release 1.1 — ROADMAP P0)

**Testing (Postman):** see `TESTING.md` → Phase 6

---

## Phase 7 — Deployments ✅

- [x] Deployment model + queue worker + agent DEPLOY protocol
- [x] Dockerfile, Compose, Image strategies (agent)
- [x] Live logs (Socket.IO + worker Redis relay) + deployment UI
- [x] Service host port publishing for local browser access

**Testing (Postman):** see `TESTING.md` → Phase 7

---

## Phase 8 — Health Checks ✅

- [x] Service health check config + agent HTTP verify
- [x] Postman + TESTING.md Phase 8 verified locally

**Testing (Postman):** see `TESTING.md` → Phase 8

---

## Phase 9 — Rollback ✅

- [x] branch + gitCommitSha + rollback API + UI
- [x] Postman Phase 9 verified locally

**Testing (Postman):** see `TESTING.md` → Phase 9

---

## Phase 10 — Auto Deploy ✅

- [x] GitHub webhook + worker + WEBHOOK deployments
- [x] Postman 10.1 + 10.2 verified locally

**Testing (Postman):** see `TESTING.md` → Phase 10

---

## Phase 11 — MVP acceptance ✅

- [x] Dashboard, Deployments, Settings (functional)
- [x] SRS §8 scenarios validated (API and/or UI)

**Testing:** see `TESTING.md` → Phase 11

---

## Release 1.1 — Product & UX (in progress)

Track tasks in **[ROADMAP.md](./ROADMAP.md)** §2. Start with **secret reveal** + **design tokens**.
