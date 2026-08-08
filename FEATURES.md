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
- ✅ **Password reset** — "Forgot password?" flow with an emailed, 1-hour, single-use signed link (stateless; invalidated once the password changes); logs in automatically after reset
- ✅ **Account settings** (`/account`) — edit display name, bio and avatar colour; change password (Google-only accounts can set one to also log in by email)

## 3. Events

- ✅ Create / edit / delete events (hosts & venues only; ownership enforced server-side)
- ✅ Nine event types: Car Show, Track Day, Night Cruise, Drift Event, Stance Meet, JDM Meet, Classic Cars, Supercar Meet, Meet
- ✅ Event statuses: Published / Draft (hidden) / Cancelled
- ✅ Event fields: title, description, type, start/end time, city, region, address, price info, capacity, cover image, exact map location
- ✅ **Click-to-pin location picker** (draggable marker) in the event form
- ✅ **Venue selector** in the event form — linking a venue pulls through its amenities and drops the pin at its location
- ✅ **Per-event amenities with icons** ("What's There" block on the event page): defaults from the selected venue, individually add/removable per event; included in the event's structured data
- ✅ **`/events` is a map-first explorer** — sidebar filters on the left drive a full-height interactive map, with a prominent **Map / List** toggle to switch to the card grid; both views share one filter set
- ✅ Explorer filters: keyword, city, near-me (geolocation + distance radius), date range, event type, amenities — all applied live client-side; deep-links (`?type=`, `?city=`, `?amenities=`) seed the initial state
- ✅ **Amenity filtering** in event search (collapsible icon-chip panel; matches events offering *all* selected amenities, including those inherited from a venue)
- ✅ Amenity icon strip on event cards (and venue cards) across list, search and profile views
- ✅ Event detail pages: hero image, description, location map, organiser/club/venue links, price panel
- ✅ **Register to attend** (one tap), cancel registration, live attendee counts
- ✅ **Save / bookmark events** for later — a bookmark button on every event **card** (and the event page), plus a "Saved for Later" section on the enthusiast dashboard
- ✅ **Featured / promoted events (paid)** — hosts pay via Stripe Checkout to feature an event (default £9.99 / 30 days); featured events sort first in listings and show a gold "Featured" badge. Promotions auto-expire (daily cron) and can be extended
- ✅ **Recurring events** — create weekly / fortnightly / monthly series (up to 26 dates) in one go; each occurrence is its own event with its own page and registrations
- ✅ **Add to Calendar** (Google Calendar link + Apple/Outlook `.ics` download) and **share** buttons (native share / WhatsApp / X / Facebook / copy link) on event pages
- ✅ Capacity limits — event shows "full" and blocks registration when reached
- ✅ Auto-generated unique URL slugs

## 4. Interactive Map (core discovery feature)

- ✅ Full-page **map explorer** (`/map`): every event + venue, live keyword filter, per-type toggles, event/venue layer toggles, synced results list
- ✅ **Amenity filtering on the map** — icon chips filter both event and venue pins live
- ✅ **"Near me" geolocation** — one-tap browser location with a distance radius (5–100 km or any), a "you are here" marker, nearest-first results and per-result distance badges
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
- ✅ Venue directory (`/venues`) with search and **instant amenity filtering** (icon chips, URL-shareable)
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
- ✅ **Terms of Service** and **Privacy Policy** pages (UK GDPR-oriented), linked in the footer and in the sitemap

## 11. Monetisation

*(Active when `STRIPE_SECRET_KEY` is set; the promote button shows "not enabled" otherwise)*

- ✅ **Paid featured placement** via Stripe Checkout — a "Feature for £… / N days" button on the event manage page opens Stripe Checkout; on successful payment the event is featured for the configured window (verified server-side on the success redirect, idempotent). Price/duration configurable via env; promotions extend and auto-expire.

## 12. Dashboards

- ✅ Role-aware dashboard: hosts/venues see event stats (events, registrations, published/drafts) and manage their events; enthusiasts see events they're attending and who they follow
- ✅ Quick links to edit club/venue profile and view public pages

## 13. Deployment & Infrastructure

- ✅ Vercel deployment (production branch `main`) with Neon Postgres
- ✅ **Auto schema sync on deploy** — `vercel-build` runs `prisma db push` (idempotent; direct connection via `directUrl`, pooled at runtime)
- ✅ **One-time demo-data seed endpoint** `/api/dev/seed?token=…` — triple-guarded (token env var, token match, refuses on non-empty DB); demo data also loadable via `npm run db:seed`
- ✅ Seed endpoint `&mode=amenities` — safe backfill of amenity data onto demo rows for databases seeded before the amenity catalog (never touches real users' selections)
- ✅ REST API under `/api/*` with shared error handling (Zod → 422, auth → 401/403)
- ✅ `.env.example` documenting every variable; all integrations optional and gracefully degrading

---

## Changelog

*Newest first. Every future change adds a row here.*

| Date | Commit | Change |
| --- | --- | --- |
| 2026-08-04 | `178f9a7` | Featured placement is now a paid Stripe feature: promote button on the event manage page → Stripe Checkout → server-verified featured window (`featuredUntil`); free featured toggle removed; daily cron expires lapsed promotions |
| 2026-08-04 | `719e0da` | Save/bookmark button on event cards (marked across all card surfaces); featured/promoted events (host toggle, priority sort, gold badge); recurring events (weekly/fortnightly/monthly series generation); Terms & Privacy pages |
| 2026-08-04 | `fc92cc4` | Password reset (emailed 1-hour single-use link) + account settings page (profile, avatar colour, change/set password); save/bookmark events with a dashboard section; add-to-calendar (Google + .ics) and share buttons on event pages |
| 2026-08-04 | `fbee115` | Reworked `/events` into a map-first explorer: sidebar filters drive a full-height map with a prominent Map/List toggle sharing one filter set (keyword, city, near-me radius, date, type, amenities); removed the old top filter-bar + fixed map layout |
| 2026-08-04 | `4178d95` | Amenity icon strips on event/venue cards; "near me" geolocation on the map explorer (distance radius, you-are-here marker, nearest-first sorting, distance badges) |
| 2026-08-04 | `5617f5c` | Amenity filtering: collapsible chip panel in event search, live chips on the map explorer (events + venues), instant filter on the venues directory; `amenities` param on the events/venues APIs |
| 2026-08-04 | `9721b02` | Demo amenities: all 10 seed events now ship amenity sets; seed endpoint gained `&mode=amenities` to backfill amenities onto existing demo data safely |
| 2026-08-04 | `23fdbf2` | Amenity catalog with icons: venue amenity picker, venue selector in the event form (pulls amenities + location through), per-event amenity add/remove, icon blocks on venue + event pages, amenities in structured data |
| 2026-08-04 | `a28419f` | Image optimization (`next/image`), category + city SEO landing pages, email notifications (confirmations, follower alerts, reminder cron), event reviews & ratings with `AggregateRating`, direct image uploads (Vercel Blob) |
| 2026-08-04 | `bf31f9e` | SEO layer: per-page metadata, Schema.org JSON-LD (Event/Organization/Place/WebSite), dynamic sitemap, robots.txt, favicon, noindex on private pages |
| 2026-08-03 | `a0da6a0` | Guarded one-time demo-data seed endpoint (`/api/dev/seed`) |
| 2026-08-03 | `b9b235c` | Auto-create database tables on Vercel deploy (`vercel-build` + `directUrl`) |
| 2026-08-02 | `ae45503` | Switched SQLite → PostgreSQL, case-insensitive search, Vercel deployment guide; `main` branch created |
| 2026-08-02 | `e452027` | Fixed display font (self-hosted Bebas Neue/Inter via `next/font`), added Google sign-in |
| 2026-08-02 | `8f37530` | Initial full platform: three account types, events + search, interactive map explorer, clubs, venues, registrations, follows, dashboards, seed data |
