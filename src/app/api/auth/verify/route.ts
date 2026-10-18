import { prisma } from "@/lib/prisma";
import { verifyEmailVerifyToken } from "@/lib/auth";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

function page(title: string, body: string): Response {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title} · ${SITE_NAME}</title>
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
    <h1>${title}</h1>
    <p>${body}</p>
    <a class="btn" href="${absoluteUrl("/dashboard")}">Go to your dashboard</a>
  </div>
</div></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const result = token ? await verifyEmailVerifyToken(token) : null;
  if (!result) {
    return page("Link invalid or expired", "This confirmation link is invalid or has expired. Sign in and request a new one from the banner at the top of the page.");
  }
  await prisma.user.update({ where: { id: result.userId }, data: { emailVerified: new Date() } });
  return page("Email confirmed ✓", "Thanks — your email address is now verified. You're all set.");
}
