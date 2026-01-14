import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/optional-dep packages are best required at runtime, not bundled.
  serverExternalPackages: ["lmdb", "msgpackr-extract"],
  images: {
    // We intentionally use a small allowlist for remote images.
    // These are used on public marketing/product pages.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
    // Optimize for Instagram-style square images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 1080],
  },
};

export default nextConfig;
