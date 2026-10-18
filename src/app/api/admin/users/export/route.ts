import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/api";
import { adminUserWhere } from "@/lib/adminFilters";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Admin CSV export of users, honouring the same filters as /admin/users.
export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const where = adminUserWhere({
    q: url.searchParams.get("q") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { _count: { select: { events: true } } },
  });

  const header = ["Name", "Email", "Role", "Status", "Events", "Joined"];
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.role,
    u.suspended ? "Suspended" : "Active",
    u._count.events,
    u.createdAt.toISOString().slice(0, 10),
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="revmeet-users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
