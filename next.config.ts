import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/embed/avatars/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
    ],
  },
  async rewrites() {
    const apiPort = process.env.API_PORT || "8080";
    return [
      {
        source: "/api/:path((?!auth|my/families/|families).+)",
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
