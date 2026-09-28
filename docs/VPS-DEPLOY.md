# DeployHub on a VPS (control plane + local Postgres)

Run the **control plane** (UI + API + worker + Postgres + Redis) on **one Linux VPS**.  
Deploy **target** apps on the same VPS or on **other** VPSs via the agent.

**Not** Neon, **not** your laptop — Postgres and Redis live on the control-plane VPS via Docker.

**Related:** [OPERATIONS.md](./OPERATIONS.md) (agent image, SSH bootstrap) · [TESTING.md](./TESTING.md) (local dev)

---

## Architecture on the control-plane VPS

```text
Internet ──HTTPS──▶ Caddy/nginx ──▶ Node :3001 (API + static UI + Socket.IO)
                              │
                    Docker: Postgres + Redis (127.0.0.1 only)
                    systemd: deployhub-api + deployhub-worker
```

---

## Readiness checklist (before you SSH)

| Item | Status |
|------|--------|
| Domain DNS → control-plane VPS IP | You configure |
| GitHub App created (ID, slug, PEM, webhook secret) | [TESTING.md](./TESTING.md) |
| Agent image on GHCR (`AGENT_DOCKER_IMAGE`) | [OPERATIONS.md](./OPERATIONS.md) |
| Strong `JWT_SECRET`, `ENCRYPTION_KEY`, Postgres password | Generate on VPS |
| Resend (or email) for verify/reset | Optional but recommended |
| **Second VPS** (optional) | Only needed to demo “remote” deploy targets |

---

## Step 1 — Prepare the VPS

1. Ubuntu 22.04+ or Debian 12, **2 GB+ RAM** recommended.
2. Install:

```bash
sudo apt update && sudo apt install -y git curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker "$USER"
# log out and back in for docker group
```

3. Open firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Do **not** expose Postgres (5432) or Redis (6379) publicly — use `docker-compose.prod.yml`.

---

## Step 2 — Clone and install

```bash
cd /opt
sudo git clone https://github.com/YOUR_USER/DeployHub.git deployhub
sudo chown -R "$USER:$USER" deployhub
cd deployhub
npm install
```

---

## Step 3 — Postgres + Redis on this VPS

1. Edit `docker-compose.yml` → set a strong `POSTGRES_PASSWORD` (and match it in `DATABASE_URL` later).
2. Start with localhost-only ports:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose ps
```

3. Verify:

```bash
docker exec deployhub-postgres pg_isready -U deployhub
docker exec deployhub-redis redis-cli ping
```

---

## Step 4 — Backend environment

```bash
cp backend/.env.vps.example backend/.env
nano backend/.env
```

Set at minimum:

- `DATABASE_URL` → `postgresql://deployhub:YOUR_PASSWORD@127.0.0.1:5432/deployhub?schema=public`
- `REDIS_URL` → `redis://127.0.0.1:6379`
- `CLIENT_URL` → `https://your-domain.com`
- `PUBLIC_API_URL` → same HTTPS URL (agents and install.sh use this)
- `JWT_SECRET`, `ENCRYPTION_KEY` → long random strings
- `AGENT_DOCKER_IMAGE` → your GHCR tag
- GitHub App variables
- `RESEND_API_KEY` + `EMAIL_FROM` if using email

Frontend build (same origin — API at `/api`):

```bash
echo 'VITE_API_URL=/api' > frontend/.env.production
```

---

## Step 5 — Build app and database schema

```bash
npm run build
npm run db:deploy
```

(`db:deploy` runs `prisma db push` — fine for a fresh VPS; use Prisma migrations later if you add them.)

---

## Step 6 — Run API + worker (test manually)

**Terminal A:**

```bash
NODE_ENV=production npm run start
```

**Terminal B:**

```bash
NODE_ENV=production npm run start:worker
```

Check:

```bash
curl -s http://127.0.0.1:3001/api/health
```

---

## Step 7 — HTTPS reverse proxy (Caddy example)

Install Caddy, then `/etc/caddy/Caddyfile`:

```caddy
deployhub.yourdomain.com {
    reverse_proxy localhost:3001
}
```

```bash
sudo systemctl reload caddy
```

Node serves the **built React app** and `/api/*` on port 3001 when `NODE_ENV=production`.

---

## Step 8 — systemd (keep running after logout)

`/etc/systemd/system/deployhub-api.service`:

```ini
[Unit]
Description=DeployHub API
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/opt/deployhub
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/deployhub-worker.service` — same but `ExecStart=/usr/bin/npm run start:worker`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now deployhub-api deployhub-worker
sudo systemctl status deployhub-api deployhub-worker
```

---

## Step 9 — Smoke test in the browser

1. Open `https://your-domain.com` → register / login.
2. **Settings → Integrations** → connect GitHub.
3. **Servers** → add server → install agent (SSH or manual) on a **target** VPS.
4. **Projects** → create → deploy → watch logs.

Dashboard should show **Control plane: Healthy** (DB + Redis).

---

## Step 10 — GitHub webhook

Webhook URL: `https://your-domain.com/api/github/webhook`  
Use the secret from `GITHUB_WEBHOOK_SECRET`.

---

## Updating a release

```bash
cd /opt/deployhub
git pull
npm install
npm run build
npm run db:deploy
sudo systemctl restart deployhub-api deployhub-worker
```

---

## Common issues

| Problem | Fix |
|---------|-----|
| Agent install uses localhost | Set `PUBLIC_API_URL` to public HTTPS; restart API + worker |
| Deploy stays queued | Worker not running or Redis down |
| 502 from Caddy | API not listening on 3001 — check `journalctl -u deployhub-api` |
| CORS errors | `CLIENT_URL` must exactly match browser URL (scheme + host) |
| Session expires quickly | Fixed in app — ensure latest frontend; cookies need HTTPS in prod |

---

## What stays on your PC

Only **development**. Production data lives in **Postgres on the VPS** (`postgres_data` Docker volume). Back up that volume before major upgrades.
