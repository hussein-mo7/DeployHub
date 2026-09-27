# DeployHub — Product & engineering improvement plan

**Author lens:** senior product + full-stack mentor review  
**Date:** 2026-09-27  
**Trigger:** Real VPS test (ngrok + manual install + deploy), browser QA, and recruiter-readiness goal  

This document is the **single source of truth** for what to fix next. Implementation order is at the bottom. UX tables in [`ROADMAP.md`](../ROADMAP.md) stay valid but **defer to this plan** when they conflict. Doc index: [`README.md`](./README.md).

---

## 1. North star (what “done” looks like for recruiters)

A reviewer should be able to:

1. Read **one** README + **one** architecture doc and understand the system in 5 minutes.  
2. Open the **live or demo** app and follow a **guided path**: connect GitHub → add server → install agent → create project → deploy → see logs — without reading source code.  
3. See **production-minded** code: session handling, clear errors, no placeholder env in install scripts, agent image that works on real VPS Docker.  
4. Skim the repo and find **consistent UI**, routed settings/project sections, and no “everything on one endless page.”

We are **not** building multi-tenant admin or hosted PaaS yet ([`ROADMAP.md`](../ROADMAP.md) §14).

---

## 2. What we proved in testing (2026-09-27)

| Area | Result | Takeaway |
|------|--------|----------|
| Local API + ngrok + VPS | Works for HTTP (`/api/health`, `install.sh`) | Operators need `PUBLIC_API_URL`; users never use `localhost` on VPS |
| Manual `install.sh` | Registers agent; Docker step skipped if Docker missing | **SSH bootstrap** is the intended path (installs Docker first) |
| Agent in Docker on VPS | Alpine `docker-cli` has **no buildx** | **P0 platform bug** — modern Dockerfiles (BuildKit `--mount`) fail until buildx ships in agent image |
| Mounting host `/usr/bin/docker` into Alpine agent | **Breaks** (`exec … no such file or directory`) | glibc binary ≠ musl container — do not document host binary mount |
| ngrok + agent WebSocket | Intermittent `xhr poll error`, then reconnect | Acceptable for dev; **production needs stable HTTPS API** |
| Deploy logs | Git progress lines interleave | Likely **parallel deploys** or stderr mixing — UX + queue discipline |
| Portfolio / Next.js on small VPS | Build heavy; easy OOM | Demo should offer **simple Dockerfile** sample repo or build resources guidance |

---

## 3. Issue register

Severity: **P0** = blocks trust or deploy · **P1** = hurts daily use · **P2** = polish · **P3** = nice-to-have  

### 3.1 Auth & session (P0 — user reported)

| ID | Issue | Evidence / hypothesis | Fix direction |
|----|--------|----------------------|-------------|
| AUTH-1 | User logged out ~15 minutes after login | Matches default `ACCESS_TOKEN_TTL_SECONDS=900`; refresh may not run or may fail silently | **Reproduce:** idle 16m, single tab; watch Network for `POST /api/auth/refresh` and cookies |
| AUTH-2 | Refresh may not recover session on first load | `initialize()` calls `getMe()` only; relies on axios interceptor (401 → refresh → retry) | Add explicit **refresh-then-me** in `initialize()` when `getMe` returns 401 |
| AUTH-3 | Proactive refresh interval | `SessionManager` refreshes at ~80% TTL ([`session-refresh-interval.ts`](../frontend/src/lib/session-refresh-interval.ts)) | Log refresh failures in dev; surface **one** toast on repeated failure before logout |
| AUTH-4 | Refresh cookie path | Refresh cookie `path: /api/auth` ([`cookies.ts`](../backend/src/utils/cookies.ts)) | Confirm browser sends cookie on `/api/auth/refresh` via Vite proxy (should — verify in Application → Cookies) |
| AUTH-5 | No user-visible “session extended” | By design | Optional: subtle “Still signed in” only in dev |

**Acceptance:** Leave tab open 20+ minutes with API running; navigate pages — **no** redirect to login. API restart with valid refresh cookie — still logged in after refresh.

---

### 3.2 Settings & routing (P0 — user reported)

| ID | Issue | Evidence | Fix direction |
|----|--------|----------|---------------|
| SET-1 | Refresh on GitHub section opens **Profile** | [`SettingsPage.tsx`](../frontend/src/pages/settings/SettingsPage.tsx) uses `useState("profile")` for section — **not in URL** | Use **`/settings/integrations`** and **`/settings/profile`** routes (or `?tab=integrations` synced on load + nav) |
| SET-2 | `/settings/github` only handles OAuth return | Redirect to `?github=connected` then strips query | Keep callback route; land on **integrations** tab via path |
| SET-3 | Success/error feedback | Inline banners only | Toasts for connect/disconnect/save (see UI-3) |

**Acceptance:** Open Integrations → F5 → still Integrations. Share URL with `?tab=` or path — same section.

---

### 3.3 Server create & agent install (P0–P1)

| ID | Issue | Evidence | Fix direction |
|----|--------|----------|---------------|
| SRV-1 | Flow feels cluttered after create | List page shows setup panel + create form + list | **Wizard or dedicated** `/servers/new` → `/servers/:id/setup` with steps: Name → Install (SSH recommended) → Verify ONLINE |
| SRV-2 | Manual install command uses wrong URL if `PUBLIC_API_URL` unset | Defaults to `localhost:3001` in dev | UI **banner** when `publicApiUrl` is localhost: “VPS cannot use this command until you set PUBLIC_API_URL” |
| SRV-3 | Two servers from repeated install tests | User confusion | Empty state copy + “one server per VPS” hint |
| SRV-4 | Delete server does not clean VPS | By design | Confirm dialog: **“Removes from DeployHub only; agent/containers stay on the VPS.”** |
| SRV-5 | SSH bootstrap vs manual not guided | User used manual curl | Default CTA: **Install via SSH**; manual behind “Advanced” |
| SRV-6 | Worker required | Bootstrap/deploy 503 without worker | Dashboard banner if health OK but worker queue unreachable (future) |

**Target flow (server):**

```text
Servers → Add server (name only)
  → Server detail (status OFFLINE)
  → Step 2: Install agent (SSH panel OR advanced manual)
  → Live bootstrap logs
  → Status CONNECTING → ONLINE
  → Step 3: “Create a project on this server” (link)
```

---

### 3.4 Project create & detail IA (P0 — user reported)

| ID | Issue | Evidence | Fix direction |
|----|--------|----------|---------------|
| PRJ-1 | One long **Project detail** page | [`ProjectDetailPage.tsx`](../frontend/src/pages/projects/ProjectDetailPage.tsx) — services, envs, deploy mixed | Split routes under project shell |
| PRJ-2 | No guided “first deploy” | User lost in forms | **Checklist** component: GitHub connected → server ONLINE → service defined → env bound → deploy |
| PRJ-3 | Repo owner/name typed manually | Error-prone | **Repo picker** from GitHub API (already in Settings repos query) |
| PRJ-4 | Env vars + logs + deploy same scroll | ROADMAP §1 | Tab or sub-nav per environment |
| PRJ-5 | Env vars added **one row at a time** only | Current env UI | **Bulk paste** (Render-style) — see below |

#### PRJ-5 — Bulk environment variables (Render-style)

**Problem:** Users migrating from Render/Railway/Vercel expect to paste a whole `.env` block once, not click “add variable” dozens of times.

**UX (target):**

- On environment **Variables** tab, two modes (tabs or toggle):
  - **Editor** — existing table (key, value, secret, reveal, delete)
  - **Bulk import** — large monospace textarea + **Parse & preview**
- Accept common paste formats:
  - `KEY=value` (one per line)
  - Optional `export KEY=value`
  - Double-quoted values (`KEY="value with spaces"`)
  - `# comments` and blank lines ignored
  - Optional `.env` file **Upload** (read client-side only; never log contents)
- **Preview table** before save: parsed rows, flag duplicates, invalid keys (env key rules), warn on overwrite of existing keys
- Per-row **“Mark as secret”** checkbox in preview (default: secret if value looks sensitive or user checks “Mark all as secret”)
- **Import** merges into environment (same API as save variables batch) + optional **“Save & redeploy”**
- Help text: “Paste from Render → Environment → Export” (or copy `.env` locally)

**Backend:** Prefer existing batch save endpoint if present; if not, add `PUT/PATCH .../variables/bulk` with validation + max size limit (e.g. 100 keys, 64KB total) to avoid abuse.

**Acceptance:** Paste 20-line `.env` → preview shows 20 rows → save → table matches → deploy receives vars.

**Target IA (project):**

```text
/projects/:projectId
  /overview          — repo, branch, status, checklist
  /services          — Dockerfile / compose / image
  /environments      — list environments
  /environments/:envId
      /variables     — table, reveal, save & redeploy
      /deployments   — history for this env
      /logs          — live log viewer (full width)
  /settings          — delete project, danger zone
```

Optional: global `/deployments` remains cross-project inbox ([`DeploymentsPage.tsx`](../frontend/src/pages/deployments/DeploymentsPage.tsx)).

---

### 3.5 Platform / agent / deploy (P0 — found in VPS test)

| ID | Issue | Evidence | Fix direction |
|----|--------|----------|---------------|
| PLT-1 | Agent image lacks **docker buildx** | [`agent/Dockerfile`](../agent/Dockerfile) — `apk add docker-cli` only | Install buildx plugin in image; set `DOCKER_BUILDKIT=1` in agent env |
| PLT-2 | `docker exited with code 1` in UI | Agent [`run-command.ts`](../agent/src/utils/run-command.ts) final message generic | Surface last stderr line containing `ERROR:` or `#` step failure |
| PLT-3 | Parallel deploy clicks | Interleaved git logs | Disable Deploy button while status `running`; backend idempotency / reject second active deploy per env |
| PLT-4 | Dev vs prod control plane | ngrok flakiness | Document **production profile**: deployed API + HTTPS; dev profile: ngrok optional |
| PLT-5 | GHCR image must be public or login | User pull failures | Checklist in [`OPERATIONS.md`](./OPERATIONS.md); UI link from bootstrap panel |

---

### 3.6 UI, feedback & “production feel” (P1)

| ID | Issue | Where | Fix direction |
|----|--------|-------|---------------|
| UI-1 | No global toast system | Grep: no sonner | Add **sonner** (or shadcn toast); success/error for save, deploy, delete |
| UI-2 | Inline errors only | Many pages | Standardize: toast + optional inline field errors |
| UI-3 | Generic loading | “Loading…” text | Skeletons on lists (servers, projects, deployments) |
| UI-4 | Log viewer size | Project/deploy pages | Full-width panel, mono font, copy, auto-scroll toggle ([`ROADMAP.md`](../ROADMAP.md)) |
| UI-5 | Template / AI aesthetic | ROADMAP §1 | Design tokens pass — [`DESIGN.md`](./DESIGN.md) |
| UI-6 | Confirm dialogs | Done for delete | Extend to “Reveal secret”, destructive deploy actions |

---

### 3.7 API & errors (P1)

| ID | Issue | Fix direction |
|----|--------|---------------|
| API-1 | Map `ERROR_CODES` to user strings | Central [`getApiErrorMessage`](../frontend/src/lib/api-error.ts) table for bootstrap, deploy, auth |
| API-2 | 503 bootstrap not configured | Clear alert: set `AGENT_DOCKER_IMAGE` + worker |
| API-3 | Network offline | Detect `Network Error` in axios; toast “Cannot reach API” |

---

### 3.8 Documentation & repo hygiene (P1 — recruiter)

| ID | Issue | Fix direction |
|----|--------|---------------|
| DOC-1 | ~~Many overlapping docs~~ | **Done (2026-09-27):** [`OPERATIONS.md`](./OPERATIONS.md), [`docs/README.md`](./README.md), archive, slim RELEASE-2.0 |
| DOC-2 | Placeholder `<your-github-user>` in generated install text | Prevent at env validation startup if image URL contains `<` |
| DOC-3 | [`TESTING.md`](./TESTING.md) vs Postman doc | Keep both; TESTING = steps, POSTMAN-RECRUITER = sharing |
| DOC-4 | Demo video | README embed when recorded ([`DEMO-SCRIPT.md`](./DEMO-SCRIPT.md)) |

**Do not delete docs in one shot** — migrate content, then remove files in a dedicated commit with README index update ([`docs/README.md`](./README.md)).

---

## 4. Recommended execution phases

Work **one phase at a time**; ship vertical slices (backend + UI + doc note).

### Phase A — Trust (1–2 weeks)

1. AUTH-1…AUTH-2: Session refresh hardening + QA script in [`BROWSER-SMOKE-CHECKLIST.md`](./BROWSER-SMOKE-CHECKLIST.md)  
2. SET-1: Settings URL routes  
3. PLT-1: Agent Dockerfile + buildx; republish GHCR image  
4. UI-1: Toast system; wire top 5 actions (login fail, save profile, deploy start/fail, bootstrap fail)  
5. SRV-4: Delete server warning copy  

### Phase B — Guided flows (2–3 weeks)

1. SRV-1, SRV-5: Server wizard / setup page  
2. PRJ-1, PRJ-4: Project sub-routes (start with **Overview + Environment detail + Logs**)  
3. PRJ-5: Bulk env paste + parse preview + batch save (Render-style)  
4. PRJ-2: First-deploy checklist on dashboard + project overview  
5. PRJ-3: GitHub repo picker on create project  
6. PLT-2, PLT-3: Better deploy errors + single-flight deploy  

### Phase C — Production operator path (parallel when VPS ready)

1. Deploy control plane (API + worker + Redis + DB) with real `PUBLIC_API_URL`  
2. Drop ngrok from demo script; keep “local dev + tunnel” appendix  
3. HTTPS-only bootstrap in production (already enforced in API)  
4. DOC consolidation + README “Recruiter tour” section  

### Phase D — Polish (ongoing)

ROADMAP §1 design system, skeletons, auth split layout, deployment filters.

---

## 5. Manual QA scripts (add to browser checklist)

### Session

- [ ] Login → wait 16 minutes idle → navigate → still authenticated  
- [ ] Login → restart **backend only** → refresh page → still authenticated (refresh cookie valid)  
- [ ] Login → clear **access** cookie only in DevTools → next click triggers refresh → still authenticated  

### Settings

- [ ] Integrations tab → hard refresh → Integrations still selected  
- [ ] GitHub OAuth return → lands Integrations + success toast/banner  

### Server

- [ ] Create server → SSH install (worker on) → logs → ONLINE  
- [ ] Delete server → confirm mentions VPS not cleaned  

### Project

- [ ] Create project via repo picker → environment → deploy → failure shows **readable** error (buildx / OOM / git)  

---

## 6. How we work from here (mentor process)

1. **Pick one ID** from §3 (e.g. AUTH-2).  
2. **Reproduce** in browser or VPS; note Network tab / logs.  
3. **Smallest fix** + update this doc checkbox or move item to “Done” in commit message.  
4. **No new MD files** per feature — update this plan or [`ROADMAP.md`](../ROADMAP.md) only.  
5. Before recruiter share: Phase A + B minimum; demo on **deployed API** or recorded video.

---

## 7. Quick reference — files to touch first

| Topic | Files |
|-------|--------|
| Session | `frontend/src/services/api.ts`, `frontend/src/stores/auth.store.ts`, `frontend/src/components/auth/SessionManager.tsx` |
| Settings tabs | `frontend/src/pages/settings/SettingsPage.tsx`, `frontend/src/routes/index.tsx`, `frontend/src/constants/routes.ts` |
| Project IA | `frontend/src/pages/projects/ProjectDetailPage.tsx`, new `projects/*` routes, layout shell with sub-nav |
| Server wizard | `frontend/src/pages/servers/ServersPage.tsx`, `ServerDetailPage.tsx`, `ServerBootstrapPanel.tsx` |
| Agent buildx | `agent/Dockerfile`, `.github/workflows/agent-docker.yml` |
| Toasts | new `components/ui/sonner.tsx`, `App.tsx` |
| Docs merge | `docs/README.md`, root `README.md` |

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-09-27 | Initial plan after VPS test + UX/auth/settings feedback |
| 2026-09-27 | PRJ-5 bulk env import (Render-style paste / .env upload) |
| 2026-09-27 | Docs v2: OPERATIONS, archive, TESTING → docs/, README trim |
