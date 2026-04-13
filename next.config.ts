import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: 'export' to allow API routes to work
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
