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

## Phase 5 — Projects

**Prerequisites:** Run **0 — Session → Login** first. Run `npm run db:push` after pull. You need at least one **server** (`serverId` in env).

### Test 5.1 Create project

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/projects` |
| **Body** | See below |
| **Expected** | `201` — `project` with `repoFullName` |

```json
{
  "name": "My App",
  "description": "Full-stack application",
  "repoOwner": "{{repoOwner}}",
  "repoName": "{{repoName}}"
}
```

Save `project.id` as `projectId` in Postman env.

### Test 5.2 List / get projects

| | |
|---|---|
| **GET** | `{{baseUrl}}/api/projects` |
| **Expected** | `200` — `{ "projects": [...] }` |

| | |
|---|---|
| **GET** | `{{baseUrl}}/api/projects/{{projectId}}` |
| **Expected** | `200` — project with `services` and `environments` arrays |

### Test 5.3 Create service

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/projects/{{projectId}}/services` |
| **Body** | `{ "name": "API", "deploymentMethod": "DOCKERFILE" }` |
| **Expected** | `201` — save `service.id` as `serviceId` |

**Compose example:**

```json
{
  "name": "Stack",
  "deploymentMethod": "COMPOSE",
  "composeFilePath": "docker-compose.yml"
}
```

**Image example:**

```json
{
  "name": "Web",
  "deploymentMethod": "IMAGE",
  "imageName": "nginx:latest"
}
```

### Test 5.4 Create environment

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/projects/{{projectId}}/environments` |
| **Body** | See below |
| **Expected** | `201` — environment with `serverName`, `serverStatus`, `branch` |

```json
{
  "name": "Production",
  "serverId": "{{serverId}}",
  "branch": "main",
  "autoDeployEnabled": false
}
```

Save `environment.id` as `environmentId`.

### Test 5.5 List services / environments

| | |
|---|---|
| **GET** | `{{baseUrl}}/api/projects/{{projectId}}/services` |
| **GET** | `{{baseUrl}}/api/projects/{{projectId}}/environments` |

### Test 5.6 Update / delete (optional)

| | |
|---|---|
| **PATCH** | `{{baseUrl}}/api/projects/{{projectId}}` — `{ "name": "Renamed App" }` |
| **PATCH** | `{{baseUrl}}/api/projects/{{projectId}}/services/{{serviceId}}` |
| **PATCH** | `{{baseUrl}}/api/projects/{{projectId}}/environments/{{environmentId}}` |
| **DELETE** | services → environments → project (in that order if cleaning up) |

**Phase 5 pass:** Create project → add service → add environment → get project detail shows all three.

---

## Phase 6 — Environment Variables

**Prerequisites:** Run **0 — Session → Login** first. Run `npm run db:push` after pull. You need `projectId`, `environmentId`, and `ENCRYPTION_KEY` set in `backend/.env`.

### Test 6.1 List variables (empty)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/projects/{{projectId}}/environments/{{environmentId}}/variables` |
| **Expected** | `200` — `{ "variables": [] }` |

### Test 6.2 Save variables (plain + secret)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `{{baseUrl}}/api/projects/{{projectId}}/environments/{{environmentId}}/variables` |
| **Body** | See below |
| **Expected** | `200` — variables saved; secret value masked in response |

```json
{
  "variables": [
    {
      "key": "NODE_ENV",
      "value": "production",
      "isSecret": false
    },
    {
      "key": "MONGODB_URI",
      "value": "mongodb+srv://user:pass@cluster.mongodb.net/db",
      "isSecret": true
    }
  ],
  "redeploy": false
}
```

| **Check** | `MONGODB_URI` returns `value: null`, `maskedValue: "••••••••"`, `hasValue: true` |
| **Check** | `NODE_ENV` returns plain `value: "production"` |

### Test 6.3 List variables (after save)

| | |
|---|---|
| **GET** | same URL as 6.1 |
| **Expected** | `200` — 2 variables; secret still masked |

### Test 6.4 Update secret without resending value

Send the same body but omit `value` for `MONGODB_URI` (or use empty string). Secret should be preserved.

```json
{
  "variables": [
    { "key": "NODE_ENV", "value": "production", "isSecret": false },
    { "key": "MONGODB_URI", "isSecret": true }
  ],
  "redeploy": false
}
```

| **Expected** | `200` — `MONGODB_URI` still has `hasValue: true` |

### Test 6.5 Save & redeploy

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | same as 6.2 |
| **Body** | `{ "variables": [...], "redeploy": true }` |
| **Expected** | `200` — `redeployQueued: true` (deployment worker stub logs job) |

**Phase 6 pass:** Save plain + secret vars → list masks secrets → save without redeploy → save with redeploy queues job.

---

## Phase 7 — Deployments (local agent)

**Prerequisites:** Phase 5 project + environment + at least one service. Phase 6 env vars optional but recommended. GitHub connected. **Agent ONLINE** on target server. **Docker Desktop** running. **Git** installed.

**Run locally (4 terminals):**

```powershell
docker compose up redis -d
npm run dev:backend
npm run worker
npm run dev:agent
```

### Test 7.1 Trigger deployment

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/projects/{{projectId}}/environments/{{environmentId}}/deployments` |
| **Expected** | `201` — `deployment` with `status: "QUEUED"` |

Save `deployment.id` as `deploymentId`.

### Test 7.2 List deployments

| | |
|---|---|
| **GET** | `{{baseUrl}}/api/projects/{{projectId}}/environments/{{environmentId}}/deployments` |
| **Expected** | `200` — newest deployment first |

### Test 7.3 Get deployment + logs

| | |
|---|---|
| **GET** | `{{baseUrl}}/api/deployments/{{deploymentId}}` |
| **Expected** | `200` — `logs` array grows; final `status` is `SUCCESS` or `FAILED` |

**Pass:** Agent clones repo, runs Docker strategy, deployment ends `SUCCESS`.

### Test 7.4 Cancel stuck deployment (optional)

If a deployment stays `RUNNING`/`QUEUED` and blocks new deploys:

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/deployments/{{deploymentId}}/cancel` |
| **Expected** | `200` — `status: "CANCELLED"` |

Then retry **7.1**.

### Browser access after deploy (DOCKERFILE / IMAGE)

The app listens **inside** the container (e.g. Next.js on port **3000**). To reach it on your machine, set the service **`port`** (PATCH service with `{ "port": 3000 }`) or add env **`PORT=3000`**, then redeploy. The agent publishes `-p 3000:3000` on the host.

**Local notes:** Workspace defaults to `.deployhub-workspace/` in repo root. Use a public test repo or a repo your GitHub App can clone.

---

## Phase 8 — Health checks

After a DOCKERFILE/IMAGE deploy, the agent GETs `http://127.0.0.1:{port}{path}` on the **server** (host port must be set). Up to ~60s of retries. Failure marks deployment **FAILED**.

**Defaults:** `healthCheckPath: "/"`, `healthCheckEnabled: true`. No host **port** ⇒ check is skipped (logged, deploy can still succeed).

### Test 8.1 Configure service health check

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `{{baseUrl}}/api/projects/{{projectId}}/services/{{serviceId}}` |
| **Body** | `{ "port": 3000, "healthCheckPath": "/", "healthCheckEnabled": true }` |

**Expected:** `200` — service includes `healthCheckPath` and `healthCheckEnabled`.

### Test 8.2 Deploy with passing health check

1. Ensure **8.1** (port **3000**, path **`/`**).
2. Run **Phase 7 → 7.1** deploy.
3. **7.3** logs should include `Health check: GET http://127.0.0.1:3000/` then `Health check passed`.
4. Final status **`SUCCESS`**.

### Test 8.3 Deploy with failing health check (optional)

| | |
|---|---|
| **Body (8.1)** | `{ "healthCheckPath": "/this-route-does-not-exist", "healthCheckEnabled": true, "port": 3000 }` |

Redeploy (**7.1**). **Expected:** **`FAILED`**, log contains `Health check failed`.

---

## Phase 9 — Rollback

Redeploy a **previous successful** deployment by pinning the **Git commit** stored on that deployment record.

**Run once:** `npm run db:push` (adds `branch`, `gitCommitSha`, `rollbackSourceDeploymentId` on `Deployment`, `ROLLBACK` trigger).

**Note:** Deployments from before Phase 9 have no `gitCommitSha`. Run **7.1** once after upgrading so the success record stores a commit; then rollback works.

### Test 9.1 Rollback to a successful deployment

1. Have at least one deployment with **`SUCCESS`** and a stored commit (check **7.3** — logs include `Checked out commit …`, or GET deployment shows `gitCommitSha`).
2. Optionally run **7.1** again so `main` moves forward (simulates a bad deploy you want to undo).

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/deployments/{{deploymentId}}/rollback` |
| **Body** | none |

Use `deploymentId` of the **older SUCCESS** deployment you want to restore (not the latest bad one).

**Expected:** `201` — new deployment with `trigger: "ROLLBACK"`, `rollbackSourceDeploymentId` set, `gitCommitSha` matching the source.

3. **7.3** on the **new** deployment id — logs should show fetch/checkout of the same commit, then `SUCCESS`.
4. App on host port should match the rolled-back version.

### Test 9.2 Rollback rejected (optional)

| | |
|---|---|
| **POST** | `.../deployments/{{failedDeploymentId}}/rollback` where status is **FAILED** |
| **Expected** | `400` — `DEPLOYMENT_NOT_ROLLBACKABLE` |

---

## Phase 10 — Auto deploy (GitHub push webhook)

When GitHub sends a **`push`** event, DeployHub queues deployments for every **environment** where:

- Project **`repoOwner` / `repoName`** match the repository  
- Environment **`branch`** matches the pushed branch  
- **`autoDeployEnabled`** is `true`  
- GitHub App **installation** matches the webhook payload  

**Configure once**

1. Set **`GITHUB_WEBHOOK_SECRET`** in `backend/.env` (same value as in GitHub App → Webhook secret).  
2. GitHub App webhook URL: `https://<your-public-host>/api/github/webhook` (local dev: use [ngrok](https://ngrok.com) → `https://xxxx.ngrok.io/api/github/webhook`).  
3. Subscribe to **Push** events.  
4. Restart backend + worker.

**Postman env:** add `githubWebhookSecret` = same as `GITHUB_WEBHOOK_SECRET`.

### Test 10.1 Enable auto deploy on environment

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `{{baseUrl}}/api/projects/{{projectId}}/environments/{{environmentId}}` |
| **Body** | `{ "autoDeployEnabled": true }` |

Ensure environment **`branch`** matches what you push (e.g. `"main"`).

### Test 10.2 Simulate push webhook (local)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/github/webhook` |
| **Auth** | None (signature headers instead) |
| **Headers** | Set in pre-request script (see collection **10.2**) |
| **Body (raw JSON)** | See collection — uses `repoOwner`, `repoName`, `githubInstallationId` |

**Pre-request script (collection):** HMAC `X-Hub-Signature-256`, `X-GitHub-Event: push`, `X-GitHub-Delivery`.

**Expected:** `202` — `{ "ok": true, "queued": 1, ... }` then worker logs + new deployment with **`trigger": "WEBHOOK"`**.

**Prerequisites:** `npm run worker`, agent **ONLINE**, services configured (port/health like Phase 8).

### Test 10.3 Real GitHub push (optional)

Push a commit to the linked repo/branch → webhook hits your public URL → same as 10.2.

**Pass:** New deployment appears in **7.2** with trigger **WEBHOOK** and reaches **SUCCESS**.

---

## Phase 11+ — Coming soon

---

## Postman collection (cloud)

In your Postman workspace **Hussein Mohammed's Workspace**:

| Resource | Name |
|----------|------|
| Collection | **DeployHub API** |
| Environment | **DeployHub Local** |

Account credentials live in **DeployHub Local** environment variables. After register, paste the token into `verificationToken`. Run **0 — Session → Login** before Phase 3+.

**Phase folders in collection:** Phase 1–10 (Phase 5 **5.5** saves `environmentId`; Phase 7 **7.1** saves `deploymentId`; Phase 8 health; Phase 9 rollback; Phase 10 webhook).

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
| Project/Environment tables missing | Run `npm run db:push` |
| Phase 6 variables 404 | Run `npm run db:push` (EnvironmentVariable table) |
| Phase 6 missing `environmentId` | Run Phase 5 **5.5 Create Environment** (saves `environmentId`) |
| Deployment stays QUEUED | Start `npm run worker` and ensure agent is ONLINE |
| Deployment FAILED clone/build | Git + Docker installed; GitHub App access to repo; check **7.3** logs |
| Webhook 503 not configured | Set `GITHUB_WEBHOOK_SECRET` in `backend/.env` |
| Webhook 401 invalid signature | Postman pre-request must sign **exact** raw body with same secret |
| Webhook queued 0 | Enable **10.1** auto deploy; match repo/branch/installation id in payload |
| New secret requires value | First save of a secret key must include `value`; omit only when updating existing secret |
