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
- ✅ **Readability & accessibility pass** — secondary text meets the 4.5:1 contrast threshold, cards carry subtle elevation, a keyboard `:focus-visible` ring, and `prefers-reduced-motion` support
- ✅ **Branded image placeholders** — listings without a photo show an accent-tinted gradient cover (per event type / club / venue) instead of a repeated stock image
- ✅ **Honest homepage stats** — real counts (incl. cities covered), rounded only when genuinely large, and hidden entirely until the site has enough activity to be credible
- ✅ **Real event photo in the homepage hero** — pulls a recent published event's cover (falls back to a curated stock shot), with clearer "chapter" separation between home sections
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
- ✅ **Account settings** (`/account`) — edit display name, bio, avatar colour, **garage** (car make/model/year) and **home location + weekly-digest opt-in**; change password (Google-only accounts can set one to also log in by email); link to your public member profile

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
- ✅ **Social proof on cards** — average star rating + review count, and a prominent "going" tally, surfaced on every event card
- ✅ **Honest urgency cues** — date-proximity badges (Today / Tomorrow / This weekend / In N days) and a "only N left" flag when an event with a real capacity is genuinely filling up; shown on cards and above the register button on the event page (derived from real data, never fabricated)
- ✅ **Save / bookmark events** for later — a bookmark button on every event **card** (and the event page), plus a "Saved for Later" section on the enthusiast dashboard
- ✅ **Recently viewed** — a per-browser strip (localStorage, works for anonymous visitors too) on the homepage and event pages, surfacing events you looked at so it's easy to return to them
- ✅ **Featured / promoted events (paid)** — hosts pay via Stripe Checkout to feature an event (default £9.99 / 30 days); featured events sort first in listings and show a gold "Featured" badge. Promotions auto-expire (daily cron) and can be extended
- ✅ **Recurring events** — create weekly / fortnightly / monthly series (up to 26 dates) in one go; each occurrence is its own event with its own page and registrations
- ✅ **Add to Calendar** (Google Calendar link + Apple/Outlook `.ics` download) and **share** buttons (native share / WhatsApp / X / Facebook / copy link) on event pages
- ✅ **Subscribable calendar feeds (.ics)** — live-updating `webcal://` subscriptions (or one-off download / copy-link) for a club's, a venue's or a city's upcoming events, via `/api/calendar/{club,venue,city,all}/…`; "Subscribe" buttons on club, venue and city pages
- ✅ **Attendee photo wall** — registered attendees upload photos (with captions) to an event page; everyone can view them in a grid with lightbox; uploaders/admins can delete
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
- ✅ **Paid featured placement** — owners can promote their club (Stripe); featured clubs sort first in the directory, get a gold badge, and can appear in the homepage Spotlight
- ✅ **Verified badge** — admin-granted trust mark (a real check, never sold as a label) shown on cards and the club page

## 6. Venues

- ✅ Venues promote themselves as event locations: description, address, capacity, amenities, categories, photo, website, exact map pin
- ✅ **Amenity catalog with icons** (22 options: parking, hot food, alcoholic drinks, kids area, smoking area, EV charging, track access, dyno…) — venues tick what they offer; shown as an icon block on the venue page
- ✅ Venue directory (`/venues`) with search and **instant amenity filtering** (icon chips, URL-shareable)
- ✅ **Follow / unfollow** venues
- ✅ Events held at a venue listed on its profile
- ✅ Venue accounts' events default to their own venue location
- ✅ Owners edit their venue (including click-to-pin location) from the dashboard
- ✅ **Paid featured placement** — owners can promote their venue (Stripe); featured venues sort first in the directory, get a gold badge, and can appear in the homepage Spotlight
- ✅ **Verified badge** — admin-granted trust mark shown on cards and the venue page
- ✅ **Enquiry / contact button** (lead-gen) — signed-in organisers can send an enquiry to the venue owner from the venue page; delivered as an in-app notification + email so the owner can reply directly

## 7. Reviews & Ratings

- ✅ Attendees rate events 1–5 stars with optional comment, once the event has started
- ✅ One review per user per event (editable); only registered attendees can review (spam control)
- ✅ **Club & venue reviews** — any signed-in member can rate a club or venue 1–5 stars (one editable review each, owners excepted); shown with an average on the club/venue page
- ✅ **Average rating on club & venue cards** (★ with review count) across directories and search
- ✅ Reviews + average rating displayed on event, club and venue pages
- ✅ Average rating feeds `AggregateRating` structured data (events, clubs, venues) → ★ stars eligible in Google results

## 8. Notifications

### In-app (bell menu)

- ✅ **Notification bell** in the nav with an unread badge (polls in the background; marks read on open); dropdown lists recent activity with type icons and relative timestamps, deep-linking to the relevant page
- ✅ Triggers: someone **registers** for your event, a **new review** on your event / club / venue, a **new event** from a club you follow, photos added to your event, and a new **enquiry** about your venue
- ✅ `GET /api/notifications` (list + unread count) and mark-read endpoint; creation never blocks the triggering request

### Email

*(Active when `RESEND_API_KEY` is set; skipped gracefully otherwise)*

- ✅ Registration confirmation email on first sign-up to an event
- ✅ New-event alerts emailed to a club's followers on publish (in-app alert fires regardless of email config)
- ✅ Daily pre-event reminder (8am cron via `vercel.json`) to registered attendees, deduplicated per registration
- ✅ **Weekly "events near you" digest** (Monday 9am cron) — each opted-in member gets a short list of upcoming events near their saved location and from clubs/venues they follow; ranked (featured/sponsored first, then followed, then nearest / soonest), rate-limited per user, opt-out in account settings. A **featured event that's also relevant** to the member earns a labelled "Featured" top slot (capped so it never fills the email; irrelevant featured events are never shown)
- ✅ Branded dark email template

## 9. Images

- ✅ **Direct image uploads** to Vercel Blob for any signed-in member (5 MB cap, JPG/PNG/WebP/GIF/AVIF), with URL-paste fallback and live preview — covers listing images, build galleries and event photos
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

- ✅ **Paid featured placement for events, clubs *and* venues** via Stripe Checkout — feature an event from the **create flow** or its **Manage** page, and clubs/venues from their profile page in the dashboard; on payment the item is featured for the configured window (sorts first in its directory, gets a gold badge). Price/duration configurable via env; promotions extend and auto-expire (daily cron, all three types).
- ✅ **Homepage "Spotlight"** — a prominent band that showcases currently-featured events, clubs and venues (round-robin mix), giving every paid placement extra visibility; hidden entirely when nothing is promoted.
- ✅ **Idempotent activation** — applied by both the Stripe **success redirect** and a signature-verified **webhook** (`/api/stripe/webhook`), keyed on the checkout session so it's applied exactly once even if the buyer closes the tab; shared checkout/apply logic across all target types (legacy event-only sessions still supported).
- ✅ **Host promotions view** (`/dashboard/promotions`) — active/expired promotions across events, clubs and venues, purchase history and total spend, backed by a `Promotion` record per payment.
- ✅ **Sponsored digest slot** — a featured event automatically earns a labelled "Featured" spot at the top of the weekly "events near you" email for nearby members (capped, relevance-gated), extending each featured purchase's reach without a separate SKU.
- ✅ **Venue lead-gen** — the venue **enquiry/contact** button turns listings into a channel for booking enquiries (a reason venues value being listed).

## 12. Admin & Moderation

- ✅ **Admin console** (`/admin`, ADMIN role only) with a moderation nav and a platform overview (users, events, clubs, venues, registrations, reviews, open reports, promotion revenue)
- ✅ **User management** — search users, change role, **suspend/unsuspend** (suspended accounts are blocked from email and Google login), or delete (self-protection: can't suspend/demote/delete your own admin account)
- ✅ **Event moderation** — search events, hide (draft) / publish / cancel, unfeature, or delete any event
- ✅ **Listings moderation** (`/admin/listings`) — grant/revoke the **Verified** trust badge on clubs & venues, and override featured placement
- ✅ **Reporting system** — logged-in users can flag events, reviews **and user-uploaded photos** (reason + detail, de-duplicated); admins get a **reports queue** (Open / Resolved / Dismissed) with target previews (including a photo thumbnail) and one-click resolve / dismiss / delete-target
- ✅ Admin link in the nav for admins; demo admin account (`admin@revmeet.test`)
- ✅ **One-time admin bootstrap** — `/api/admin/claim?token=…` (gated by `ADMIN_CLAIM_TOKEN`) promotes the signed-in account to ADMIN and refreshes the session, so the first admin can be created on a live site with no database access

## 13. Dashboards

- ✅ Role-aware dashboard: hosts/venues see event stats (events, registrations, published/drafts) and manage their events; enthusiasts see events they're attending and who they follow
- ✅ **Profile-completion nudge** — an endowed-progress card on the dashboard showing how complete your profile is (bio, garage, home location, build photo), the next step to take, and a dismissible checklist
- ✅ Quick links to edit club/venue profile and view public pages
- ✅ **Organiser analytics** (`/dashboard/analytics`, hosts & venues) — headline stats (events, registrations, saves, event photos, average rating across their events + club/venue), a **registrations-over-time** area chart (last 12 weeks), and **top events** + **registrations-by-type** bar charts; rendered as dependency-free inline-SVG charts

## 14. Deployment & Infrastructure

- ✅ Vercel deployment (production branch `main`) with Neon Postgres
- ✅ **Auto schema sync on deploy** — `vercel-build` runs `prisma db push` (idempotent; direct connection via `directUrl`, pooled at runtime)
- ✅ **One-time demo-data seed endpoint** `/api/dev/seed?token=…` — triple-guarded (token env var, token match, refuses on non-empty DB); demo data also loadable via `npm run db:seed`
- ✅ Seed endpoint `&mode=amenities` — safe backfill of amenity data onto demo rows for databases seeded before the amenity catalog (never touches real users' selections)
- ✅ REST API under `/api/*` with shared error handling (Zod → 422, auth → 401/403)
- ✅ `.env.example` documenting every variable; all integrations optional and gracefully degrading
- ✅ **Automated tests** — Vitest unit suite for pure logic (`npm test`: slugs, distance, amenities, enums, Zod schemas, `.ics` builder, digest ranking) and a Postgres-backed integration suite (`npm run test:integration`)
- ✅ **GitHub Actions CI** (`.github/workflows/ci.yml`) — on every push/PR: unit tests + `tsc` + `next build`, plus a Postgres 16 service job running the integration tests

## 15. Member Profiles & Build Sharing

- ✅ **Public member profiles** (`/members/<id>`) — avatar, name, bio, garage (car make/model/year) and a build photo gallery; links to the member's club/venue; indexed with `Person` structured data
- ✅ **"Garage"** — members add their car (make, model, year) in account settings; surfaced on their profile
- ✅ **Build photo gallery** — members upload photos of their build (file upload or URL, captions, lightbox view); owners/admins can delete
- ✅ Reuses the shared `PhotoGallery` component with the event photo wall

---

## Changelog

*Newest first. Every future change adds a row here.*

| Date | Commit | Change |
| --- | --- | --- |
| 2026-09-03 | `610b091` | Lighter-touch monetisation round: **verified** trust badges for clubs & venues (admin-granted via a new `/admin/listings` page; badge on cards + detail), a **venue enquiry/contact** button (lead-gen — notifies + emails the owner), and a **sponsored slot in the weekly digest** (a relevant featured event earns a labelled top spot, capped and relevance-gated). Adds `verified` to Club/Venue (additive-safe); digest ranking + tests updated |
| 2026-09-03 | `24c2a51` | Featured placement extended to **clubs & venues** (paid promote from their dashboard profile; gold badge + top-of-directory sort; daily expiry cron covers all three types) and a **homepage Spotlight** band showing currently-featured events/clubs/venues (round-robin, hidden when none). Generalised the `Promotion` model + shared checkout/apply logic (idempotent, legacy event sessions still work); integration tests added |
| 2026-09-03 | `f1ed256` | Engagement/UX round 3: dashboard profile-completion nudge (endowed progress — bio / garage / location / build photo, next-step CTA, dismissible checklist) and a "recently viewed" events strip (per-browser localStorage, on the homepage and event pages); adds `lib/profileCompletion.ts` + `lib/recentViews.ts` with unit tests |
| 2026-09-03 | `9ca17db` | Engagement/UX round 2: social proof on event cards (star rating + review count, prominent "going"), honest urgency cues (date-proximity + "only N left" near capacity, on cards and the event page), a real recent event photo in the homepage hero, a properly-styled "View Event" card button (no longer a hover-only ghost), and clearer visual separation between home sections; adds `lib/urgency.ts` with unit tests |
| 2026-09-03 | `dda62a1` | Design/UX quick wins from the design review: lightened secondary text to meet 4.5:1 contrast, larger card titles, card shadows + keyboard focus ring + reduced-motion support, branded gradient image placeholders (no more repeated stock photos), and honest homepage stats (real city count, no fake "340+", hidden when the site is sparse) |
| 2026-08-11 | `1a9fa4f` | Test harness (Vitest unit suite + Postgres-backed integration suite + GitHub Actions CI); subscribable `.ics` calendar feeds for clubs/venues/cities (webcal subscribe buttons); weekly "events near you" digest email (home location + opt-in in account settings, ranked near/followed, Monday cron) |
| 2026-08-11 | `803b7dd` | Organiser analytics dashboard (`/dashboard/analytics`): registrations-over-time area chart, top-events + registrations-by-type bar charts, headline stats — all dependency-free inline SVG; photo moderation — user photos are now reportable (`PHOTO` target) and admins can preview + delete them from the reports queue |
| 2026-08-10 | `7489968` | Fix deploy: drop the new club/venue Review unique constraints (they tripped `prisma db push`'s data-loss guard on the live table) and enforce one-review-per-user-per-club/venue in the API instead — keeps the schema additive-safe so `vercel-build` needs no `--accept-data-loss` |
| 2026-08-10 | `6e46a98` | Build & photo sharing (public member profiles at `/members/[id]` with garage + build gallery, attendee photo wall on events, uploads opened to all members), club & venue reviews (multi-target Review model, ★ ratings on club/venue cards + pages), and in-app notifications (bell menu with unread badge; registration / review / new-event / photo triggers) |
| 2026-08-04 | `a4cf72a` | One-time admin-claim endpoint (`/api/admin/claim`, gated by ADMIN_CLAIM_TOKEN) to bootstrap the first admin on a live site without DB access; refreshes the session so the Admin nav appears immediately |
| 2026-08-04 | `fae7e6b` | Admin/moderation system: /admin console (overview, user management with role change + suspend + delete, event moderation), user reporting of events/reviews with an admin reports queue, account suspension (blocks login), demo admin account |
| 2026-08-04 | `2f19635` | Stripe webhook for featured promotions (signature-verified, shares idempotent apply logic with the success redirect); host promotions view (/dashboard/promotions) with spend history backed by a Promotion record; "feature now" option in the create-event flow (→ checkout after publishing) |
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
