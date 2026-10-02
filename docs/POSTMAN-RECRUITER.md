# Postman — testing & sharing with recruiters

## In this repository

| File | Import into Postman |
|------|---------------------|
| [`../postman/DeployHub-API.postman_collection.json`](../postman/DeployHub-API.postman_collection.json) | Full phased API collection |
| [`../postman/DeployHub-Local.example.postman_environment.json`](../postman/DeployHub-Local.example.postman_environment.json) | Template env — **duplicate** before use |

See [`../postman/README.md`](../postman/README.md) and [`TESTING.md`](./TESTING.md).

Optional cloud copy (may drift): [DeployHub API on Postman](https://go.postman.co/collection/53428982-8d2ab912-e832-4122-bd81-ebd2a6d4248b).

---

## What recruiters should see

1. **Collection** — phased folders 0–10 + Release 2.0  
2. **Example environment** — placeholders only, no real secrets  
3. **README + TESTING.md** — how to run locally with cookies + worker  

---

## Security — do this before sharing

1. **Never commit** `DeployHub-Local.postman_environment.json` with real passwords or tokens (gitignored).  
2. Duplicate example env → fill with **their** email/password locally.  
3. Rotate anything ever pasted into shared Postman cloud bodies.  
4. SSH bootstrap: leave `bootstrapPrivateKey` empty; use the UI for log streaming.

---

## Collection map

| Folder | Purpose |
|--------|---------|
| **0 — Session** | Login (cookies) before protected APIs |
| **Phase 1** | Health, API root |
| **Phase 2** | Register, verify, profile, password flows |
| **Phase 3** | GitHub App |
| **Phase 4** | Servers, agent register, regenerate token |
| **Phase 5–9** | Projects, env vars, deploy, rollback |
| **Phase 10** | Webhook auto-deploy (HMAC pre-request on 10.2) |
| **Release 2.0** | Public config, SSH bootstrap |

---

## Run order

```text
Phase 1 → Phase 2 (register/verify once) → 0.1 Login
→ Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
→ Phase 8–10 as needed → Release 2.0
```

**Processes:** API + **worker** + (for deploy) agent **ONLINE**.
