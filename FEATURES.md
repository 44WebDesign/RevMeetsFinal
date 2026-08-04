# RevMeet — Feature Inventory & Changelog

> **This document is auto-maintained.** Every change made to RevMeet must be
> reflected here in the same commit: tick/add the feature in the relevant
> category below **and** add a row to the [Changelog](#changelog). This rule is
> enforced via `CLAUDE.md`, which every Claude Code session reads automatically.

---

## 1. Platform & Tech Stack

- ✅ **Next.js 15** (App Router, React 18, TypeScript) — one full-stack codebase, no separate API server
- ✅ **PostgreSQL** via **Prisma ORM** (Neon-backed on Vercel; works with any Postgres)
- ✅ **Tailwind CSS** + custom design system ported from the original RevMeet home page design
- ✅ **Zod** validation on every API boundary
- ✅ **Leaflet** maps with dark CARTO basemap
- ✅ Self-hosted **Bebas Neue / Inter** fonts via `next/font` (no runtime CDN dependency)
- ✅ Dark automotive theme (orange `#FF5F1F` accent), fully responsive (mobile nav, collapsing grids)
- ✅ Custom favicon (checkered-flag mark) and 404 page

## 2. Accounts & Authentication

- ✅ Three account types chosen at sign-up: **Car Enthusiast**, **Event Host / Club**, **Venue**
- ✅ Email + password auth (bcrypt-hashed, minimum 8 chars)
- ✅ **Google sign-in** (OAuth 2.0 / OpenID Connect) with signed state + CSRF nonce; links to existing email accounts automatically; carries chosen account type through sign-up
- ✅ JWT session cookies (30-day, httpOnly, secure in production)
- ✅ Host/venue accounts get an editable club/venue profile bootstrapped at sign-up (email or Google)
- ✅ Clear error when a Google-only account tries password login
- ✅ Login/register pages redirect back to where the user was (`?next=`)

## 3. Events

- ✅ Create / edit / delete events (hosts & venues only; ownership enforced server-side)
- ✅ Nine event types: Car Show, Track Day, Night Cruise, Drift Event, Stance Meet, JDM Meet, Classic Cars, Supercar Meet, Meet
- ✅ Event statuses: Published / Draft (hidden) / Cancelled
- ✅ Event fields: title, description, type, start/end time, city, region, address, price info, capacity, cover image, exact map location
- ✅ **Click-to-pin location picker** (draggable marker) in the event form
- ✅ **Venue selector** in the event form — linking a venue pulls through its amenities and drops the pin at its location
- ✅ **Per-event amenities with icons** ("What's There" block on the event page): defaults from the selected venue, individually add/removable per event; included in the event's structured data
- ✅ Search & filters: keyword, city, event type, date range (case-insensitive)
- ✅ Event detail pages: hero image, description, location map, organiser/club/venue links, price panel
- ✅ **Register to attend** (one tap), cancel registration, live attendee counts
- ✅ Capacity limits — event shows "full" and blocks registration when reached
- ✅ Auto-generated unique URL slugs

## 4. Interactive Map (core discovery feature)

- ✅ Full-page **map explorer** (`/map`): every event + venue, live keyword filter, per-type toggles, event/venue layer toggles, synced results list
- ✅ Colour-coded pins by event type (matching the design's legend), venue pins in cyan
- ✅ Rich dark-themed popups with type badge, date, city and a link to the page
- ✅ Embedded maps on: home page, events list (fits to results), event detail, venue detail
- ✅ Scroll-friendly behaviour (wheel zoom activates on click)

## 5. Clubs

- ✅ Public club profiles: description, location, categories, cover image, website, follower count
- ✅ Club directory (`/clubs`) with search
- ✅ **Follow / unfollow** clubs (one tap, live counts)
- ✅ Club's upcoming events listed on its profile
- ✅ Owners edit their club from the dashboard

## 6. Venues

- ✅ Venues promote themselves as event locations: description, address, capacity, amenities, categories, photo, website, exact map pin
- ✅ **Amenity catalog with icons** (22 options: parking, hot food, alcoholic drinks, kids area, smoking area, EV charging, track access, dyno…) — venues tick what they offer; shown as an icon block on the venue page
- ✅ Venue directory (`/venues`) with search
- ✅ **Follow / unfollow** venues
- ✅ Events held at a venue listed on its profile
- ✅ Venue accounts' events default to their own venue location
- ✅ Owners edit their venue (including click-to-pin location) from the dashboard

## 7. Reviews & Ratings

- ✅ Attendees rate events 1–5 stars with optional comment, once the event has started
- ✅ One review per user per event (editable); only registered attendees can review (spam control)
- ✅ Reviews + average rating displayed on event pages
- ✅ Average rating feeds `AggregateRating` structured data → ★ stars eligible in Google results

## 8. Email Notifications

*(Active when `RESEND_API_KEY` is set; skipped gracefully otherwise)*

- ✅ Registration confirmation email on first sign-up to an event
- ✅ New-event alerts emailed to a club's followers on publish
- ✅ Daily pre-event reminder (8am cron via `vercel.json`) to registered attendees, deduplicated per registration
- ✅ Branded dark email template

## 9. Images

- ✅ **Direct image uploads** to Vercel Blob for hosts/venues (5 MB cap, JPG/PNG/WebP/GIF/AVIF), with URL-paste fallback and live preview
- ✅ **`next/image` optimization** everywhere: responsive resizing, WebP/AVIF, lazy loading, `priority` on detail-page heroes (Core Web Vitals)

## 10. SEO & Discoverability

- ✅ Per-page metadata on every event/club/venue: unique titles, descriptions, canonical URLs, Open Graph + Twitter cards
- ✅ **Schema.org JSON-LD**: `Event` (dates, geo, address, organiser, offers, aggregate rating), `Organization` (clubs), `Place` (venues, with amenities), site-wide `WebSite` + `SearchAction` (sitelinks search box)
- ✅ **Category landing pages**: `/events/type/<category>` for all nine types, with unique landing copy, map, `ItemList` markup, cross-links
- ✅ **City landing pages**: `/events/in/<city>`, generated automatically from cities with published events
- ✅ Dynamic **`sitemap.xml`** (all published events, clubs, venues, category + city pages)
- ✅ **`robots.txt`** (crawl allowed; API/dashboard/auth pages excluded; sitemap referenced)
- ✅ `noindex` on login, register and dashboard pages
- ✅ Internal linking: footer + homepage tags point at category pages

## 11. Dashboards

- ✅ Role-aware dashboard: hosts/venues see event stats (events, registrations, published/drafts) and manage their events; enthusiasts see events they're attending and who they follow
- ✅ Quick links to edit club/venue profile and view public pages

## 12. Deployment & Infrastructure

- ✅ Vercel deployment (production branch `main`) with Neon Postgres
- ✅ **Auto schema sync on deploy** — `vercel-build` runs `prisma db push` (idempotent; direct connection via `directUrl`, pooled at runtime)
- ✅ **One-time demo-data seed endpoint** `/api/dev/seed?token=…` — triple-guarded (token env var, token match, refuses on non-empty DB); demo data also loadable via `npm run db:seed`
- ✅ REST API under `/api/*` with shared error handling (Zod → 422, auth → 401/403)
- ✅ `.env.example` documenting every variable; all integrations optional and gracefully degrading

---

## Changelog

*Newest first. Every future change adds a row here.*

| Date | Commit | Change |
| --- | --- | --- |
| 2026-08-04 | `5f2e2aa` | Amenity catalog with icons: venue amenity picker, venue selector in the event form (pulls amenities + location through), per-event amenity add/remove, icon blocks on venue + event pages, amenities in structured data |
| 2026-08-04 | `a28419f` | Image optimization (`next/image`), category + city SEO landing pages, email notifications (confirmations, follower alerts, reminder cron), event reviews & ratings with `AggregateRating`, direct image uploads (Vercel Blob) |
| 2026-08-04 | `bf31f9e` | SEO layer: per-page metadata, Schema.org JSON-LD (Event/Organization/Place/WebSite), dynamic sitemap, robots.txt, favicon, noindex on private pages |
| 2026-08-03 | `a0da6a0` | Guarded one-time demo-data seed endpoint (`/api/dev/seed`) |
| 2026-08-03 | `b9b235c` | Auto-create database tables on Vercel deploy (`vercel-build` + `directUrl`) |
| 2026-08-02 | `ae45503` | Switched SQLite → PostgreSQL, case-insensitive search, Vercel deployment guide; `main` branch created |
| 2026-08-02 | `e452027` | Fixed display font (self-hosted Bebas Neue/Inter via `next/font`), added Google sign-in |
| 2026-08-02 | `8f37530` | Initial full platform: three account types, events + search, interactive map explorer, clubs, venues, registrations, follows, dashboards, seed data |
