# DeployHub — UI design guidelines (1.1)

**Status:** Draft — fill tokens and rules as the polish sprint progresses.  
**Backlog:** [`ROADMAP.md`](../ROADMAP.md) §2–§3.

---

## Principles

1. **Clarity over decoration** — deployment tools are stressful; reduce noise.  
2. **Density where it matters** — tables for env vars, deployments, servers.  
3. **One accent color** — status colors are semantic, not decorative.  
4. **Monospace for machine data** — logs, SHAs, ports, installation IDs.  
5. **Accessible by default** — contrast, focus rings, keyboard nav on tables and dialogs.

---

## Tokens (to implement in `frontend/src/styles/globals.css`)

| Token | Usage |
|-------|--------|
| `--background` | Page canvas |
| `--surface` | Cards, panels |
| `--foreground` | Primary text |
| `--muted-foreground` | Secondary text |
| `--primary` | Primary buttons, links |
| `--destructive` | Delete, failed deploy |
| `--success` | SUCCESS status, save confirm |
| `--warning` | RUNNING / queued |
| `--radius-sm` / `--radius-md` | Inputs vs cards |

Replace default shadcn blue only after picking brand hue in ROADMAP §3.

---

## Typography

| Role | Style |
|------|--------|
| Page title | `text-2xl font-semibold tracking-tight` |
| Section | `text-sm font-medium text-foreground` |
| Helper | `text-xs text-muted-foreground` |
| Log / SHA | `font-mono text-xs` |

---

## Components

- **Buttons:** One primary per section; destructive isolated in menus.  
- **Forms:** Label above input; error below field.  
- **Secrets:** Masked value + eye toggle; never show plaintext in list without explicit reveal.  
- **Empty states:** Icon + one sentence + primary CTA button.  
- **Toasts:** Success/error for save, deploy queue, disconnect GitHub.

---

## Layout

- App shell: sidebar width `240px` (collapsible to icons).  
- Main content: `p-6`, `max-w-6xl` where readable; full width for log viewer.  
- Breadcrumbs on nested routes (project, server detail).

---

## Reference products (UX patterns, not visual copy)

- Environment variables: Vercel / Railway / Render — reveal, rotate, scope per environment.  
- Deployments: GitHub Actions / Coolify — log stream, status badge, duration.  
- Settings: Linear-style sections with short descriptions.

Update this file when tokens land in CSS so recruiters see intentional design, not ad-hoc Tailwind.
