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
  },
};

export default nextConfig;
