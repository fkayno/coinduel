import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Scoped to what the app actually talks to: Supabase (images + Storage),
// Stripe's hosted Checkout/Portal (full-page redirects, not iframes/fetch —
// only need frame-src for the rare case a browser treats the redirect as
// framed), same-origin API routes for everything else. Wallet extensions
// (Phantom/Solflare) communicate via an injected `window` object, not
// network requests, so they need no CSP entry. `unsafe-eval` is dev-only —
// production Next.js bundles don't need it, only the dev-mode HMR runtime does.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co${isDev ? " ws:" : ""}`,
  "frame-src 'self' https://checkout.stripe.com https://billing.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          // Belt-and-suspenders alongside frame-ancestors — older browsers
          // that don't honor CSP frame-ancestors still get clickjacking protection.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Explicitly allow camera/mic for this origin only (WebRTC video
          // duels need them) while denying every other browser feature and
          // any third-party origin the same permission.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
