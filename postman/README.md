# Postman — DeployHub API

Import these files into [Postman](https://www.postman.com/downloads/) (or use the desktop app).

| File | Purpose |
|------|---------|
| [`DeployHub-API.postman_collection.json`](./DeployHub-API.postman_collection.json) | All phased API requests |
| [`DeployHub-Local.example.postman_environment.json`](./DeployHub-Local.example.postman_environment.json) | Template variables — **duplicate and fill with your values** |

## Quick start

1. **Import** collection + example environment.
2. Duplicate environment → name it **DeployHub Local** (keep secrets out of git).
3. Set `testEmail` / `testPassword` to your dev account.
4. Start stack: `docker compose up -d`, `npm run dev:backend`, `npm run worker`.
5. Run **0 — Session → 0.1 Login** before protected folders.
6. Follow phase order in [`docs/TESTING.md`](../docs/TESTING.md).

## Settings

- **Cookies:** enabled (automatic) — auth uses HTTP-only cookies, not Bearer tokens.
- **Host:** use `http://localhost:3001` for `baseUrl`, not `127.0.0.1`.

## Phase 10 webhook

Request **10.2 Simulate push webhook** needs `GITHUB_WEBHOOK_SECRET` in backend `.env` and HMAC headers. See **Phase 10** in [`docs/TESTING.md`](../docs/TESTING.md) for the pre-request script.

## Sharing (recruiters)

See [`docs/POSTMAN-RECRUITER.md`](../docs/POSTMAN-RECRUITER.md). Never commit real passwords, agent tokens, or SSH private keys.
