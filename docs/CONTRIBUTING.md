# Contributing & release workflow

## Git commits (small, reviewable)

Push to `main` in **logical commits** — not one giant diff.

Never commit: `backend/.env`, `agent/.env`, `frontend/dist/`, `.deployhub-workspace/`, or personal Postman env files (`postman/*-local*.json`).

## Postman (in repo)

Collection and **example** environment live under [`postman/`](../postman/).

After API changes:

1. Update [`postman/DeployHub-API.postman_collection.json`](../postman/DeployHub-API.postman_collection.json) (or regenerate and review the diff).
2. Update [`docs/TESTING.md`](./TESTING.md) with method, URL, expected status.
3. Add new variables to [`postman/DeployHub-Local.example.postman_environment.json`](../postman/DeployHub-Local.example.postman_environment.json) when needed.

## Local verify before push

```powershell
npm run build
npm run dev:backend   # smoke: GET /api/config/public
```

## Active release doc

[`docs/RELEASE-2.0.md`](./RELEASE-2.0.md)
