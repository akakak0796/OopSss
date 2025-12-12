import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds
    ignoreBuildErrors: true,
  },
     experimental: {
        serverActions: {
            bodySizeLimit: "8mb",
        },
        serverComponentsExternalPackages: ["pino", "thread-stream"],
    },
};

export default nextConfig;
