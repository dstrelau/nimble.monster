import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    const apiPort = process.env.API_PORT || "8080";
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${apiPort}/api/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `http://localhost:${apiPort}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
