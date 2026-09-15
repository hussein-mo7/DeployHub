# DeployHub — Product Roadmap

**Status:** MVP (backend + functional UI) shipped · **Next:** Release **1.1 — Product & UX** before large **2.0** features.

This document is the single backlog for *what to build next* and *how the product should feel*. Requirements for the shipped MVP stay frozen in [`SRS.md`](./SRS.md) §8.

---

## MVP vs 1.1 vs 2.0

| Release | Goal | Scope |
|---------|------|--------|
| **MVP (done)** | Prove the deployment loop works | Auth, GitHub, agent, projects, env vars, deploy strategies, logs, health, rollback, webhook auto-deploy |
| **1.1 Product polish** | Feel like a real SaaS control panel | Design system, UX fixes, secret reveal, environment/project flows, settings, empty states, responsive layout |
| **2.0 Platform** | Scale and teams | RBAC, orgs, notifications, monitoring, preview envs, billing, more git providers |

**Recommendation:** Treat everything in §2–§5 below as **1.1** unless marked **2.0**. Do not mix “pretty UI” with “teams/RBAC” — recruiters and users both benefit from a polished 1.1 first.

---

## 1. UX audit — what feels “AI-made” today

These are patterns that read as generic template UI, not a designed product.

| Issue | Where | Fix direction |
|-------|--------|----------------|
| Default shadcn blue + dark sidebar cliché | `globals.css`, `Sidebar.tsx` | Pick one brand direction (see §3); light shell + subtle sidebar *or* dark app chrome — not both fighting |
| Same card grid on every page | Dashboard, lists | Vary layout: tables for dense data (deployments, env vars), cards only for summaries |
| Weak hierarchy | Project detail | Split into tabs: **Overview · Services · Environments · Deployments** instead of one long scroll |
| Raw HTML checkboxes | Env vars “Secret” | Use `Checkbox` + `Switch` components; align labels and help text |
| Dashed “temp” borders | Env var panel | Solid sections with headers and dividers |
| No loading skeletons | Most pages | Skeleton rows for lists; avoid lone “Loading…” text |
| Logs in tiny box | Deployments, project | Full-width log viewer, sticky header, level colors, copy button |
| Placeholder copy | Various | Action-led empty states (“Connect GitHub”, “Add server”) not “Coming soon” |
| Inconsistent dates/status | Lists | One `formatRelativeTime` + tooltip for absolute time |
| No toast system | Saves, errors | Sonner/toast for save/deploy feedback instead of inline green boxes only |

---

## 2. Priority backlog (1.1)

### P0 — Trust & daily use (do first)

1. **Environment variables — secret visibility (eye reveal)**  
   - **Problem:** After save, secret values are empty in the form; users cannot *confirm* what is stored (unlike Vercel/Railway/Render).  
   - **Backend:** Add authenticated `GET .../variables/:variableId/reveal` (or reveal-by-key) returning decrypted value once; audit log optional in 2.0. Never return secrets in list by default.  
   - **UI:** Masked display (`••••••••` or API `maskedValue`); **eye** toggles reveal (session-only, re-fetch on toggle off); lock icon for secret keys; “Reveal all” behind confirm dialog.  
   - **Edit flow:** “Leave blank to keep” stays; when revealed, show read-only until user clicks Edit.

2. **Environment section structure**  
   - Table: Key | Value (masked) | Secret | Actions  
   - Inline **auto-deploy** toggle (PATCH environment — wire `updateEnvironment` in frontend)  
   - Branch + server shown as read-only chips with link to server page  

3. **Design system pass (foundation)**  
   - Typography scale (page title, section, label, mono for logs/SHAs)  
   - Spacing rhythm (8px grid), max content width (`max-w-6xl` on main)  
   - Semantic colors: success/warning/running/deploy states (not only badge variants)  
   - One font pairing: e.g. **Inter** + **JetBrains Mono** for logs  

4. **Settings page**  
   - Sections: Profile · GitHub · Security (change password — if API exists) · Danger zone  
   - Connected state as status card with avatar-style GitHub icon  
   - Webhook/auto-deploy help as collapsible “Advanced” (not raw env var names in body text)  

5. **Auth pages**  
   - Split layout (brand panel + form) for login/register  
   - Clear verify-email path; resend button on verify-sent page  

### P1 — Professional polish

6. **Dashboard** — recent deployments table (5 rows), quick actions, agent offline warning banner  
7. **Deployments** — filters (status, project, trigger); live log follow (auto-scroll toggle)  
8. **Project create/edit** — repo picker from GitHub list instead of typing owner/name  
9. **Server detail** — copy install command, last seen, link to projects on this server  
10. **Global layout** — breadcrumbs (`Projects / My App / Production`), mobile nav polish  
11. **Dark mode** — optional; only after light theme is stable  

### P2 — 2.0 (after 1.1 ships)

12. Deploy cancellation UX improvements · agent reconnection banner  
13. Notifications (email/Slack) on deploy fail  
14. Teams, roles, audit log for secret reveal  
15. Preview environments · blue/green  

---

## 3. Visual direction (pick one — stick to it)

**Option A — “Control plane” (recommended)**  
- Light gray page background (`slate-50`), white surfaces, single accent (teal or indigo *not* default shadcn blue)  
- Sidebar: white or very light, border-right — avoids “dark sidebar template”  
- Dense data tables; minimal rounded corners (`radius-md`)

**Option B — “Developer dark”**  
- Dark shell (`zinc-950`), elevated cards `zinc-900`, accent for primary actions only  
- Higher contrast for logs (VS Code–like)

**Deliverables for 1.1:**  
- `frontend/src/styles/globals.css` — tokens only, no magic hex in components  
- `docs/DESIGN.md` — colors, type, spacing, component rules (short)  
- Optional: 2–3 reference screenshots in `docs/screenshots/` for README  

---

## 4. Page-by-page checklist

Use this as sprint tasks; check in GitHub Issues or `PROGRESS.md` post-MVP section.

| Page | Must improve |
|------|----------------|
| Login / Register | Brand panel, validation UX, a11y |
| Dashboard | Real metrics, activity feed, CTA when empty |
| Servers | Table vs cards; setup steps wizard |
| Server detail | Install script UX, status timeline |
| Projects | Search/filter; repo badge |
| Project detail | Tabs; env + deploy in one place per environment |
| Env vars | Table + reveal + bulk import `.env` (later) |
| Deployments | Filters, log viewer, link to commit on GitHub |
| Settings | Profile + GitHub + docs links |

---

## 5. Repository hygiene (recruiters & open source)

**Safe to show**

- `frontend/`, `backend/`, `agent/` — application code  
- Root docs: `README.md`, `SRS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `PROGRESS.md`  
- `docker-compose.yml`, `.env.example` files  

**Keep out of Git (already in `.gitignore`)**

- `.env`, secrets, `postman/` exports, `agent/**/.deployhub-workspace/`  
- `node_modules/`, `dist/`  

**Optional cleanup**

- Remove dead files when found (e.g. unused placeholders)  
- Do **not** commit cloned customer repos under `agent/.deployhub-workspace`  
- Add `docs/screenshots/` for README hero image (no secrets in screenshots)  

**README for portfolio:** 3 screenshots, architecture diagram, “What I built” bullet emphasizing backend + real-time + agent protocol.

---

## 6. Documentation map

| File | Audience | Purpose |
|------|----------|---------|
| [`README.md`](./README.md) | Everyone | Install, demo, links |
| [`SRS.md`](./SRS.md) | Product / review | MVP requirements (frozen) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Engineers | How it works |
| [`PROGRESS.md`](./PROGRESS.md) | You | Phase history (MVP) + link here for next |
| [`ROADMAP.md`](./ROADMAP.md) | You / contributors | 1.1 & 2.0 backlog |
| [`docs/DESIGN.md`](./docs/DESIGN.md) | Frontend | Tokens & UI rules (fill during 1.1) |
| [`TESTING.md`](./TESTING.md) | QA / API | Postman phases (internal depth — fine for portfolio) |

---

## 7. Suggested order of work (next 4–6 weeks)

1. **Week 1:** Design tokens + layout shell (sidebar, header, breadcrumbs)  
2. **Week 2:** Secret reveal API + env var table UX  
3. **Week 3:** Project detail tabs + environment controls (auto-deploy, deploy CTA)  
4. **Week 4:** Settings + auth visual pass + dashboard/deployments tables  
5. **Week 5:** Empty states, toasts, responsive pass, README screenshots  
6. **Then:** Pick first 2.0 item (e.g. notifications) only after 1.1 feels shippable  

---

## 8. Personal recommendations

1. **Call the current state “MVP” publicly** — honest and strong for interviews: full stack, agent, queue, webhooks.  
2. **Ship 1.1 as “Beta UI”** on the same repo; tag `v1.0.0-mvp` on git before large UI commits.  
3. **One hero demo video** (90s): connect GitHub → deploy → logs → rollback.  
4. **Issue tracker:** Turn §2 P0/P1 into GitHub Issues with labels `1.1-ui`, `backend`, `2.0`.  
5. **Do not rewrite SRS** for polish — extend via this roadmap and `docs/DESIGN.md`.  
6. **Secret reveal** is both UX and security story — implement reveal endpoint + eye UI early; mention in interviews.  

When you are ready to implement, start with **§2 P0 #1 (secret reveal)** and **§3 Option A tokens** in parallel — highest user pain + biggest visual upgrade.
