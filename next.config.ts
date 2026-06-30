import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R3F + Rapier game loops behave better without StrictMode double-invoke
  reactStrictMode: false,
  transpilePackages: ["three"],
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
