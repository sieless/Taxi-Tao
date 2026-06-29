import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // HSTS only in production — breaks localhost dev without valid cert
  ...(!isDev
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  // NOTE: Content-Security-Policy is set by proxy.ts
  // with per-request nonces for stronger XSS protection.
  // Do NOT set CSP here — it would conflict with the proxy CSP.
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  serverExternalPackages: ["firebase-admin", "qrcode"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  // Turbopack not supported on this Windows platform — using Webpack
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes EXCEPT Firebase auth handler
        source: "/((?!_next/static|_next/image|favicon.ico|public/|__/auth/).*)",
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: "/api/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },
  // Redirect HTTP to HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/(.*)",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http",
          },
        ],
        destination: "https://:host/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://studio-6444216032-ee9f7.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
