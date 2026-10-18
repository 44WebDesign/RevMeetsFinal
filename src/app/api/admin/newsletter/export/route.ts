import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Admin CSV export of the "events near you" newsletter list.
export const GET = handle(async () => {
  await requireAdmin();
  const subs = await prisma.newsletterSignup.findMany({
    orderBy: { createdAt: "desc" },
    take: 50000,
    select: { email: true, area: true, createdAt: true, lastSentAt: true },
  });

  const header = ["Email", "Area", "Joined", "Last emailed"];
  const rows = subs.map((s) => [
    s.email,
    s.area ?? "",
    s.createdAt.toISOString().slice(0, 10),
    s.lastSentAt ? s.lastSentAt.toISOString().slice(0, 10) : "",
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="revmeet-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
