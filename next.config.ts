import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Scoped to what the app actually talks to: Supabase (images + Storage),
// Solana Tracker's image proxy (image.solanatracker.io — serves the "most
// profitable coin" badge's token logo; the real per-token image URL it
// wraps varies per token, so we allow the one stable proxy host rather than
// every possible upstream CDN/IPFS gateway), Stripe's hosted Checkout/Portal
// (full-page redirects, not iframes/fetch — only need frame-src for the
// rare case a browser treats the redirect as framed), same-origin API
// routes for everything else. Wallet extensions
// (Phantom/Solflare) communicate via an injected `window` object, not
// network requests, so they need no CSP entry. `unsafe-eval` is dev-only —
// production Next.js bundles don't need it, only the dev-mode HMR runtime does.
//
// Google AdSense (src/app/layout.tsx's <Script>) needs its own allowances —
// it loads scripts, opens ad iframes, and fetches creative images from a
// number of Google-operated domains. Google adds new domains periodically,
// so if an ad-related CSP violation shows up in the browser console later,
// the fix is adding that exact origin to the relevant directive here, not
// loosening the policy generally.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://image.solanatracker.io https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co${isDev ? " ws:" : ""} https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com`,
  "frame-src 'self' https://checkout.stripe.com https://billing.stripe.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://www.google.com",
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
