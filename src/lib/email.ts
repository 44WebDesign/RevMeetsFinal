// Minimal email sender. Uses the Resend HTTP API when RESEND_API_KEY is set;
// otherwise logs to the server console and reports {sent:false} so every
// email feature degrades gracefully with zero configuration.
//
// To enable real sending: create a free account at https://resend.com, add
// RESEND_API_KEY (and optionally EMAIL_FROM once you've verified a domain).

import { absoluteUrl, SITE_NAME } from "./site";

const DEFAULT_FROM = "RevMeet <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  if (!emailConfigured()) {
    console.log(`[email:skipped] to=${opts.to} subject="${opts.subject}"`);
    return { sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      console.error(`[email:failed] ${res.status} ${await res.text()}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email:error]", err);
    return { sent: false };
  }
}

// Simple branded wrapper shared by all emails.
export function emailShell(title: string, bodyHtml: string): string {
  return `
  <div style="background:#0b0b0b;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#161616;border:1px solid #262626;border-radius:8px;overflow:hidden">
      <div style="background:#111;padding:18px 24px;border-bottom:2px solid #FF5F1F">
        <span style="font-size:20px;font-weight:800;letter-spacing:2px;color:#FF5F1F">REV<span style="color:#fff">MEET</span></span>
      </div>
      <div style="padding:24px;color:#e8e8e8">
        <h1 style="font-size:18px;margin:0 0 12px;color:#fff">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #262626;color:#777;font-size:12px">
        ${SITE_NAME} — the UK's platform for car events. <a href="${absoluteUrl("/")}" style="color:#FF5F1F">Browse events</a>
      </div>
    </div>
  </div>`;
}

export function eventButton(href: string, label = "View Event"): string {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;background:#FF5F1F;color:#fff;padding:10px 22px;border-radius:4px;font-weight:700;text-decoration:none">${label}</a>`;
}
