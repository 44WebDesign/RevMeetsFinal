import { prisma } from "./prisma";

// In-app notification helper. Creating a notification never throws into the
// caller's request path — a failed insert must not break registering for an
// event or posting a review, so we swallow errors (logged) here.

export type NotificationInput = {
  userId: string;
  type: string; // e.g. REGISTRATION | REVIEW | NEW_EVENT | REMINDER
  message: string;
  link?: string | null;
};

export async function notify(input: NotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        message: input.message,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notifications] create failed:", err);
  }
}

// Fan out one notification to many recipients (e.g. club followers). Skips the
// excluded id (usually the actor, so people aren't notified about their own
// actions).
export async function notifyMany(
  userIds: string[],
  payload: { type: string; message: string; link?: string | null },
  excludeUserId?: string,
): Promise<void> {
  const recipients = userIds.filter((id) => id !== excludeUserId);
  if (recipients.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        type: payload.type,
        message: payload.message,
        link: payload.link ?? null,
      })),
    });
  } catch (err) {
    console.error("[notifications] createMany failed:", err);
  }
}
