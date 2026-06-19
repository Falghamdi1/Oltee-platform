import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ["jspdf"],

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Empty turbopack config silences the webpack/turbopack conflict error.
  // Next.js 16 uses Turbopack by default — the old webpack fallback config
  // (fs: false) is not needed because Turbopack handles this automatically.
  turbopack: {},
};

export default nextConfig;