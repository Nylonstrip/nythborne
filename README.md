# Nythborne — Astraea Campaign Hub

A custom TTRPG campaign hub for the Nythborne RPG system, set in the world of Astraea.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (database + auth)
- **TypeScript**
- **CSS Modules**

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Open `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ftfkmsdoaufmrmhhzgjl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Get from Supabase Dashboard → Project Settings → API → service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Set a strong password for GM dashboard access
GM_PASSWORD=your_strong_password_here
```

> ⚠️ The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. Never expose it client-side.
> ⚠️ Change `GM_PASSWORD` before sharing the URL with anyone.

### 3. Database
The schema is already applied to your Supabase project (Nythborne).
All 11 tables are live with RLS enabled.

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Routes

### Player Portal (public)
| Route | Description |
|-------|-------------|
| `/world` | Homepage — world overview and stats |
| `/nations` | All revealed nations |
| `/nyths` | Known Nyths (player characters + NPCs) |
| `/relics` | Relic registry with discovery tracker |
| `/history` | Timeline grouped by era |
| `/rules` | Rules by category |
| `/campaign` | Active campaign — live notes + session history |

### GM Dashboard (password protected)
| Route | Description |
|-------|-------------|
| `/admin/login` | GM login |
| `/admin` | Dashboard with stats and quick actions |
| `/admin/nations` | Manage nations |
| `/admin/nyths` | Manage Nyths |
| `/admin/relics` | Manage the Relic registry |
| `/admin/timeline` | Manage timeline events |
| `/admin/rules` | Manage rules |
| `/admin/campaign` | Run sessions, push live notes |

---

## Visibility System

Every lore entry has one of three visibility states:

| State | Who sees it |
|-------|-------------|
| `hidden` | GM only (never shown to players) |
| `revealed` | Players can see it (use for mid-campaign reveals) |
| `public` | Always visible (general world knowledge) |

Control this per-entry from the GM dashboard. Flip an entry from `hidden` → `revealed` during a session to show it to players in real time.

---

## Deploying to Vercel
1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.local`
4. Deploy

The app will be live at your Vercel URL — share the player portal URL with your players, keep the `/admin` URL to yourself.
