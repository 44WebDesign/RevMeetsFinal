# RevMeets — Feature Inventory & Changelog

> **This document is auto-maintained.** Every change made to RevMeets must be
> reflected here in the same commit: tick/add the feature in the relevant
> category below **and** add a row to the [Changelog](#changelog). This rule is
> enforced via `CLAUDE.md`, which every Claude Code session reads automatically.

---

## 1. Platform & Tech Stack

- ✅ **Next.js 15** (App Router, React 18, TypeScript) — one full-stack codebase, no separate API server
- ✅ **PostgreSQL** via **Prisma ORM** (Neon-backed on Vercel; works with any Postgres)
- ✅ **Tailwind CSS** + custom design system ported from the original RevMeets home page design
- ✅ **Zod** validation on every API boundary
- ✅ **Maps** — real **Google Maps** when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set, otherwise a free **Leaflet + CARTO Voyager** light basemap (same Google-Maps-style look, no key or cost); both share the coloured pins, mini-tile popup card and location picker, so the site works with or without a key
- ✅ Self-hosted **Bebas Neue / Inter** fonts via `next/font/local` from committed `.woff2` files (no CDN fetch at build **or** runtime, so the build can't flake on a Google Fonts outage)
- ✅ Self-hosted **Font Awesome** icons (bundled via `@fortawesome/fontawesome-free`, served from our own origin) — no runtime cdnjs fetch, so icons never vanish behind a firewall/blocker or during a CDN outage
- ✅ **Installable PWA** — a web manifest (`app/manifest.ts`) with maskable icons, theme colour and standalone display, so the site can be added to a phone's home screen and opens chromeless like an app
- ✅ Dark automotive theme (orange `#FF5F1F` accent), fully responsive (mobile nav, collapsing grids)
- ✅ **Readability & accessibility pass** — secondary text meets the 4.5:1 contrast threshold, cards carry subtle elevation, a keyboard `:focus-visible` ring, and `prefers-reduced-motion` support
- ✅ **Branded image placeholders** — listings without a photo show an accent-tinted gradient cover (per event type / club / venue) instead of a repeated stock image
- ✅ **Honest homepage stats** — real counts (incl. cities covered), rounded only when genuinely large, and hidden entirely until the site has enough activity to be credible
- ✅ **Real event photo in the homepage hero** — pulls a recent published event's cover (falls back to a curated stock shot), with clearer "chapter" separation between home sections. Hero is ~82vh with a scroll cue so the content below peeks above the fold
- ✅ **Hero map + live events** (`HeroMapOverlay` + `HeroLiveStrip`) — a glowing stylised UK map with a rotating "radar" sweep, pulsing pins and labelled cities layered over the hero photo, framed by **floating real-event mini-cards** that link through to the event. Fully responsive: up to **6 scattered, slightly-rotated cards** on wide desktops (≥1440px), 2 at ≥1024px, and on phones/tablets (<1024px) a **swipeable "Live across the UK" strip** of real events with an Open-map link — so the "car events + map finder" idea is obvious and tappable on every screen (the mobile hero also tightens its spacing so the strip peeks in the fold). Pure inline SVG + CSS (no live map tiles), honours `prefers-reduced-motion`
- ✅ **Homepage flow optimised for discovery** — order is Hero → Stats → **Happening Soon** (soonest events by date) → Spotlight → Featured Events → Map → Newsletter → Clubs → Venues → How It Works → Sign up → Recently viewed, so real listings appear early and the three listing grids are distinctly framed ("Featured Events", "Clubs to Join", "Venues to Discover")
- ✅ **"Happening Soon" strip** — the next few upcoming events in pure date order, for at-a-glance urgency
- ✅ **"Events near you" newsletter signup** — a distinct accent band on the homepage **plus a compact form in the site-wide footer (on every page)**, capturing email (+ optional town/postcode) to a `NewsletterSignup` table via `/api/newsletter`; stored even when Resend isn't configured. These subscribers are now folded into the **weekly digest cron**: each gets events matched to their area text (city/region), falling back to the soonest UK-wide, with a one-click unsubscribe link (`/api/newsletter/unsubscribe?token=…`) and the same resend-gap throttling as registered users
- ✅ **Two homepage header layouts** — the classic photo hero, or a **full-screen interactive map with the search overlaid** (showing live event + venue pins). Set the default with the `HOME_LAYOUT` env var; preview either live via `/?home=map` or `/?home=classic`. The map layout hides the redundant mid-page map section
- ✅ **How It Works page** (`/how-it-works`, linked from the nav) — a full walkthrough for each audience (enthusiasts / organisers & clubs / venues), with illustrative product "screenshots" of the analytics dashboard and admin console, a live interactive-map demo, audience-growth explainers, breadcrumbs, and an **FAQ** accordion; carries `HowTo`, `FAQPage` and `BreadcrumbList` structured data and a sitemap entry
- ✅ Custom favicon / app icon (**checkered-flag mark**, also shown beside the REV·MEETS wordmark in the nav & footer logo via the shared `LogoMark`), **404 page and a branded error boundary** (`error.tsx`, with retry + links home/contact) instead of Next's raw error screen, plus a root **`global-error.tsx`** that catches layout-level crashes and reports them to Sentry
- ✅ **Site analytics** — **Vercel Analytics** (`<Analytics />`) for cookieless, privacy-friendly page-view/visitor stats; zero config, enabled from the Vercel dashboard, no-ops off Vercel
- ✅ **Error monitoring** — **Sentry** (`@sentry/nextjs`) for client, server and edge, wired through `instrumentation.ts` + an `onRequestError` hook. Entirely **opt-in and DSN-gated**: with no `NEXT_PUBLIC_SENTRY_DSN` the SDK and its build plugin stay completely dormant (the build is byte-for-byte a Sentry-free project), so it can never flake the deploy. Source-map upload activates only when an auth token is supplied
- ✅ **Contact page** (`/contact`) — a form that stores every message (`ContactMessage`) and emails it to `SUPPORT_EMAIL` (or all admins) when Resend is configured; honeypot + rate-limited; linked from the footer, Privacy and Terms
- ✅ **Admin message inbox** (`/admin/messages`) — read contact-form messages, **reply by email** (logs to the audit trail), mark handled / new, or delete; New/All filter + pagination; the overview shows a "new messages" banner + stat
- ✅ **Abuse protection** — best-effort per-IP **rate limiting** on login, register, forgot-password, newsletter, contact and venue enquiries, plus **honeypot** fields on the register, newsletter and contact forms

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
- ✅ **Self-service account deletion** (GDPR right to erasure) — a "Danger zone" in account settings deletes your account and all your content (cascade), with a type-to-confirm step; also linked from the Privacy Policy
- ✅ **Email verification (soft)** — on sign-up a combined **welcome + "confirm your email"** message is sent (7-day signed link → `/api/auth/verify`). Unverified logged-in users see a dismissable top banner with a **one-click resend** (`/api/auth/resend-verification`, rate-limited 3/15 min). Verification is a nudge, never a gate — no action is blocked — so existing and demo accounts are never locked out. **Google sign-ins are trusted as verified automatically.** Stored in `User.emailVerified` (nullable `DateTime`); degrades gracefully when Resend isn't configured. Account settings also shows a **verify-status row** (verified ✓ / not confirmed, with a one-click resend) so the control is always findable

## 3. Events

- ✅ Create / edit / delete events (hosts & venues only; ownership enforced server-side)
- ✅ Nine event types: Car Show, Track Day, Night Cruise, Drift Event, Stance Meet, JDM Meet, Classic Cars, Supercar Meet, Meet
- ✅ Event statuses: Published / Draft (hidden) / Cancelled
- ✅ Event fields: title, description, type, start/end time, city, region, address, price info, capacity, cover image, exact map location
- ✅ **Click-to-pin location picker** (draggable marker) in the event form
- ✅ **Venue selector** in the event form — linking a venue pulls through its amenities and drops the pin at its location
- ✅ **Per-event amenities with icons** ("What's There" block on the event page): defaults from the selected venue, individually add/removable per event; included in the event's structured data
- ✅ **`/events` is a map-first explorer** — a **horizontal filter/search bar** across the top drives a full-height interactive map, with a prominent **Map / List** toggle to switch to the card grid; both views share one filter set. In map view the left column is a **live "events in view" list** that re-filters as you pan/zoom the map (`MapView` reports its viewport bounds via `onBoundsChange`)
- ✅ Explorer filters: keyword, city, near-me (geolocation + distance radius), date range, event type, amenities — all applied live client-side; deep-links (`?type=`, `?city=`, `?amenities=`) seed the initial state
- ✅ **Upcoming by default** — the explorer shows upcoming events only (soonest/featured first), with an **"Include past events"** toggle; a recent window of past events is pre-loaded so the toggle is instant
- ✅ **Sort control** (Soonest · Nearest — when located · Recently added · Featured) and **quick-date chips** (This weekend / This week / This month) that pre-fill the date range
- ✅ **Always-visible result count + removable active-filter chips** (keyword, city, dates, type, each amenity, near-me, include-past) on both views; on mobile the filter fields collapse behind a **Filters** button while the count, sort and view toggle stay put
- ✅ **Amenity filtering** in event search (collapsible icon-chip panel; matches events offering *all* selected amenities, including those inherited from a venue)
- ✅ Amenity icon strip on event cards (and venue cards) across list, search and profile views
- ✅ Event detail pages: hero image, description, location map, organiser/club/venue links, price panel, **breadcrumbs** (with `BreadcrumbList` JSON-LD), and a **"More … events"** related strip (same type, upcoming) for onward discovery
- ✅ **Finished-event state** — once an event's end (or start) has passed, its page shows a "Finished" badge and a "this event has finished" notice in place of the register/save/calendar actions and urgency cues; reviews and the photo wall stay open
- ✅ **Register to attend** (one tap), cancel registration, live attendee counts
- ✅ **Social proof on cards** — average star rating + review count, and a prominent "going" tally, surfaced on every event card
- ✅ **Honest urgency cues** — date-proximity badges (Today / Tomorrow / This weekend / In N days) and a "only N left" flag when an event with a real capacity is genuinely filling up; shown on cards and above the register button on the event page (derived from real data, never fabricated)
- ✅ **Save / bookmark events** for later — a bookmark button on every event **card** (and the event page), plus a "Saved for Later" section on the enthusiast dashboard
- ✅ **Recently viewed** — a per-browser strip (localStorage, works for anonymous visitors too) on the homepage and event pages, surfacing events you looked at so it's easy to return to them
- ✅ **Featured / promoted events (paid)** — hosts pay via Stripe Checkout to feature an event (default £9.99 / 30 days); featured events sort first in listings and show a gold "Featured" badge. Promotions auto-expire (daily cron) and can be extended
- ✅ **Recurring events** — create weekly / fortnightly / monthly series (up to 26 dates) in one go; each occurrence is its own event with its own page and registrations
- ✅ **Add to Calendar** (Google Calendar link + Apple/Outlook `.ics` download) and **share** buttons (native share / WhatsApp / X / Facebook / copy link) on event, **club and venue** pages
- ✅ **Subscribable calendar feeds (.ics)** — live-updating `webcal://` subscriptions (or one-off download / copy-link) for a club's, a venue's or a city's upcoming events, via `/api/calendar/{club,venue,city,all}/…`; "Subscribe" buttons on club, venue and city pages
- ✅ **Attendee photo wall** — registered attendees upload photos (with captions) to an event page; everyone can view them in a grid with lightbox; uploaders/admins can delete
- ✅ Capacity limits — event shows "full" and blocks registration when reached
- ✅ Auto-generated unique URL slugs

## 4. Interactive Map (core discovery feature)

- ✅ Full-page **map explorer** (`/map`): every **upcoming** event + venue, live keyword filter, per-type toggles, event/venue layer toggles. Adds a **Sort** control (soonest / nearest / A–Z), **quick-date chips** (this weekend / week / month), an **Include past events** toggle (off by default), always-visible **removable active-filter chips**, and a **mobile filter collapse** (map shown first on mobile)
- ✅ Map explorer **results list is viewport-synced** — it shows what's inside the current map view and updates as you pan/zoom (`onBoundsChange`), lives in its own scroll area beneath the filters, and shows "N in view · first 40" when capped. Rows carry a **thumbnail + type pill**, a distance badge when located, **click-to-focus** the map on a pin, and an arrow to open the listing. A compact **colour legend** sits under the map
- ✅ **Amenity filtering on the map** — icon chips filter both event and venue pins live
- ✅ **"Near me" geolocation** — one-tap browser location with a distance radius (5–100 km or any), a "you are here" marker, nearest-first results and per-result distance badges
- ✅ Colour-coded pins by event type (matching the design's legend), venue pins in cyan
- ✅ **Mini-tile map popups** — clicking a pin opens a compact version of the list-view card (cover image or branded gradient, type pill, title, date/city, accent-matched "View" button)
- ✅ **Homepage map section** (`HomeMapExplorer`) — a full-width, chrome-free interactive map with a collapsible **floating filter panel** on the left (keyword, city, near-me + radius, dates, type, amenities) that live-filters the pins, mirroring the `/events` controls
- ✅ Embedded maps on: home page, events list (fits to results), event detail, venue detail
- ✅ Scroll-friendly behaviour (wheel zoom activates on click)

## 5. Clubs

- ✅ Public club profiles: description, location, categories, cover image, website, follower count
- ✅ Club directory (`/clubs`) with search
- ✅ **Follow / unfollow** clubs (one tap, live counts)
- ✅ Club's **upcoming** events listed on its profile (past events excluded), with breadcrumbs + `BreadcrumbList` JSON-LD
- ✅ Owners edit their club from the dashboard
- ✅ **Paid featured placement** — owners can promote their club (Stripe); featured clubs sort first in the directory, get a gold badge, and can appear in the homepage Spotlight
- ✅ **Verified badge** — admin-granted trust mark (a real check, never sold as a label) shown on cards and the club page

## 6. Venues

- ✅ Venues promote themselves as event locations: description, address, capacity, amenities, categories, photo, website, exact map pin
- ✅ **Amenity catalog with icons** (22 options: parking, hot food, alcoholic drinks, kids area, smoking area, EV charging, track access, dyno…) — venues tick what they offer; shown as an icon block on the venue page
- ✅ Venue directory (`/venues`) with search and **instant amenity filtering** (icon chips, URL-shareable)
- ✅ **Follow / unfollow** venues
- ✅ **Upcoming** events held at a venue listed on its profile (past events excluded), with breadcrumbs + `BreadcrumbList` JSON-LD
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
- ✅ **Weekly "events near you" digest** (Monday 9am cron) — each opted-in member gets a short list of upcoming events near their saved location and from clubs/venues they follow; ranked (featured/sponsored first, then followed, then nearest / soonest), rate-limited per user, opt-out in account settings. A **featured event that's also relevant** to the member earns a labelled "Featured" top slot (capped so it never fills the email; irrelevant featured events are never shown). The same cron also emails **anonymous homepage newsletter subscribers** — events matched to their area text (city/region), falling back to soonest UK-wide, each with a tokenised one-click unsubscribe link and the same resend-gap throttling
- ✅ Branded dark email template
- ✅ **Bulk emails sent in the background** — follower alerts, admin announcements (up to 5,000 recipients) and admin new-signup/new-event alerts now fan out via Next.js `after()` (shared `src/lib/bulkEmail.ts`), so the triggering request (create event, sign up, send announcement) returns immediately instead of blocking on the send loop. Sends stay sequential (Resend-friendly) and never throw into the request; the announce UI reports "N emails sending in the background"

## 9. Images

- ✅ **Direct image uploads** to Vercel Blob for any signed-in member (5 MB cap, JPG/PNG/WebP/GIF/AVIF), with URL-paste fallback and live preview — covers listing images, build galleries and event photos
- ✅ **`next/image` optimization** everywhere: responsive resizing, WebP/AVIF, lazy loading, `priority` on detail-page heroes (Core Web Vitals)

## 10. SEO & Discoverability

- ✅ Per-page metadata on every event/club/venue: unique titles, descriptions, canonical URLs, Open Graph + Twitter cards
- ✅ **Dynamic social share images** — a generated, branded 1200×630 card (`ImageResponse`) for every event/club/venue and the homepage (`opengraph-image.tsx` + shared `src/lib/ogCard.tsx`): type/kind pill, title, date·city and the RevMeets wordmark on the type's accent colour, so links shared to WhatsApp/Facebook/iMessage/X always get a rich preview — even listings with no uploaded photo (real cover photos are still used when present)
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

- ✅ **Admin console** (`/admin`, ADMIN role only) with a moderation nav and a platform overview — the stat tiles (users, events, clubs, venues, registrations, reviews, open reports, promotion revenue, newsletter) are **clickable, deep-linking into the filtered lists** (e.g. drafts → events filtered to Draft, suspended → users filtered to suspended)
- ✅ **User management** — search + **filter by role and status**, **pagination**, change role, **suspend/unsuspend** (suspended accounts are blocked from email and Google login), or delete (self-protection: can't suspend/demote/delete your own admin account); rows show an admin badge and quick links to the user's club/venue; **bulk select** to suspend/unsuspend/delete many at once; **CSV export**
- ✅ **Event moderation** — search + **filter by type, status, date (upcoming/past) and featured**, **pagination**, hide (draft) / publish / cancel, unfeature, or delete any event (past events flagged); **bulk select** to publish/hide/cancel/unfeature/delete many at once
- ✅ **Audit log** (`/admin/audit`) — every admin action (role/suspend/delete, event & listing moderation, report actions, deletions, announcements, bulk ops) is recorded with who/what/when
- ✅ **Announcements** (`/admin/announce`) — broadcast a subject + message to a segment (all members / enthusiasts / organisers / venues / admins / newsletter subscribers); account holders get an in-app notification and everyone is emailed when Resend is configured
- ✅ **Admin alerts** — admins get an in-app notification (and email when configured) on every **new signup** and **new event**
- ✅ **Listings moderation** (`/admin/listings`) — **search (name/owner email) + filter by kind, verification and featured**, grant/revoke the **Verified** trust badge on clubs & venues, and override featured placement
- ✅ **Reporting system** — logged-in users can flag events, reviews **and user-uploaded photos** (reason + detail, de-duplicated); admins get a **reports queue** (Open / Resolved / Dismissed) with target previews (including a photo thumbnail) and one-click resolve / dismiss / delete-target
- ✅ **Newsletter admin** (`/admin/newsletter`) — subscriber counts (total, how many gave an area, how many have been emailed, new this week) plus the recent subscriber list (email, area, joined, last emailed), **exportable to CSV**; the overview also carries a Newsletter stat with weekly growth
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
- ✅ **One-time demo-data seed endpoint** `/api/dev/seed?token=…` — triple-guarded (token env var, token match, refuses the full seed on a non-empty DB); demo data also loadable via `npm run db:seed`. Ships a full demo dataset: **9 clubs, 6 venues and 30 events** across 27 UK cities (6 pre-featured)
- ✅ **Additive seed** `/api/dev/seed?token=…&mode=add` — find-or-create (by demo email/slug) that inserts only the demo rows missing from the database without wiping or overwriting anything, so it's safe on a live/populated DB and idempotent (re-runnable). Use it to top up newly-introduced demo listings
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
| 2026-10-24 | `_____` | **Hero cards + mobile date fix:** the hero's floating event cards now number **up to 6** (was 4) and are **scattered at varied heights with slight rotations** (via a positioned wrapper + rotated card so the float and rotation transforms don't fight), fed by a larger upcoming-events fetch (8); 2 still show at ≥1024px, all 6 at ≥1440px. Also fixed the mobile **Date From** field overflowing its card — native `input[type=date]` on iOS carries an intrinsic min-width, so small screens now strip its appearance and let it shrink. Verified at 390 / 1280 / 1440px |
| 2026-10-24 | `41ac50d` | **Header logo → white version:** pointed the nav logo at the white-on-transparent variant (`public/logos/logo-option-1-white.png`) so the "REV" and R read clearly on the near-black header (the navy version blended in). Header only; footer unchanged |
| 2026-10-23 | `ef6a320` | **Header logo trial:** swapped the nav (header only) logo for a custom image (`public/logos/logo-option-1.png` — R + speedometer mark with the REVMEETS wordmark). Footer and all other logos still use the `LogoMark` + wordmark while the brand is being decided |
| 2026-10-21 | `8431e5f` | **Brand mark added to the logo:** the nav and footer logo now pair the checkered-flag icon (same art as the favicon/app icon, new `LogoMark` component) with the REV·MEETS wordmark, vertically aligned (`.logo` is now an inline-flex row). Verified with live screenshots at nav + footer sizes |
| 2026-10-21 | `ec6becf` | **Renamed the product RevMeet → RevMeets** (domain `revmeets.co.uk`): updated `SITE_NAME`, every page title/description, the REV·MEETS wordmark (nav, footer, emails, OG cards, verify/unsubscribe pages), ICS `PRODID`, legal pages, README and `.env.example` (incl. the `NEXT_PUBLIC_SITE_URL` example). Left internal identifiers untouched — the `revmeet_` cookie/storage keys (renaming would log everyone out), the `@revmeet.test` demo-fixture emails (reserved test TLD, tied to existing seed/backfill matchers) and the npm package name. Verified with tsc + build + tests and live screenshots (wordmark, OG card) |
| 2026-10-19 | `6e6033c` | **Hero rework — car events + map finder on every screen:** made the stylised UK map far more visible (brighter outline, orange glow, a rotating radar sweep, labelled city pins), turned the floating event cards into **real tappable links** and grew them from 2 → **4 corner cards** on wide desktops (2 at ≥1024px), and added a swipeable **"Live across the UK" strip** (`HeroLiveStrip`) of real events + Open-map link for phones/tablets (<1024px), where the floating cards don't fit. Tightened the mobile hero (responsive padding, one-line subhead) so the strip peeks in the fold. Verified across 390 / 900 / 1200 / 1440px with live screenshots |
| 2026-10-19 | `6f46698` | **Pre-launch polish set:** self-hosted **Font Awesome** (bundled, no cdnjs — icons can't vanish behind a blocker/outage); **dynamic OG share images** for events/clubs/venues + homepage (`ImageResponse`, branded card even for photo-less listings); **installable PWA** (`manifest.ts` + maskable icons + theme colour); **share buttons on club & venue pages**; **create/edit event form grouped into sections** (Basics · When & where · Amenities · Tickets & media · Location); **email-verify status row** in account settings; and a **privacy-policy update** naming analytics (Vercel), error monitoring (Sentry), maps, payments and image hosting as processors. Verified via tsc + build and live screenshots (OG cards, icons rendering, manifest serving) |
| 2026-10-18 | `01a8e14` | **Bulk emails off the request path:** follower alerts (`/api/events`), admin announcements (`/api/admin/announce`) and admin new-signup/new-event alerts (`/api/auth/register`, `notifyAdmins`) now fan out via Next.js `after()` through a new `src/lib/bulkEmail.ts` helper, so the triggering request returns immediately instead of waiting on the send loop. In-app notifications still fire synchronously. Announce response/UI now report emails as "sending in the background" (`emailQueued`) |
| 2026-10-18 | `119c3eb` | **Analytics + error monitoring:** added **Vercel Analytics** (`<Analytics />`, cookieless, zero-config) and **Sentry** (`@sentry/nextjs`) for client/server/edge via `instrumentation.ts` + `onRequestError` + a root `global-error.tsx`. Sentry is fully DSN-gated — with no `NEXT_PUBLIC_SENTRY_DSN` the SDK and build plugin stay dormant, so the default build is unchanged. Verified both the no-DSN and with-DSN build paths; documented the new env vars in `.env.example` + README. Added `.npmrc` (`legacy-peer-deps`) so `npm ci` resolves `@vercel/analytics`'s optional peers consistently |
| 2026-10-18 | `9eabbfd` | **Email verification (soft):** sign-up now sends a combined welcome + confirm-email link (7-day signed token → `/api/auth/verify`); unverified logged-in users get a dismissable banner with one-click resend (`/api/auth/resend-verification`, rate-limited); Google logins auto-verified. Never gates any action. Added nullable `User.emailVerified` (additive). Verified the production upgrade path (add column to a populated table, no data loss) + verify write against local Postgres 16 |
| 2026-10-18 | `e98abc5` | **Admin message inbox** (`/admin/messages`) — read contact-form submissions, reply by email (`/api/admin/messages/[id]`, audit-logged), mark handled/new, delete; New/All filter + pagination; overview gets a new-messages banner + stat. Added `repliedAt` to `ContactMessage` (additive). Verified the upgrade path + handled toggle against local Postgres 16 |
| 2026-10-18 | `daf81a3` | **Pre-launch hardening:** branded error boundary (`error.tsx`); a **Contact** page + `/api/contact` (stores `ContactMessage`, emails `SUPPORT_EMAIL`/admins, honeypot, rate-limited; linked from footer/Privacy/Terms); **self-service account deletion** (`/api/account` DELETE, type-to-confirm "Danger zone", GDPR erasure with cascade); and best-effort **per-IP rate limiting** + **honeypots** on login/register/forgot/newsletter/contact/enquiry. Verified against local Postgres 16 (additive `db push`, contact write, cascade delete) |
| 2026-10-18 | `6d08466` | **Admin power-ups:** clickable overview stat tiles (deep-link to filtered lists); **pagination** on users & events; **bulk actions** (users: suspend/unsuspend/delete; events: publish/hide/cancel/unfeature/delete); an **audit log** (`/admin/audit`, new `AdminAudit` model) recording every admin action; an **announcement** broadcaster (`/admin/announce` + `/api/admin/announce`) to member segments / newsletter (in-app + email); and **admin alerts** on new signups & events (`notifyAdmins`). Verified against local Postgres 16 (additive `db push`, audit write, admin-notify, bulk update) |
| 2026-10-18 | `3b4a8b7` | **Admin filters + CSV export:** added filter bars to the admin **Users** (role, status), **Events** (type, status, upcoming/past, featured) and **Listings** (kind, verified, featured + name/owner-email search) pages, each with result counts and a clear button (shared `adminFilters` where-builders); user rows now show an admin badge + club/venue links; added **CSV export** of users and newsletter subscribers (admin-guarded, honouring the user filters). Verified against local Postgres 16 |
| 2026-10-16 | `6119a5e` | **Site-wide newsletter + How It Works pass:** added a **compact newsletter signup to the footer** (so "events near you" capture is on every page; `NewsletterSignup` gains a `compact` variant), and gave **`/how-it-works`** breadcrumbs (+ `BreadcrumbList` JSON-LD) and an **FAQ accordion** (+ `FAQPage` JSON-LD) |
| 2026-10-16 | `6754e64` | **CI build fix:** switched fonts from `next/font/google` (fetches Bebas Neue + Inter from Google at build time) to `next/font/local` with committed `.woff2` files, removing the build-time network dependency that transiently failed CI (`next/font` TypeError). No visual change |
| 2026-10-16 | `547e20c` | **Detail pages review pass:** club & venue profiles now list **upcoming events only** (past no longer counted as "Upcoming"); the **event page gains a finished-event state** (badge + notice replacing register/urgency once it's over), a **"More … events"** related strip, and all three detail pages get **breadcrumbs + `BreadcrumbList` JSON-LD** (new `Breadcrumbs` component). Verified against local Postgres 16 |
| 2026-10-16 | `9d914ba` | **Map page review pass 2:** the `/map` results list is now **viewport-synced** (shows what's on screen, updates on pan/zoom) in its **own scroll area** beneath the filters, with "N in view · first 40", **richer rows** (thumbnail + type pill + distance), **click-to-focus** the map and an open-arrow; added a **colour legend** under the map, **map-first on mobile**, and a slimmer page header |
| 2026-10-16 | `06b9119` | **Map page review pass** (same treatment as `/events`): `/map` now shows **upcoming events by default** (with an Include-past toggle), a **Sort** control (soonest / nearest / A–Z), **quick-date chips**, always-visible **active-filter chips**, and a **mobile filter collapse**. `getEventMapPoints` is upcoming-only by default (also de-clutters the homepage map hero) with an `includePast` option; `MapPoint` gains `startsAt`/`isPast`. Verified against local Postgres 16 |
| 2026-10-16 | `7f62907` | **Events page review pass:** the explorer now shows **upcoming events only by default** (fixes past events appearing, and leading, in the list/map) with an **Include past events** toggle; added a **Sort** control (soonest / nearest / recently added / featured), **quick-date chips** (this weekend / week / month), an always-visible **result count + removable active-filter chips**, a **mobile Filters collapse**, and a "going" count on the map's in-view list. `getExplorerEvents` now fetches upcoming-first + a bounded recent-past set and exposes `isPast`/`createdAt`. Verified against local Postgres 16 |
| 2026-10-16 | `d51c739` | Homepage hero now carries a **stylised UK map + pulsing event-pin overlay** (`HeroMapOverlay`) over the photo, with two floating real-event mini-cards on wide screens — conveying "events across the UK" at a glance. Pure inline SVG/CSS (no map tiles), reduced-motion aware |
| 2026-10-16 | `40b416f` | Added a **newsletter admin view** — a Newsletter stat on the admin overview (total + new-this-week) and a dedicated `/admin/newsletter` page (subscriber counts: total / with area / emailed / new this week, plus the recent subscriber list) |
| 2026-10-16 | `7187a5c` | **Hooked the newsletter list into the weekly digest:** the digest cron now also emails anonymous homepage subscribers (`NewsletterSignup`), matching events to their free-text area (city/region) via a new pure `pickNewsletterEvents` helper (unit-tested), falling back to soonest UK-wide. Added tokenised one-click unsubscribe (`/api/newsletter/unsubscribe`), a `lastSentAt` resend-gap, and a legacy-token backfill. `token` is intentionally non-unique (cuid) to keep the schema `db push`-safe on the live table — verified the production upgrade path (existing table + row) against local Postgres 16 |
| 2026-10-16 | `6b46931` | **Homepage redesign pass:** reordered sections so real listings surface early (Hero → Stats → Happening Soon → Spotlight → Featured Events → Map → Newsletter → Clubs → Venues → How It Works → Sign up → Recently viewed); added a **"Happening Soon"** date-ordered events strip (`getUpcomingSoon`); added an **"events near you" newsletter signup** band (`NewsletterSignup` component + `/api/newsletter` route + `NewsletterSignup` model, graceful without Resend); renamed the three listing grids to vary the framing ("Featured Events" / "Clubs to Join" / "Venues to Discover"); shortened the hero to ~82vh with a scroll cue and tightened section background alternation. Verified schema `db push` + queries against local Postgres 16 |
| 2026-10-11 | `de3072d` | Added an **additive seed mode** (`/api/dev/seed?token=…&mode=add`): find-or-create by demo email/slug that inserts only the demo rows missing from the DB, never wiping or overwriting — safe on a populated/live database and idempotent. Lets the tripled demo data be topped up without an empty DB. Verified against local Postgres 16 (adds the 4 venues + 20 events, keeps real rows, zero duplicates, no-op on re-run) |
| 2026-10-11 | `df8bf15` | **Tripled the demo dataset** — 3→9 clubs, 2→6 venues, 10→30 events spread across 27 UK cities and all event types (6 pre-featured). Verified the seed end-to-end against a local Postgres 16 |
| 2026-10-11 | `b9d4e05` | Reworked the **`/events` map view**: filters/search moved from the left sidebar to a **horizontal bar across the top**, and the left column is now a **live list of the events currently visible on the map** that updates as you pan/zoom. Added an `onBoundsChange` viewport-bounds callback to `MapView` (Leaflet `moveend` + Google `idle`); list view keeps the card grid |
| 2026-10-11 | `c8ffa29` | Homepage polish: moved the **"Recently viewed"** strip to the foot of the page; fixed the **From/To date fields** in the home map's floating filter panel so they size evenly and fit inside the panel (`min-width:0` grid cells, trimmed input width) |
| 2026-10-11 | `e251cb4` | Homepage map is now **just the map** — removed the heading, subline and "Open Full Map" button above it — with a **floating filter panel** overlaid on the left (`HomeMapExplorer`): keyword, city, "use my location" + radius, date range, event-type pills and amenities, live-filtering the pins (same controls as the `/events` page). Panel is collapsible and goes full-width on mobile |
| 2026-10-11 | `7cd6a64` | Homepage tweaks: moved the **"Events near you" map** to sit directly under the stats bar and made it **full-width** (edge-to-edge, bare container); added a **cover image** to each card in the "Recently viewed" strip (real event photo or the branded gradient fallback), matching the list-view tile look |
| 2026-10-10 | `1dce1b3` | Added real **Google Maps** across the site: when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set every map (`MapView`, `MapHero`, location picker) renders as genuine Google Maps via `@googlemaps/js-api-loader`; with no key it falls back to the existing light Leaflet/Voyager basemap. Shared mini-tile popup extracted to `src/lib/mapTile.ts` (works in both Leaflet popups and Google InfoWindows); added InfoWindow dark-chrome CSS. Degrades gracefully, no key required |
| 2026-10-10 | `00f18ab` | Switched the map basemap from the dark CARTO style to the light **Voyager** street style (Google-Maps-like colours: white/yellow roads, blue water, green parks, labels) across every map (`MapView` + the location picker); still free, same CDN, no API key. Map container loads on a matching light background |
| 2026-09-19 | `6fabc34` | Alternative homepage header layout: a **full-screen interactive map with the search overlaid** (live event + venue pins, draggable behind the overlay). Chosen via the `HOME_LAYOUT` env var, with `/?home=map` / `/?home=classic` live preview; adds a `MapHero` component + a `bare` full-bleed option on `MapView`, and hides the mid-page map section in map mode |
| 2026-09-05 | `40461af` | Dedicated **How It Works** page (`/how-it-works`, nav now links to it) — per-audience walkthrough with illustrative dashboard/admin "screenshots", a live map demo and audience-growth explainers (`HowTo` JSON-LD + sitemap). Redesigned **map pin popups** into compact list-style tiles (cover/gradient + type pill + title + meta + accent button); map points now carry an image |
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
