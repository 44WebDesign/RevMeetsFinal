# RevMeet 🏁

The UK's platform for discovering and organising car events — car shows, track
days, night cruises, drift events and meetups. Built for three audiences:

- **Car enthusiasts** search for events by keyword, location, date and type — or
  explore everything on an **interactive map**, register to attend, and follow
  their favourite clubs and venues.
- **Event hosts / car clubs** create and promote events, build a public club
  profile, and manage registrations from a dashboard.
- **Venues** publish a profile pinned on the map to promote themselves as a
  location for meets and events.

## Tech stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | **Next.js 15** (App Router, React 18, TypeScript)  |
| Styling    | Tailwind CSS + a small custom design system (CSS)  |
| Database   | **Prisma ORM** with PostgreSQL (Neon / Vercel Postgres) |
| Auth       | Session cookies via **JWT (jose)** + bcrypt hashing |
| Maps       | **Leaflet** with a dark CARTO basemap              |
| Validation | **Zod** on every API boundary                      |

Everything lives in one full-stack codebase — no separate API server.

## Getting started

RevMeet uses **PostgreSQL**. The easiest local database is a free
[Neon](https://neon.tech) project (no install) — create one and copy its
connection string. A local Postgres works too.

```bash
cp .env.example .env         # then paste your DATABASE_URL + a JWT_SECRET
npm install                  # installs deps + generates the Prisma client
npm run db:push              # create the tables
npm run db:seed              # load demo clubs, venues and UK-wide events
npm run dev                  # http://localhost:3000
```

> Generate a real `JWT_SECRET` with `openssl rand -base64 32`.

## Deploying to Vercel

1. **Push this repo to GitHub** (already done if you're reading this there).
2. In Vercel: **Add New → Project → import the repo**. It auto-detects Next.js.
3. **Add a database:** in the project, go to **Storage → Create Database →
   Postgres** (Neon-backed). Vercel adds the connection env vars automatically.
4. **Set environment variables** (Project → Settings → Environment Variables):
   - `DATABASE_URL` — your Postgres **pooled** connection string (from step 3,
     or a Neon pooled URL).
   - `JWT_SECRET` — run `openssl rand -base64 32` and paste the result.
   - *(optional)* `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for Google login,
     with redirect URI `https://<your-domain>/api/auth/google/callback`.
5. **Deploy.** Vercel runs `prisma generate && next build`.
6. **Create the tables + demo data once** (from your machine, pointing at the
   production DB — use the **non-pooling** URL for this step):
   ```bash
   DATABASE_URL="<prod-non-pooling-url>" npx prisma db push
   DATABASE_URL="<prod-non-pooling-url>" npm run db:seed   # optional demo data
   ```

That's it — your app is live at the Vercel URL.

### Demo logins

All demo accounts use the password `password123`:

| Role       | Email                      |
| ---------- | -------------------------- |
| Enthusiast | `enthusiast@revmeet.test`  |
| Host/Club  | `eastlondon@revmeet.test`  |
| Venue      | `harewood@revmeet.test`    |

## Key routes

| Path                     | What it is                                        |
| ------------------------ | ------------------------------------------------- |
| `/`                      | Home — hero search, live map, featured content    |
| `/events`                | Search & filter events (keyword, city, date, type)|
| `/events/[slug]`         | Event detail + register to attend + location map  |
| `/map`                   | Full interactive map explorer (events + venues)   |
| `/clubs`, `/clubs/[slug]`| Browse & follow car clubs                         |
| `/venues`, `/venues/[slug]` | Browse & follow venues                         |
| `/register`, `/login`    | Auth (choose account type on sign-up)             |
| `/dashboard`             | Role-aware dashboard                              |
| `/dashboard/events/new`  | Create an event (click-to-pin location)           |
| `/dashboard/events/[id]/edit` | Manage / delete an event                     |
| `/dashboard/club`, `/dashboard/venue` | Edit your public profile             |

## API

REST route handlers under `src/app/api`:

- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- `GET|POST /api/events` · `GET`-filtered by `q`, `type`, `city`, `from`, `to`
- `PATCH|DELETE /api/events/[id]` · `POST|DELETE /api/events/[id]/register`
- `GET|PATCH /api/clubs` · `GET|PATCH /api/venues`
- `POST /api/follow` (toggles a club/venue follow)

## Project structure

```
prisma/
  schema.prisma      # data model (User, Club, Venue, Event, Registration, follows)
  seed.ts            # demo data
src/
  app/               # pages + API route handlers (App Router)
  components/        # UI (cards, map, forms, nav)
  lib/               # prisma client, auth, validation (zod), queries, enums, utils
```

## Notes & next steps

Natural extensions on top of this foundation: image uploads (currently image
URLs), email notifications and reminders, ticketing/payments, event reviews
(the schema already includes a `Review` model), and geocoding so hosts can type
an address instead of pinning a point.
