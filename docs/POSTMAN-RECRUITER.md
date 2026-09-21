# Postman — testing & sharing with recruiters

Collection and environment live in **Postman cloud** (not in git). Repo guide: [`TESTING.md`](../TESTING.md).

| Resource | Name | Link |
|----------|------|------|
| Collection | **DeployHub API** | [Open in Postman](https://go.postman.co/collection/53428982-8d2ab912-e832-4122-bd81-ebd2a6d4248b) |
| Environment | **DeployHub Local** | Your workspace (private) |

---

## What recruiters should see

1. **Collection** — phased folders 0–10 + Release 2.0  
2. **Short README in collection description** — quick start, cookies, worker  
3. **Template environment** — empty secrets, example `baseUrl` only  
4. **No real passwords, API keys, MongoDB URIs, or SSH private keys** in request bodies  

---

## Security — do this before sharing

Your **DeployHub Local** environment may contain real `testPassword`, GitHub tokens, and agent tokens. **Never publish or fork that environment.**

1. **Rotate anything that was pasted into Postman request bodies** (especially Phase 6 save examples). Old bodies may have lived in Postman history.  
2. Duplicate environment → **DeployHub Demo Template**  
3. Clear all secret values; set placeholders:
   - `testEmail` → recruiter’s own email  
   - `testPassword` / `testConfirmPassword` → they choose  
   - `bootstrapPrivateKey` → empty (SSH bootstrap is optional; prefer UI)  
4. Export **DeployHub Demo Template** JSON and attach to README/LinkedIn **only if** it has no secrets.  
5. Prefer sharing the **collection link** + `TESTING.md` — recruiters clone collection and use their own env.

---

## Collection map (2026-09-19)

| Folder | Purpose |
|--------|---------|
| **0 — Session** | `0.1 Login` — run before protected APIs |
| **Phase 1** | Health, API root |
| **Phase 2** | Register, verify, login, me, refresh, logout, profile, forgot/reset/change password |
| **Phase 3** | GitHub App |
| **Phase 4** | Servers, agent register, **4.6 Regenerate token** |
| **Phase 5–10** | Projects, env vars, deploy, health, rollback, webhook |
| **Release 2.0** | `2.0.1 Public config`, `2.0.2 SSH bootstrap` (optional, needs worker) |

### Add manually in Postman (if missing)

| Request | Method | URL |
|---------|--------|-----|
| **6.6 Reveal secret** | `GET` | `{{baseUrl}}/api/projects/{{projectId}}/environments/{{environmentId}}/variables/{{variableId}}/reveal` |

After **6.2 Save Variables**, copy secret row `id` → env `variableId`.

### Environment variables to maintain

| Variable | Used for |
|----------|----------|
| `baseUrl` | `http://localhost:3001` |
| `testName`, `testEmail`, `testPassword`, `testConfirmPassword` | Auth |
| `verificationToken`, `resetToken` | Email flows |
| `serverId`, `registrationToken`, `agentToken` | Agent |
| `projectId`, `environmentId`, `serviceId`, `deploymentId` | Projects/deploy |
| `repoOwner`, `repoName`, `githubState`, `installationId` | GitHub |
| `githubWebhookSecret`, `githubInstallationId` | Phase 10 |
| `variableId` | 6.6 reveal |
| `bootstrapHost`, `bootstrapSshUser`, `bootstrapPrivateKey` | 2.0.2 (optional) |

---

## Run order for a full API pass

```text
Phase 1 → Phase 2 (register/verify once) → 0.1 Login
→ Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
→ Phase 8–10 as needed → Release 2.0
```

**Processes:** API + **worker** + (for deploy) agent **ONLINE**.

---

## Publish collection (optional)

Postman → Collection → **Share** → public link or workspace visibility.  
Keep environment **private**; document variables in this file instead.
