# RevMeet — instructions for Claude Code

RevMeet is a car-events platform (Next.js 15 App Router + TypeScript, Prisma +
PostgreSQL/Neon, Leaflet maps, JWT cookie auth, Zod validation) deployed on
Vercel. Production branch: `main`. Owner is non-technical — explain steps
plainly and prefer solutions that need no local tooling from them.

## MANDATORY: keep FEATURES.md up to date

`FEATURES.md` is the living feature inventory and changelog for this project.
**Every commit that adds, changes, or removes functionality MUST update it in
the same commit:**

1. Add/adjust the feature bullet(s) in the relevant category section
   (create a new category if nothing fits).
2. Add a row at the TOP of the Changelog table: date (YYYY-MM-DD), the commit's
   short hash (fill in after committing, or use the merge commit), and a
   one-line summary.

Do not skip this for "small" changes — bug fixes and tweaks get a changelog
row too (category updates only when behaviour/features change). Documentation-
only commits may skip the changelog.

## Conventions

- Develop on `main` (also mirror to `claude/car-events-platform-x3635v` —
  push both). Never force-push over unmerged work.
- Enum-like values (roles, event types, statuses) are Strings in Prisma,
  constrained via `src/lib/enums.ts` + Zod — keep all three in sync.
- Schema changes: additive and safe for `prisma db push` — the Vercel build
  runs `vercel-build` (`prisma generate && prisma db push && next build`)
  against production, so a data-losing change will fail the deploy.
- All optional integrations (Google login, Resend email, Vercel Blob uploads,
  seed endpoint) must degrade gracefully when their env vars are absent —
  preserve this property in new features. Document new env vars in
  `.env.example` and the README table.
- Search filters must stay case-insensitive (Prisma `mode: "insensitive"`).
- New public content pages need: metadata (title/description/canonical/OG),
  JSON-LD where a schema.org type fits, and a sitemap entry.
- Verify with `npx tsc --noEmit` and `npm run build` before committing; when a
  change touches DB behaviour, test against a real local Postgres 16
  (binaries in /usr/lib/postgresql/16/bin; must run as the `postgres` user).
- `npm run build` needs no database; only `vercel-build` touches one.
