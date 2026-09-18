# Release 2.0 — Mentor / QA report

**Date:** 2026-09-19  
**Purpose:** Code & product audit before browser testing ([`BROWSER-SMOKE-CHECKLIST.md`](./BROWSER-SMOKE-CHECKLIST.md)).

---

## Verdict

| Area | Status | Notes |
|------|--------|--------|
| **Phase 1** Foundation | ✅ Complete | Public config, agent Docker, install.sh |
| **Phase 3** SSH bootstrap | ✅ Complete in repo | **Not on GitHub until you commit/push** |
| **Phase 4** Docs / portfolio | 🟡 Almost | Demo **video** still optional |
| **Phase 2** UI sign-off | 🟡 Pending QA | Features exist; need your browser pass |
| **MVP deploy loop** | ✅ Shipped | Auth, GitHub, deploy, logs, env, rollback |

**2.0 is “feature complete” for the written plan** except: demo recording, your step-by-step browser QA, and pushing local bootstrap work to `main`.

---

## Page-by-page (what to verify tomorrow)

### Auth (public)

| Route | Built? | QA focus |
|-------|--------|----------|
| Login / Register | ✅ | Validation, errors |
| Verify email / sent | ✅ | Token link |
| Forgot / reset password | ✅ | End-to-end reset |

### App shell

| Route | Built? | QA focus |
|-------|--------|----------|
| Dashboard | ✅ | Empty state, agent warning, stats, recent deploys |
| Servers list | ✅ | Stat chips, create server |
| Server detail | ✅ | SSH bootstrap, manual token, status polling |
| Projects list / detail | ✅ | Services, environments, tabs, auto-deploy toggle |
| Deployments | ✅ | Filters, search, live logs |
| Settings | ✅ | Profile, password, GitHub |

### Not in 2.0 (by design)

- Browser **VPS shell** / arbitrary SSH commands  
- DeployHub **pushing** to user GitHub (user pushes; webhooks pull)  
- Hosted multi-tenant PaaS  

---

## Infrastructure checklist (before browser QA)

- [ ] `npm run dev` (API + frontend)  
- [ ] `npm run worker` (deployments, webhooks, **SSH bootstrap**)  
- [ ] Redis up (`docker compose up redis -d`)  
- [ ] `PUBLIC_API_URL` + `AGENT_DOCKER_IMAGE` if testing real VPS  
- [ ] GitHub App + webhook secret for auto-deploy tests  

---

## Known gaps / follow-ups

1. **Git:** Bootstrap + docs changes are **local only** — commit and push when ready.  
2. **Phase 2:** No automated E2E tests; sign-off = you walk [`BROWSER-SMOKE-CHECKLIST.md`](./BROWSER-SMOKE-CHECKLIST.md).  
3. **Phase 4:** Add demo video URL to README when recorded.  
4. **Production:** Bootstrap requires HTTPS `PUBLIC_API_URL` (enforced in API when `NODE_ENV=production`).  
5. **Postman:** Update [`TESTING.md`](../TESTING.md) after browser QA (bootstrap endpoint folder).  

---

## Suggested test order (tomorrow)

1. Auth & session  
2. GitHub connect  
3. Server + agent (SSH or manual)  
4. Project + env + deploy  
5. Auto-deploy (push to GitHub) if webhook reachable  

---

## After QA passes

- Mark Phase 2 complete in [`RELEASE-2.0.md`](./RELEASE-2.0.md)  
- Tag or note **Release 2.0** in README status table  
- Optional: record demo using [`DEMO-SCRIPT.md`](./DEMO-SCRIPT.md)  
