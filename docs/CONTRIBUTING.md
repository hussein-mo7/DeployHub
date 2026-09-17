# Contributing & release workflow

## Git commits (small, reviewable)

Push to `main` in **logical commits** — not one giant diff. Suggested split:

| Order | Scope | Example message |
|-------|--------|-----------------|
| 1 | Docs & plan | `docs: Release 2.0 plan and repo index` |
| 2 | Backend auth & reliability | `backend: session TTL, password flows, orphan data fixes` |
| 3 | Backend 2.0 agent platform | `backend: public API URL, config endpoint, Docker install.sh` |
| 4 | Frontend UI & session | `frontend: dashboard shell, auth UX, session refresh` |
| 5 | Agent Docker & CI | `agent: Dockerfile, CI publish workflow, bootstrap script` |

Never commit: `backend/.env`, `agent/.env`, `frontend/dist/`, `.deployhub-workspace/`.

## Postman (cloud)

Collection **DeployHub API** lives in Postman cloud (not in git — see `.gitignore`).

After API changes:

1. Add/update requests in folder **Release 2.0 — Config & Auth** or relevant phase folder.
2. Update [`TESTING.md`](../TESTING.md) with method, URL, expected status.
3. Sync environment **DeployHub Local** if new variables are needed.

## Local verify before push

```powershell
npm run build
npm run dev:backend   # smoke: GET /api/config/public
```

## Active release doc

[`docs/RELEASE-2.0.md`](./RELEASE-2.0.md)
