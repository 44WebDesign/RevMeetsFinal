import { prisma } from "./prisma";

// Records an admin action for the audit log. Never throws into the request
// path — a failed audit insert must not break the action it was recording.
export type AuditInput = {
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: string | null;
};

export async function logAdmin(
  admin: { id: string; email: string },
  input: AuditInput,
): Promise<void> {
  try {
    await prisma.adminAudit.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] log failed:", err);
  }
}
