import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.103', 'localhost'],
  devIndicators: false,
};

export default nextConfig;