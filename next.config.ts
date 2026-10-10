import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://download.agora.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://flagcdn.com https://*.flagcdn.com https://images.unsplash.com https://*.supabase.co https://*.r2.dev https://pub-df336181dd964534a4866a10762a3327.r2.dev https://*.cloudflarestorage.com https://*.googleusercontent.com https://lh3.googleusercontent.com https://i.ytimg.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' blob: data: https://api.open-meteo.com https://*.supabase.co wss://*.supabase.co https://*.moneroo.io https://api.moneroo.io https://*.agora.io wss://*.agora.io https://*.agoraio.cn wss://*.agoraio.cn https://*.sd-rtn.com https://*.edge.agora.io https://*.r2.dev https://pub-df336181dd964534a4866a10762a3327.r2.dev https://*.cloudflarestorage.com https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://accounts.google.com",
  "media-src 'self' blob: data: https://*.r2.dev https://pub-df336181dd964534a4866a10762a3327.r2.dev https://*.cloudflarestorage.com https://*.supabase.co",
  "frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com https://checkout.moneroo.io https://*.moneroo.io",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://checkout.moneroo.io https://*.moneroo.io",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "*.flagcdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "rtfjwpytiuvoekomevpu.supabase.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub-df336181dd964534a4866a10762a3327.r2.dev" },
      { protocol: "https", hostname: "*.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/service",
        permanent: true,
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
      { source: "/functions/v1/webhooks-moneroo", destination: "/api/webhooks/moneroo" },
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
      { source: "/p/:id", destination: "/marketplace/produits/:id" },
    ];
  },
};

export default nextConfig;
