import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Compatibilité API_ENDPOINTS.md: Edge Functions /functions/v1/* → /api/*
      { source: "/functions/v1/auth-mfa-enroll", destination: "/api/auth/2fa" },
      { source: "/functions/v1/articles-get", destination: "/api/articles" },
      { source: "/functions/v1/articles-audio", destination: "/api/articles" },
      { source: "/functions/v1/articles-create", destination: "/api/admin/articles" },
      { source: "/functions/v1/articles-publish", destination: "/api/admin/articles" },
      { source: "/functions/v1/articles-like", destination: "/api/comments" },
      { source: "/functions/v1/articles-comment", destination: "/api/comments" },
      { source: "/functions/v1/magazine-preview", destination: "/api/magazines" },
      { source: "/functions/v1/magazine-download", destination: "/api/download" },
      { source: "/functions/v1/cart-add-item", destination: "/api/payment/init" },
      { source: "/functions/v1/cart-get", destination: "/api/orders" },
      { source: "/functions/v1/checkout-create-order", destination: "/api/payment/init" },
      { source: "/functions/v1/webhooks-moneroo", destination: "/api/payment/verify" },
      { source: "/functions/v1/subscription-subscribe", destination: "/api/payment/init" },
      { source: "/functions/v1/donation-create", destination: "/api/payment/init" },
      { source: "/functions/v1/affiliate-generate-link", destination: "/api/affiliate" },
      { source: "/functions/v1/affiliate-dashboard-summary", destination: "/api/affiliate" },
      { source: "/functions/v1/affiliate-request-payout", destination: "/api/affiliate/withdraw" },
      { source: "/functions/v1/search", destination: "/api/search" },
      { source: "/functions/v1/geo-detect", destination: "/api/search" },
      { source: "/functions/v1/:path*", destination: "/api/:path*" },
      // PostgREST compat: /rest/v1/* → /api/*
      { source: "/rest/v1/profiles", destination: "/api/auth/me" },
      { source: "/rest/v1/articles", destination: "/api/articles" },
      { source: "/rest/v1/magazines", destination: "/api/magazines" },
      { source: "/rest/v1/orders", destination: "/api/orders" },
      { source: "/rest/v1/:path*", destination: "/api/:path*" },
    ];
  },
};

export default nextConfig;
