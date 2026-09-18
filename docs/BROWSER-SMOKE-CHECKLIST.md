# Browser smoke checklist (Release 2.0)

Use this **after** implementation is done — walk the app in order. API details stay in [`TESTING.md`](../TESTING.md) for later Postman passes.

**Prerequisites:** API + **worker** + frontend running; `AGENT_DOCKER_IMAGE` set if testing VPS SSH bootstrap.

---

## 1. Auth & session

- [ ] Register → verify email flow (or dev bypass if configured)
- [ ] Login / logout
- [ ] Forgot password → reset link → new password
- [ ] Settings → Profile: update name
- [ ] Settings → change password
- [ ] Leave tab open ~20 min: still logged in (refresh token); API restart should **not** force logout unless refresh returns 401

## 2. GitHub

- [ ] Settings → Integrations → Connect GitHub → return to app (`?github=connected`)
- [ ] Repo list loads

## 3. Server & agent

- [ ] Servers → create server
- [ ] Server detail → **Install agent via SSH** (or manual token path)
- [ ] Bootstrap log stream appears; status → **CONNECTING** → **ONLINE** when agent runs
- [ ] Servers list stat chips match status

## 4. Project & deploy

- [ ] Create project (GitHub repo + branch)
- [ ] Add environment bound to online server
- [ ] Env vars: add secret, save, reveal eye icon
- [ ] Trigger deployment → live logs → success or clear failure
- [ ] Deployments page filters / search

## 5. Health & rollback (if configured)

- [ ] Service health check reflected after deploy
- [ ] Rollback to previous deployment when available

---

## Demo path (5 minutes)

See [`DEMO-SCRIPT.md`](./DEMO-SCRIPT.md).
