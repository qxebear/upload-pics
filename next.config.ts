import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    contentDispositionType: "inline",
    qualities: [75, 100],
  },
};

export default nextConfig;
