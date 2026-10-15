import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Catalogue images are pre-optimised WebP (full size in /catalog, 640px in /thumbs),
    // so we skip runtime optimisation: no per-image quota on any host, instant CDN delivery.
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(catalog|thumbs)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
