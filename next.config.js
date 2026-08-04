/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Event/club/venue images are user-supplied URLs (or Vercel Blob uploads),
    // so allow any https host; next/image still resizes and serves WebP/AVIF.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
