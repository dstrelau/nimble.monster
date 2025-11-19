import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
  },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/_next/image",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://www.owlbear.rodeo",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
      {
        source: "/obr/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://www.owlbear.rodeo",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ];
  },
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
    imageSizes: [50, 100, 200, 400],
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
