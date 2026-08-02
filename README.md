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
| Database   | **Prisma ORM** with SQLite (swap to Postgres easily) |
| Auth       | Session cookies via **JWT (jose)** + bcrypt hashing |
| Maps       | **Leaflet** with a dark CARTO basemap              |
| Validation | **Zod** on every API boundary                      |

Everything lives in one full-stack codebase — no separate API server.

## Getting started

```bash
npm install          # installs deps + generates the Prisma client
npm run db:push      # create the SQLite schema (dev.db)
npm run db:seed      # load demo clubs, venues and UK-wide events
npm run dev          # http://localhost:3000
```

> The committed `.env` holds development-only defaults so the app runs out of
> the box. **Generate a real `JWT_SECRET` before deploying** (`openssl rand -base64 32`).

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

## Switching to Postgres

1. In `prisma/schema.prisma` change the datasource `provider` to `"postgresql"`.
2. Point `DATABASE_URL` at your Postgres instance.
3. `npm run db:push && npm run db:seed`.

The app code is database-agnostic; only the datasource block changes.

## Notes & next steps

Natural extensions on top of this foundation: image uploads (currently image
URLs), email notifications and reminders, ticketing/payments, event reviews
(the schema already includes a `Review` model), and geocoding so hosts can type
an address instead of pinning a point.
