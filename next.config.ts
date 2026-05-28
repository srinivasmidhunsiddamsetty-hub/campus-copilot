import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the on-screen dev-tools indicator (the floating "N" badge).
  // Build/runtime errors are still surfaced.
  devIndicators: false,
};

export default nextConfig;
