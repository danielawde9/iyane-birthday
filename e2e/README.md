# E2E suite

Playwright tests that guard the **supabase-js data layer** end-to-end — above all
that PostgREST's ISO-string timestamps are mapped back to `Date` objects (the routes
that call `Intl.format` / `.toISOString()` / `toLocalInput` would crash otherwise).

## Prerequisites

1. Local Supabase running and seeded (the suite does **not** start it):
   ```bash
   supabase start
   npm run db:push && npm run db:seed && npm run db:bucket
   ```
   `db:bucket` is required for `upload.spec.ts` (storage is configured locally).
2. Playwright browser binary (one-time): `npx playwright install chromium`
3. `.env.local` with the local `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   and `SUPABASE_SERVICE_ROLE_KEY` (from `supabase start` output).

## Run

```bash
npm run e2e
```

The Playwright `webServer` starts `next dev` on `:3015` with `ADMIN_DEV_BYPASS=1`
(so `admin.spec.ts` can reach `/admin` without a login) and `UPLOAD_GEO_BYPASS=1`.
If you already have a dev server on `:3015`, it is reused — start it with
`ADMIN_DEV_BYPASS=1` or the admin spec will skip.

## What each spec covers

| Spec | Path | Guards |
|------|------|--------|
| `public.spec.ts` | `/`, `/gallery`, `/archive`, `/archive/1`, `/guestbook`, `/details` | public (anon, RLS) reads render with no uncaught errors |
| `details.spec.ts` | `/details` | `Intl.format(eventDate)` — hardest Date trap |
| `guestbook.spec.ts` | `GET`/`POST /api/guestbook` | `createdAt.toISOString()` over live rows |
| `admin.spec.ts` | `/admin` | privileged (service-role) reads + `toLocalInput(eventDate)` |
| `upload.spec.ts` | `POST /api/upload` | write chain: insert → `.select()` → `mapPhoto` → `toPhotoDTO` |

Note: `upload.spec.ts` and the guestbook POST insert rows into the **local** DB
(`re-seed to clear`). They use recognizable names (`E2E …`).
