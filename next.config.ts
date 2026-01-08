import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/optional-dep packages are best required at runtime, not bundled.
  serverExternalPackages: ["lmdb", "msgpackr-extract"],
};

export default nextConfig;
