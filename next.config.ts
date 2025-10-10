import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
    turbopackFileSystemCacheForDev: true,
  },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/f/:path*",
        destination: "/families/:path*",
        permanent: true,
      },
      {
        source: "/c/:path*",
        destination: "/companions/:path*",
        permanent: true,
      },
      {
        source: "/m/:path*",
        destination: "/monsters/:path*",
        permanent: true,
      },
    ];
  },
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
};

export default nextConfig;
