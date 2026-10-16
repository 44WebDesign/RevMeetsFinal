import { prisma } from "@/lib/prisma";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

// One-click unsubscribe for anonymous "events near you" subscribers, linked
// from the digest email footer. Matches by the random per-subscriber token and
// removes the row. Always returns a friendly page (even for an unknown/already-
// removed token) so the link never looks broken.
export const dynamic = "force-dynamic";

function page(message: string): Response {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Unsubscribed · ${SITE_NAME}</title>
<style>
  body{margin:0;background:#0b0b0b;color:#e8e8e8;font-family:Arial,Helvetica,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
  .card{max-width:460px;width:100%;background:#161616;border:1px solid #262626;border-radius:12px;overflow:hidden;text-align:center}
  .bar{background:#111;padding:16px 24px;border-bottom:2px solid #FF5F1F}
  .bar span{font-size:20px;font-weight:800;letter-spacing:2px;color:#FF5F1F}
  .bar span b{color:#fff;font-weight:800}
  .body{padding:28px 24px}
  h1{font-size:18px;color:#fff;margin:0 0 10px}
  p{color:#aaa;font-size:14px;line-height:1.6;margin:0 0 18px}
  a.btn{display:inline-block;background:#FF5F1F;color:#fff;padding:10px 22px;border-radius:6px;font-weight:700;text-decoration:none}
</style></head>
<body><div class="card">
  <div class="bar"><span>REV<b>MEET</b></span></div>
  <div class="body">
    <h1>${message}</h1>
    <p>You won't receive any more "events near you" emails. Changed your mind? You can re-subscribe any time from the homepage.</p>
    <a class="btn" href="${absoluteUrl("/")}">Back to ${SITE_NAME}</a>
  </div>
</div></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    // deleteMany: no-op (not an error) if the token is unknown or already gone.
    await prisma.newsletterSignup.deleteMany({ where: { token } });
  }
  return page("You've been unsubscribed");
}
