import { put } from "@vercel/blob";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";

// Image upload for event/club/venue photos. Stores files in Vercel Blob.
// Enable it by adding Blob storage to the Vercel project (Storage → Blob),
// which sets BLOB_READ_WRITE_TOKEN automatically. Without the token the route
// returns 501 and the UI falls back to pasting an image URL.

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export const POST = handle(async (req: Request) => {
  // Any signed-in member can upload — hosts/venues for listing images, and
  // enthusiasts for their build gallery and event photos.
  const user = await requireUser();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return fail("Uploads not configured — add Blob storage in Vercel (Storage → Blob), or paste an image URL instead.", 501);
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("No file provided", 400);
  if (!ALLOWED.includes(file.type)) {
    return fail("Unsupported file type — use JPG, PNG, WebP, GIF or AVIF", 415);
  }
  if (file.size > MAX_BYTES) return fail("File too large (max 5 MB)", 413);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const blob = await put(`images/${user.id}/${Date.now()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });

  return ok({ url: blob.url }, 201);
});
