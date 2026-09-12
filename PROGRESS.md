# DeployHub — Progress

**Updated:** 2026-09-12 · **Next:** Phase 4 Postman testing (backend ready)

---

## Rules

- **Backend first, then frontend** for each feature
- Finish backend + Postman testing before frontend for that phase
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
- [ ] Frontend auth pages polish + browser verify

**Testing (Postman):** see `TESTING.md` → Phase 2

---

## Phase 3 — GitHub (backend tested ✅)

- [x] GitHubInstallation model + GitHub App env config
- [x] Install URL + callback connect flow API
- [x] List repos + list branches API
- [x] Backend Postman tests pass
- [ ] GitHub settings UI (connect, status, repos, branches)

**Testing (Postman):** see `TESTING.md` → Phase 3

- [x] 3.0 Login → 3.1 Install URL → browser install → 3.3 Integration
- [x] 3.4 List repositories
- [x] 3.5 List branches
- [ ] 3.6 Disconnect GitHub (optional)

---

## Phase 4 — Servers & Agent (backend ready — test in Postman)

- [x] Server model + CRUD API
- [x] Registration token + agent register API
- [x] Agent WebSocket auth + online/offline status
- [x] install.sh endpoint
- [x] Postman Phase 4 folder (4.0–4.4) in cloud collection
- [ ] **Backend Postman tests pass** ← current focus
- [ ] Servers UI (after backend verified)

**Run once:** `npm run db:push` (creates `Server` table)

**Testing (Postman):** see `TESTING.md` → Phase 4

- [ ] 4.0 Session Login → 4.1 Create server
- [ ] 4.2 Register agent
- [ ] 4.3 Get server / list servers
- [ ] 4.4 Agent connects → status ONLINE

---

## Phase 5 — Projects

- [ ] Project, Service, Environment models + API
- [ ] Create project flow + project details UI

---

## Phase 6 — Env Variables

- [ ] Encrypted secrets + Save / Save & Redeploy
- [ ] Env vars UI

---

## Phase 7 — Deployments

- [ ] Deployment worker + agent command protocol
- [ ] Dockerfile, Compose, Image strategies
- [ ] Live logs + deployment history UI

---

## Phase 8 — Health Checks

- [ ] Post-deploy health verification

---

## Phase 9 — Rollback

- [ ] Redeploy previous successful version

---

## Phase 10 — Auto Deploy

- [ ] GitHub webhook → deployment queue

---

## Phase 11 — MVP Done

- [ ] Dashboard polish + pass all 5 acceptance scenarios
