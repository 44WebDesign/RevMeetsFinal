import { after } from "next/server";
import { sendEmail, emailShell, emailConfigured } from "./email";

// Fan out an identical email to many recipients off the request path.
//
// The loop is scheduled via `after()`, so the HTTP response returns immediately
// and the (potentially long) send happens in the background within the same
// serverless invocation. Sends are sequential to stay friendly to Resend's
// rate limits; failures are swallowed per-recipient (logged) so one bad address
// never aborts the batch. No-ops when Resend isn't configured.
//
// Returns the number of recipients queued (not yet sent) so callers can report
// "N emails sending" without blocking.
export function queueBulkEmail(
  recipients: string[],
  subject: string,
  bodyHtml: string,
): number {
  if (!emailConfigured() || recipients.length === 0) return 0;
  const html = emailShell(subject, bodyHtml);
  after(async () => {
    let sent = 0;
    for (const to of recipients) {
      try {
        const res = await sendEmail({ to, subject, html });
        if (res.sent) sent++;
      } catch (err) {
        console.error("[bulkEmail] send failed:", err);
      }
    }
    console.log(`[bulkEmail] "${subject}" — ${sent}/${recipients.length} sent`);
  });
  return recipients.length;
}

// Fan out a per-recipient email (subject/body vary by recipient) off the
// request path — e.g. follower alerts that each embed the recipient's club
// name. Same background/no-throw semantics as queueBulkEmail.
export function queuePerRecipientEmail(
  messages: { to: string; subject: string; html: string }[],
): number {
  if (!emailConfigured() || messages.length === 0) return 0;
  after(async () => {
    let sent = 0;
    for (const m of messages) {
      try {
        const res = await sendEmail(m);
        if (res.sent) sent++;
      } catch (err) {
        console.error("[bulkEmail] per-recipient send failed:", err);
      }
    }
    console.log(`[bulkEmail] per-recipient batch — ${sent}/${messages.length} sent`);
  });
  return messages.length;
}
