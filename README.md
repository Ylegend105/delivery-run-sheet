# Delivery Run Sheet

A dispatcher assigns deliveries to drivers. A driver sees only their own
deliveries and marks each one delivered.

## Architecture overview

- **Next.js (App Router) + TypeScript**, deployed on Vercel. All data access
  happens in Server Components and Server Actions — no client-side Supabase
  calls, so secrets never reach the browser and there's one code path to
  reason about for access control.
- **Supabase (Postgres)** is the only datastore. Rather than using Supabase
  Auth (which requires either a password or an email round-trip), sign-in is
  a custom flow: a server route looks the entered email up in an allowlist
  table (`users`) and, if found, mints its own Supabase-compatible JWT
  (signed with the project's JWT secret) and sets it as an httpOnly cookie.
  Every subsequent Supabase query from that browser session carries that JWT
  as its Authorization bearer token, so **Postgres Row Level Security is
  what actually enforces who can see and change what** — not application
  `if` statements. See "Custom Postgres roles" below for how the JWT's
  `role` claim maps onto real RLS policies.
- **Tailwind CSS**, used directly with no component library — plain utility
  classes on plain HTML elements.
- **Plain `fetch`** to OpenWeatherMap's current-weather endpoint, called
  server-side per delivery, no SDK.

### Custom Postgres roles (why RLS is "real" here)

Supabase's usual RLS pattern checks `auth.uid()` / `auth.role()` against
claims from a Supabase Auth session. Since this app mints its own JWTs, it
follows Supabase's documented **Custom Claims & RBAC** pattern instead of the
default `authenticated` role:

- The database migration creates two real Postgres roles, `dispatcher` and
  `driver`, and grants both to `authenticator` (the role PostgREST connects
  as).
- Our login route's JWT sets its `role` claim to literally `"dispatcher"` or
  `"driver"`. PostgREST verifies the JWT signature (using
  `SUPABASE_JWT_SECRET`) and executes the request as that Postgres role via
  `SET LOCAL ROLE`.
- Table and **column**-level `GRANT`s differ per role — e.g. `driver` only
  ever has `UPDATE` privilege on the `status` and `delivered_at` columns of
  `deliveries`, full stop, regardless of what the application code sends.
- RLS policies scoped `TO dispatcher` / `TO driver` then filter rows, e.g.
  drivers can only `SELECT`/`UPDATE` deliveries where
  `assigned_driver_id = auth.uid()`.

This means a compromised or buggy Server Action still can't leak or mutate
data outside a role's boundaries — the database itself refuses it. This is
verified by `scripts/verify-rls.mjs`, which signs throwaway JWTs for two fake
drivers and confirms driver B genuinely cannot read or write driver A's row.

## Setup — run locally

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in the five values
   (see "Environment variables" below).
3. `npm run dev`, open http://localhost:3000

## Setup — database

Run each file in `supabase/migrations/` once, in filename order
(`0001_init.sql`, then `0002_dispatcher_delete.sql`), via the Supabase
dashboard's **SQL Editor** (or `supabase db push` if you use the CLI with a
linked project). Then seed the allowlist — copy
`supabase/seed.example.sql`, replace the placeholder emails, and run it the
same way.

## Environment variables

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → Project API keys → `service_role` (secret) |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Settings → JWT Secret |
| `OPENWEATHERMAP_API_KEY` | openweathermap.org → My API keys |

Set the same five in Vercel: **Project Settings → Environment Variables**
(Production + Preview + Development).

The marketing video has its own separate env file, `marketing-video/.env`,
holding `ELEVENLABS_API_KEY` (elevenlabs.io → Developers → API Keys). It is
only needed to regenerate the voice-over locally — the deployed site doesn't
use it, so it does not belong in Vercel.

## Redeploying

Push to the connected GitHub repo's default branch — Vercel redeploys
automatically. For a manual deploy: `npx vercel --prod` from the project
root (requires `vercel link` once, and the env vars above set in Vercel).

## Marketing video (`marketing-video/`)

A 24-second pitch video built with [Remotion](https://remotion.dev) and
narrated by [ElevenLabs](https://elevenlabs.io) text-to-speech.

```bash
cd marketing-video
npm install
echo "ELEVENLABS_API_KEY=sk_..." > .env   # gitignored
npm run voiceover                         # writes public/voiceover.mp3 + src/timings.json
npm run render                            # writes out/delivery-run-sheet.mp4
npm run studio                            # optional: interactive preview
```

The narration lives in `src/narration.json`, one line per scene.
`scripts/generate-voiceover.mjs` sends the whole script to ElevenLabs'
`/with-timestamps` endpoint, which returns the audio *and* character-level
timings; the script converts those into per-scene start/end times in
`src/timings.json`, so the visuals follow the real speech instead of
hand-guessed durations. Re-run `npm run voiceover` after editing the
narration and the scene timing re-syncs itself.

The video project has its own `package.json` and is excluded from the app's
`tsconfig.json` and ESLint config, so it can never break the Vercel build.

## Shortcuts taken (and what "more correct" would look like)

- **Weather lookup uses the raw address string as OpenWeatherMap's `q`
  (city name) parameter** (`lib/weather.ts`), taking whatever's after the
  last comma in the address. This works for "Street, City"-style input but
  can miss on a full unambiguous street address. A real version would
  geocode the address first (OpenWeatherMap's Geocoding API, or Google/Mapbox)
  to get lat/lon and query by coordinates.
- **No email verification / no password**, by design per spec — the `users`
  table itself is the allowlist, and possessing the signed session cookie is
  the only proof of identity after that. A real version aimed at the public
  internet would want at least a magic-link email round trip or short-lived
  OTP, so that knowing someone's email isn't enough to have the cookie
  minted on your behalf from a shared/public machine.
- **Weather is fetched per delivery on every dispatcher/driver page load**
  (cached 10 minutes via Next's `fetch` revalidation, not deduplicated
  across duplicate addresses on the same page). Fine at this scale; a real
  version would cache by city, not by delivery.
- **No rate limiting on `/api/auth/login`.** Since it's allowlist-based (no
  password to brute-force) the worst case is enumerating which emails are
  registered, which is a low-severity issue here, but a public production
  version would add basic rate limiting.
- **The marketing video was built by driving Remotion directly, not via the
  Remotion Claude Code plugin.** The plugin was not present in this account's
  plugin catalog and there was no `claude` CLI on `PATH` in the session to add
  an external plugin marketplace with, so installing it wasn't possible from
  where the work was happening. The plugin is a convenience wrapper — skills
  and commands around the same `@remotion/cli` — so the output is the same
  MP4 either way. To use the real plugin: `claude plugin marketplace add
  remotion-dev/remotion` then `/plugin install` from an interactive terminal.
- **Voice: a stock ElevenLabs voice ("Brian"), hardcoded by ID.** A free
  ElevenLabs account can't use *library* voices via the API, and listing
  voices needs a `voices_read` permission the render key deliberately doesn't
  have (it's scoped to text-to-speech only). Hardcoding a known-good default
  voice ID avoided both limits. A paid account would list voices and pick.
- **Database password handling**: the Postgres database password generated
  during project creation is only needed for direct `psql`/CLI database
  connections, which this app doesn't use (all access goes through
  PostgREST via the anon/service-role keys + JWTs). It isn't referenced
  anywhere in the app and isn't a required env var.

## Claude Code tooling used during this build

- **Skills** (packaged instructions Claude Code loads for a specific kind of
  task, similar to a saved runbook): none were used for feature work in this
  build — the app code, SQL, and README were written directly.
- **Plugins** (bundles of skills/commands/config someone else packaged and
  you install): none were used.
- **MCP servers** (Model Context Protocol — a standard way to give Claude
  Code tools beyond its built-ins, e.g. talking to a specific external
  service): none were used for this app. All Supabase/GitHub/OpenWeatherMap
  work was done with the Supabase CLI, GitHub CLI, and plain `curl`/`fetch`
  calls run directly in a terminal, not through an MCP integration.

For the marketing video, the Remotion plugin was asked for but wasn't
installable in that session (see Shortcuts above), so Remotion was driven
directly through its CLI. A browser tool *was* used, to open the ElevenLabs
dashboard and create a text-to-speech-scoped API key.

## Checklist

- [x] 3+ distinct pages/routes (`/login`, `/dispatcher`, `/driver`, `/settings`)
- [x] Settings change (name, WhatsApp number) takes effect immediately —
      read live from `users` on every page render, not cached
- [x] 7 distinct user actions (create delivery, assign/reassign, view own
      list, mark delivered, edit profile, WhatsApp deep link, weather tag)
- [x] Public GitHub repo with incremental commit history
- [x] Supabase RLS genuinely restricts drivers — proven by
      `scripts/verify-rls.mjs` against the live database
- [x] Live Vercel URL
- [x] Allowlist-only sign-in, no verification email
- [x] Two roles behave differently at the data layer (distinct Postgres
      roles + RLS policies + column grants, not just UI conditionals)
- [x] WhatsApp button opens a prefilled `wa.me` chat
- [x] OpenWeatherMap call working with a user-supplied key
