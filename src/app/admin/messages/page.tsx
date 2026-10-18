import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminMessageItem, type AdminMessage } from "@/components/admin/AdminMessageItem";
import { Pagination } from "@/components/admin/Pagination";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER = 25;
type SP = { status?: string; page?: string };

export default async function AdminMessages({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.status === "new" ? { repliedAt: null } : {};

  const [messages, total, newCount] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { repliedAt: null } }),
  ]);

  const rows: AdminMessage[] = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    message: m.message,
    replied: m.repliedAt !== null,
    createdLabel: formatDateTime(m.createdAt),
  }));

  const filterParams: Record<string, string> = sp.status === "new" ? { status: "new" } : {};

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: ".5rem" }}>Messages ({total})</h1>
      <p style={{ color: "var(--mut)", fontSize: ".85rem", marginBottom: "1.25rem" }}>
        Contact-form messages from the public site. Reply by email, mark as handled, or delete.
      </p>

      <div className="admin-filter-bar">
        <Link href="/admin/messages" className={sp.status === "new" ? "btn-ghost" : "btn-or"} style={{ fontSize: ".82rem" }}>
          All
        </Link>
        <Link href="/admin/messages?status=new" className={sp.status === "new" ? "btn-or" : "btn-ghost"} style={{ fontSize: ".82rem" }}>
          New{newCount > 0 ? ` (${newCount})` : ""}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>
          {sp.status === "new" ? "No new messages — you're all caught up." : "No messages yet."}
        </div>
      ) : (
        <div className="card-surface" style={{ overflow: "hidden" }}>
          {/* top border handled per-item; hide the first one */}
          <style>{`.admin-msgs > div:first-child{border-top:none}`}</style>
          <div className="admin-msgs">
            {rows.map((m) => (
              <AdminMessageItem key={m.id} m={m} />
            ))}
          </div>
        </div>
      )}

      <Pagination basePath="/admin/messages" params={filterParams} page={page} total={total} per={PER} />
    </div>
  );
}
