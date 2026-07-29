import type { NextConfig } from "next";

const allowedOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((o) => o.trim())
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedOrigins,
  output: "standalone",
  transpilePackages: ["next-mdx-remote"],
  experimental: {
    useCache: true,
    authInterrupts: true,
    useTypeScriptCli: true,
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
      {
        source: "/reference/5e-conversion",
        destination: "/rules/adventures",
        permanent: true,
      },
      {
        source: "/reference/combat-structure",
        destination: "/rules/initiative",
        permanent: true,
      },
      {
        source: "/reference/cover-hiding",
        destination: "/rules/cover",
        permanent: true,
      },
      {
        source: "/reference/encounter-guidelines",
        destination: "/rules/monster-levels",
        permanent: true,
      },
      {
        source: "/reference/equipment-rules",
        destination: "/rules/equipment-proficiency",
        permanent: true,
      },
      {
        source: "/reference/skill-checks-and-saves",
        destination: "/rules/skill-checks",
        permanent: true,
      },
      {
        source: "/reference/spellcasting",
        destination: "/rules/mana",
        permanent: true,
      },
      {
        source: "/reference/wealth",
        destination: "/rules/gold-currency",
        permanent: true,
      },
      {
        source: "/reference/:slug",
        destination: "/rules/:slug",
        permanent: true,
      },
      {
        source: "/reference",
        destination: "/rules",
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
      {
        protocol: "https",
        hostname: "nimble-nexus.fly.storage.tigris.dev",
        pathname: "/paperforge/**",
      },
    ],
  },
};

export default nextConfig;
