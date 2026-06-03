# Iyane is ONE — Birthday Invitation & Photo Site 🎩

A shareable photo-album site for a child's birthday: an immersive, full-bleed guest
photo gallery plus a guestbook. Built to be **reused every year** with a new theme
while **keeping every year's photos forever**. The gallery is open to view from
anywhere; **photo uploads are limited to guests in Lebanon** (detected via Cloudflare).

**Year 1 theme:** _Mr. ONEderful_ — dapper bow-tie, navy + gold.

- **Framework:** Next.js 16 (App Router) on **Vercel**
- **Data + Storage + Auth:** **Supabase** (Postgres via Drizzle, Storage, Auth)
- **Access:** view from anywhere; **uploads Lebanon-only** (via **Cloudflare** `cf-ipcountry`)
- **Gallery:** `react-photo-album` (masonry) + `yet-another-react-lightbox`

---

## Quick start

The app **requires a database** (`DATABASE_URL`) — see [Setup](#setup) for a local Supabase.

```bash
npm install
# set DATABASE_URL (+ Supabase keys) in .env.local, then:
npm run db:push && npm run db:seed   # create tables + the Year-1 event
npm run dev                          # http://localhost:3000
```

- Home (living gallery), gallery, slideshow, guestbook, archive run on your seeded data.
- **Share Photos** → uploads are Lebanon-only; the geo check is bypassed locally
  (`UPLOAD_GEO_BYPASS` defaults ON in dev), so the uploader shows.
- **/admin** is open locally (auth is bypassed until Supabase is configured, and **never** in
  production).

Other scripts:

```bash
npm test             # unit tests (rate limit, file validation, geo gate)
npm run build        # production build (needs DATABASE_URL)
npm run lint
```

---

## Pages

| Route | What |
|-------|------|
| `/` | Living gallery — full-bleed rotating guest photos, live guest count, scan-to-upload QR |
| `/gallery` | Masonry gallery + lightbox, featured spotlight, by-contributor filtering |
| `/upload` | Guest upload (Lebanon-only), client-side HEIC convert + compress |
| `/slideshow` | Full-screen auto-advancing wall to project at the venue |
| `/guestbook` | Wishes wall + form |
| `/poster` | Printable QR poster → opens the upload page |
| `/archive` and `/archive/[year]` | Browse past years |
| `/details` | Date, venue, attire |
| `/admin` | Feature/moderate photos, moderate wishes, edit the event, switch/add years |

---

## Going live (Supabase + Vercel)

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Storage → New bucket** → name it `photos` and mark it **Public**.
3. **Settings → API**: copy the Project URL, the `anon` key, and the `service_role` key.
4. **Settings → Database → Connection string**: copy the **Transaction pooler** URL
   (port `6543`) — this is your `DATABASE_URL`.
5. Put the values in `.env.local` (see `.env.example`), then apply the schema and seed:
   ```bash
   npm run db:push      # create tables (or: npm run db:generate && npm run db:migrate)
   npm run db:seed      # create the Year-1 "Mr. ONEderful" event
   ```
6. Open `supabase/policies.sql` and run it in the Supabase **SQL editor** (RLS hardening).
7. **Auth**: enable the **Email** provider (magic link). Add your email to `ADMIN_EMAILS`.

### 2. Environment variables

Copy `.env.example` → `.env.local` and fill it in. Key ones:

- `DATABASE_URL` — **required**; the app won't run without it
- `UPLOAD_ALLOWED_COUNTRY` — country allowed to upload (default `LB`)
- `ADMIN_EMAILS` — who can reach `/admin`
- `ADMIN_DEV_BYPASS=0` and `UPLOAD_GEO_BYPASS=0` in production
- `NEXT_PUBLIC_SITE_URL` — your final URL (used by the OG image + QR poster)

### 3. Deploy to Vercel

1. Push this repo to GitHub and **Import** it at [vercel.com/new](https://vercel.com/new).
2. Add all env vars from `.env.local` to the Vercel project.
3. Deploy, then add your custom domain (e.g. `iyaneawde.com`).
4. `vercel.json` already schedules a weekly cron (`/api/health`) to keep the free
   Supabase project from pausing.

---

## How the Lebanon-only upload gate works

Anyone can **view** the site from anywhere. Only **uploading** is restricted to Lebanon.

1. **Cloudflare WAF rule** (the authoritative gate): on `POST /api/upload`, block when
   `ip.geoip.country ne "LB"`. Viewing stays open; uploads are blocked at the edge for non-LB.
2. **Cloudflare** also adds `cf-ipcountry`. The upload page (`/upload`) reads it: guests in
   `UPLOAD_ALLOWED_COUNTRY` (default `LB`) see the uploader; everyone else sees a friendly
   "uploads are for our Lebanon guests" note. `/api/upload` re-checks it as a cheap backstop
   (`403 geo_locked`), then applies per-IP rate limit + magic-byte image validation.
3. Locally there's no `cf-ipcountry` header, so `UPLOAD_GEO_BYPASS=1` (the default in dev)
   skips the check. Test with
   `curl -i -H "cf-ipcountry: US" -F image=@photo.jpg localhost:3000/api/upload` (expect `403`)
   vs `-H "cf-ipcountry: LB"`.

> **Cloudflare setup (production):** proxy the domain through Cloudflare (orange cloud) with
> **IP Geolocation enabled** so `cf-ipcountry` reaches the origin, add the WAF rule above, and
> set `UPLOAD_GEO_BYPASS=0`. To also stop the rare direct-to-origin hit, enable **Vercel
> Deployment Protection** so the `*.vercel.app` URL can't be reached without going through Cloudflare.

---

## A new theme every year

Each year is one row in the `events` table pointing at a **theme** (a code module in
`src/themes/`). The active event drives the homepage palette (CSS variables), fonts,
and copy. To set up next year:

1. Add a theme module (e.g. `src/themes/safari.ts`) and register it in `src/themes/index.ts`.
2. In **/admin → Active celebration → Years**, "Add year" with that theme and "Make active".

The site re-skins instantly — and **every previous year's photos stay** in Storage and
remain browsable under `/archive`.

---

## Free-tier notes

- **Vercel Hobby** is fine for a personal site. Custom domain ≈ $10/yr.
- **Supabase Free**: 500 MB DB + **1 GB** Storage. Two things to know:
  - Free projects **pause after ~7 days idle** — the weekly cron in `vercel.json`
    keeps it awake (or upgrade to Pro around the event).
  - ~1 GB holds roughly one well-compressed party; several years may need Pro or
    offloading older years to cheaper storage.

---

## Project layout

```
src/
  app/
    (site)/            invitation, gallery, upload, guestbook, archive (shared chrome)
    slideshow, poster  full-screen / printable (no chrome)
    admin              dashboard + login + server actions
    api                unlock, upload, photos, rsvp, guestbook, admin/rsvps, health
  components/          brand (crest/bowtie), site chrome, gallery, upload, invite…
  db/                  Drizzle schema, queries (with demo fallback), seed, migrations
  lib/                 pin (HMAC), geo, ratelimit, files, storage, auth, supabase clients
  themes/              per-year theme modules + registry
  proxy.ts             edge geo-gate
supabase/policies.sql  RLS hardening to run once
```
