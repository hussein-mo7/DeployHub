# DeployHub — Testing Guide

Step-by-step API testing with Postman. Run phases in order.

---

## Before you start

```powershell
# 1. Start Docker Desktop, then:
docker compose up redis -d

# 2. Backend only (no frontend until Phase 2 Postman tests pass):
npm run dev:backend
```

| Variable | Value |
|----------|-------|
| `baseUrl` | `http://localhost:3001` |
| Frontend | `http://localhost:5173` |

**Postman:** Collection **DeployHub API** · Environment **DeployHub Local**

Your test account is saved in environment variables (`testName`, `testEmail`, `testPassword`, `testConfirmPassword`) — no hardcoded credentials in requests.

**Before Phase 3 or 4:** run **0 — Session → Login** once (sets HTTP-only cookies). Login is not repeated in each phase folder.

**Postman settings:** Cookies enabled (automatic). No Bearer token — auth uses HTTP-only cookies. Use `localhost`, not `127.0.0.1`.

---

## Phase 1 — Foundation

### Test 1.1 Health check

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/health` |
| **Expected** | `200` — `{ "status": "ok", "services": { "database": "connected", "redis": "connected" } }` |

### Test 1.2 API root

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/` |
| **Expected** | `200` — `{ "name": "DeployHub API", "version": "0.1.0" }` |

**Phase 1 pass:** Both return 200. Redis + Neon connected.

---

## Phase 2 — Auth

Run requests **in this order**.

### Test 2.1 Register

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/auth/register` |
| **Body** | See below |
| **Expected** | `201` — message to check email. **No cookies yet.** |

```json
{
  "name": "{{testName}}",
  "email": "{{testEmail}}",
  "password": "{{testPassword}}",
  "confirmPassword": "{{testConfirmPassword}}"
}
```

**Resend configured?**

| Setting | Value |
|---------|-------|
| `EMAIL_FROM` in `backend/.env` | `DeployHub <onboarding@resend.dev>` |
| `testEmail` in Postman | **The exact email on your Resend account** |

Resend's test sender only delivers to **your Resend account email** — not `@deployhub.local`, not random Gmail addresses.

If email fails, check the **backend console** for `[DEV] Verification link logged below`.

### Test 2.2 Get verification token

- **Resend enabled:** open email, copy link token from URL (`?token=...`)
- **Dev mode:** copy token from backend console log

Set Postman variable: `verificationToken`

### Test 2.3 Verify email

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/auth/verify-email` |
| **Body** | `{ "token": "{{verificationToken}}" }` |
| **Expected** | `200` — `"Email verified successfully..."` |

Or use browser: open link → click **Verify email** button.

### Test 2.4 Login

Run **0 — Session → Login** in Postman (uses `{{testEmail}}` / `{{testPassword}}` from environment).

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/auth/login` |
| **Expected** | `200` + user object. Cookies: `deployhub_access_token`, `deployhub_refresh_token` |

### Test 2.5 Get me (protected)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/auth/me` |
| **Expected** | `200` — `{ "user": { "emailVerified": true, ... } }` |

### Test 2.6 Refresh session

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/auth/refresh` |
| **Expected** | `200` — `"Session refreshed"`. New cookies set. |

### Test 2.7 Logout

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/auth/logout` |
| **Expected** | `200`. Cookies cleared. |

### Test 2.8 Get me after logout

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/auth/me` |
| **Expected** | `401` — Unauthorized |

### Test 2.9 Login before verify (negative)

Register new email → try login **before** verify.

| **Expected** | `403` — `EMAIL_NOT_VERIFIED` |

**Phase 2 pass:** Full register → verify → login → me → refresh → logout flow works.

---

## Phase 3 — GitHub

**Prerequisites:** Run **0 — Session → Login** first. GitHub App created and env vars set in `backend/.env`.

### GitHub App setup (one time)

1. Go to [GitHub → Settings → Developer settings → GitHub Apps](https://github.com/settings/apps) → **New GitHub App**
2. Set **Setup URL** (Callback URL): `http://localhost:3001/api/github/callback`
3. Enable **Request user authorization (OAuth) during installation** if you want user-level installs
4. Permissions: **Repository metadata** (read), **Contents** (read) — add more later for deploys
5. Copy **App ID**, **Client slug** (from app URL), and generate a **Private key**
6. Add to `backend/.env`:

```env
GITHUB_APP_ID="123456"
GITHUB_APP_SLUG="your-app-slug"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

Restart backend after saving.

### Test 3.1 Get install URL

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/github/install-url` |
| **Auth** | Login cookies required |
| **Expected** | `200` — `{ "url": "https://github.com/apps/...", "state": "..." }` |

### Test 3.2 Connect GitHub

1. Open the `url` from 3.1 in your browser
2. Install the app on your account/org and select repositories
3. GitHub redirects to the callback with `installation_id` and `state`
4. **Browser install (dev):** backend shows a success page on `:3001` — frontend not required
5. **Postman:** call callback with `format=json`, or skip 3.2 if browser install already succeeded

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/github/callback?installation_id=INSTALL_ID&state=STATE&format=json` |

**Expected:** `200` — GitHub connected

### Test 3.3 Get integration status

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/github/integration` |
| **Expected** | `200` — `{ "integration": { "connected": true, "accountLogin": "..." } }` |

### Test 3.4 List repositories

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/github/repos?page=1&perPage=30` |
| **Expected** | `200` — list of repos the app can access |

### Test 3.5 List branches

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/github/repos/{{repoOwner}}/{{repoName}}/branches` |
| **Expected** | `200` — `{ "branches": [{ "name": "main", ... }] }` |

### Test 3.6 Disconnect

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `{{baseUrl}}/api/github/integration` |
| **Expected** | `200` — disconnected |

**Phase 3 pass:** Connect → list repos → list branches → disconnect works in Postman.

---

## Phase 4 — Servers & Agent

**Prerequisites:** Run **0 — Session → Login** first. Run `npm run db:push` once if the `Server` table is missing.

### Test 4.1 Create server

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/servers` |
| **Body** | `{ "name": "My VPS", "description": "Production server" }` |
| **Expected** | `201` — `registrationToken`, `installCommand`, `server` |

Save `registrationToken` and `server.id` as `serverId` in Postman env.

### Test 4.2 Register agent

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/agents/register` |
| **Auth** | None |
| **Body** | `{ "registrationToken": "{{registrationToken}}" }` |
| **Expected** | `201` — `agentToken`, `serverId`, `controlPlaneUrl` |

Save `agentToken` in Postman env.

### Test 4.3 List / get servers

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/servers` |
| **Expected** | `200` — server with `status: "OFFLINE"` after register |

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/servers/{{serverId}}` |
| **Expected** | `200` — same server |

### Test 4.4 Agent goes ONLINE

In a **second terminal** (from project root):

```powershell
$env:CONTROL_PLANE_URL="http://localhost:3001"
$env:AGENT_TOKEN="paste-agentToken-here"
npm run dev:agent
```

Then **GET** `{{baseUrl}}/api/servers/{{serverId}}` again.

| **Expected** | `status: "ONLINE"`, `lastSeenAt` set |

Stop the agent → status should become `OFFLINE`.

### Test 4.5 Update / delete (optional)

| | |
|---|---|
| **PATCH** | `{{baseUrl}}/api/servers/{{serverId}}` — `{ "name": "Renamed VPS" }` |
| **DELETE** | `{{baseUrl}}/api/servers/{{serverId}}` |

**Phase 4 pass:** Create → register → list → agent ONLINE/OFFLINE works.

---

## Phase 5+ — Coming soon

Tests will be added here as each phase is built. See `PROGRESS.md` for implementation status.

---

## Postman collection (cloud)

In your Postman workspace **Hussein Mohammed's Workspace**:

| Resource | Name |
|----------|------|
| Collection | **DeployHub API** |
| Environment | **DeployHub Local** |

Account credentials live in **DeployHub Local** environment variables. After register, paste the token into `verificationToken`. Run **0 — Session → Login** before Phase 3+.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Health fails on Redis | Start Docker: `docker compose up redis -d` |
| Health fails on DB | Check `DATABASE_URL` in `backend/.env` |
| Login 403 | Verify email first (Test 2.3) |
| Cookies not saved | Postman → Settings → cookies enabled; use `localhost` not `127.0.0.1` |
| Register fails on email | Set `EMAIL_FROM="DeployHub <onboarding@resend.dev>"` in `backend/.env` |
| No verification email | Use your **real email** with Resend test sender, or remove `RESEND_API_KEY` to log link in console |
| Email domain not verified | Don't use `@deployhub.local` — use `onboarding@resend.dev` as sender until you verify your domain |
| GitHub 503 not configured | Set `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_PRIVATE_KEY` in `backend/.env` |
| GitHub 404 not connected | Run install flow (Test 3.1 → 3.2) while logged in |
| Server table missing | Run `npm run db:push` |
| Agent stays OFFLINE | Check `AGENT_TOKEN` matches register response; backend must be running |
| Agent auth failed | Re-register with a new server token — registration tokens are one-time |
