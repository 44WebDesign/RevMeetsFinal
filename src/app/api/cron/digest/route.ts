import { prisma } from "@/lib/prisma";
import { handle, ok, fail } from "@/lib/api";
import { sendEmail, emailShell, eventButton, emailConfigured } from "@/lib/email";
import {
  rankEventsForUser,
  pickNewsletterEvents,
  type DigestCandidate,
  type DigestPick,
} from "@/lib/digest";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { formatDate } from "@/lib/utils";

// Weekly "events near you" digest (see vercel.json crons). Emails each opted-in
// user a short list of upcoming events near them and from clubs/venues they
// follow. Guarded by CRON_SECRET (Vercel sends it as a Bearer token).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HORIZON_DAYS = 14;
const RESEND_GAP_DAYS = 5; // don't email the same person twice within this window
const MAX_USERS = 400;
const MAX_NEWSLETTER = 1000; // anonymous "events near you" subscribers per run

export const GET = handle(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return fail("Unauthorized", 401);
  }
  if (!emailConfigured()) {
    return ok({ sent: 0, skipped: "email not configured (set RESEND_API_KEY)" });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + HORIZON_DAYS * 86_400_000);
  const gapCutoff = new Date(now.getTime() - RESEND_GAP_DAYS * 86_400_000);

  // Upcoming events in the window (the candidate pool for everyone).
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: now, lte: horizon } },
    orderBy: { startsAt: "asc" },
    take: 300,
    select: { id: true, title: true, slug: true, city: true, region: true, lat: true, lng: true, startsAt: true, clubId: true, venueId: true, featured: true, featuredUntil: true },
  });
  const candidates: DigestCandidate[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    city: e.city,
    region: e.region,
    lat: e.lat,
    lng: e.lng,
    startsAt: e.startsAt,
    clubId: e.clubId,
    venueId: e.venueId,
    featured: e.featured && !!e.featuredUntil && e.featuredUntil > now,
  }));

  if (candidates.length === 0) {
    return ok({ sent: 0, considered: 0, note: "no upcoming events in window" });
  }

  // Opted-in, active users who haven't had a digest recently.
  const users = await prisma.user.findMany({
    where: {
      digestOptIn: true,
      suspended: false,
      OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: gapCutoff } }],
    },
    take: MAX_USERS,
    select: { id: true, email: true, name: true, homeLat: true, homeLng: true },
  });
  if (users.length === 0) return ok({ sent: 0, considered: candidates.length });

  const userIds = users.map((u) => u.id);

  // Batch-fetch personalisation signals, then group in memory (avoids N+1).
  const [clubFollows, venueFollows, regs, saves] = await Promise.all([
    prisma.clubFollow.findMany({ where: { userId: { in: userIds } }, select: { userId: true, clubId: true } }),
    prisma.venueFollow.findMany({ where: { userId: { in: userIds } }, select: { userId: true, venueId: true } }),
    prisma.registration.findMany({ where: { userId: { in: userIds } }, select: { userId: true, event: { select: { city: true } } } }),
    prisma.savedEvent.findMany({ where: { userId: { in: userIds } }, select: { userId: true, event: { select: { city: true } } } }),
  ]);

  const group = <T, V>(rows: T[], key: (r: T) => string, val: (r: T) => V) => {
    const m = new Map<string, V[]>();
    for (const r of rows) {
      const k = key(r);
      (m.get(k) ?? m.set(k, []).get(k)!).push(val(r));
    }
    return m;
  };
  const clubsByUser = group(clubFollows, (r) => r.userId, (r) => r.clubId);
  const venuesByUser = group(venueFollows, (r) => r.userId, (r) => r.venueId);
  const citiesByUser = group([...regs, ...saves], (r) => r.userId, (r) => r.event.city);

  let sent = 0;
  const updatedIds: string[] = [];
  for (const u of users) {
    const picks = rankEventsForUser(candidates, {
      homeLat: u.homeLat,
      homeLng: u.homeLng,
      followedClubIds: clubsByUser.get(u.id) ?? [],
      followedVenueIds: venuesByUser.get(u.id) ?? [],
      engagedCities: citiesByUser.get(u.id) ?? [],
    });
    if (picks.length === 0) continue;

    const { sent: didSend } = await sendEmail({
      to: u.email,
      subject: `${picks.length} car event${picks.length === 1 ? "" : "s"} coming up near you`,
      html: emailShell("Events coming up near you 🏁", digestBody(picks)),
    });
    if (didSend) {
      sent++;
      updatedIds.push(u.id);
    }
  }

  if (updatedIds.length) {
    await prisma.user.updateMany({ where: { id: { in: updatedIds } }, data: { lastDigestAt: now } });
  }

  // --- Anonymous "events near you" newsletter subscribers (no account) ---
  // Matched to their free-text area, falling back to soonest UK-wide so the
  // email is never empty. Throttled by the same resend gap.
  const subs = await prisma.newsletterSignup.findMany({
    where: { OR: [{ lastSentAt: null }, { lastSentAt: { lt: gapCutoff } }] },
    take: MAX_NEWSLETTER,
    select: { id: true, email: true, area: true, token: true },
  });

  let newsletterSent = 0;
  const sentSubIds: string[] = [];
  for (const s of subs) {
    const picks = pickNewsletterEvents(candidates, s.area, 6);
    if (picks.length === 0) continue;
    const area = s.area?.trim();
    // Backfill a token for any legacy row created before the column existed,
    // so its unsubscribe link works.
    let token = s.token;
    if (!token) {
      token = crypto.randomUUID();
      await prisma.newsletterSignup.update({ where: { id: s.id }, data: { token } });
    }
    const { sent: didSend } = await sendEmail({
      to: s.email,
      subject: `${picks.length} car event${picks.length === 1 ? "" : "s"} coming up${area ? ` near ${area}` : ""}`,
      html: emailShell("Events coming up near you 🏁", newsletterBody(picks, area ?? null, token)),
    });
    if (didSend) {
      newsletterSent++;
      sentSubIds.push(s.id);
    }
  }
  if (sentSubIds.length) {
    await prisma.newsletterSignup.updateMany({ where: { id: { in: sentSubIds } }, data: { lastSentAt: now } });
  }

  return ok({
    sent,
    consideredUsers: users.length,
    newsletterSent,
    consideredSubscribers: subs.length,
    candidateEvents: candidates.length,
  });
});

function reasonLabel(p: DigestPick): string {
  if (p.reason === "following") return "from someone you follow";
  if (p.reason === "near" && p.distanceKm !== null) return `${Math.round(p.distanceKm)} km away`;
  return `in ${p.city}`;
}

function digestBody(picks: DigestPick[]): string {
  const rows = picks
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #262626">
          ${p.reason === "featured" ? `<span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#FFD700;border:1px solid rgba(255,215,0,.5);border-radius:100px;padding:1px 8px;margin-bottom:4px">★ Featured</span><br/>` : ""}
          <a href="${absoluteUrl(`/events/${p.slug}`)}" style="color:#fff;font-weight:700;text-decoration:none;font-size:15px">${escapeHtml(p.title)}</a>
          <div style="color:#aaa;font-size:13px;margin-top:2px">📅 ${formatDate(p.startsAt)} · 📍 ${escapeHtml(p.city)}${p.reason === "featured" ? "" : ` · ${reasonLabel(p)}`}</div>
        </td>
      </tr>`,
    )
    .join("");
  return `
    <p style="margin:0 0 12px">Here's what's coming up:</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    ${eventButton(absoluteUrl("/events"), "Browse all events")}
    <p style="margin:16px 0 0;color:#777;font-size:12px">You're getting this because you opted into the weekly digest. Turn it off any time in your <a href="${absoluteUrl("/account")}" style="color:#FF5F1F">account settings</a>.</p>`;
}

function newsletterBody(
  picks: DigestCandidate[],
  area: string | null,
  token: string,
): string {
  const intro = area
    ? `Here's what's coming up near ${escapeHtml(area)}:`
    : "Here's what's coming up across the UK:";
  const rows = picks
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #262626">
          ${p.featured ? `<span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#FFD700;border:1px solid rgba(255,215,0,.5);border-radius:100px;padding:1px 8px;margin-bottom:4px">★ Featured</span><br/>` : ""}
          <a href="${absoluteUrl(`/events/${p.slug}`)}" style="color:#fff;font-weight:700;text-decoration:none;font-size:15px">${escapeHtml(p.title)}</a>
          <div style="color:#aaa;font-size:13px;margin-top:2px">📅 ${formatDate(p.startsAt)} · 📍 ${escapeHtml(p.city)}</div>
        </td>
      </tr>`,
    )
    .join("");
  return `
    <p style="margin:0 0 12px">${intro}</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    ${eventButton(absoluteUrl("/events"), "Browse all events")}
    <p style="margin:16px 0 0;color:#777;font-size:12px">You're getting this because you signed up for "events near you" on ${SITE_NAME}. <a href="${absoluteUrl(`/api/newsletter/unsubscribe?token=${token}`)}" style="color:#FF5F1F">Unsubscribe</a>.</p>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
