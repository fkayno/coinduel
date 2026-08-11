import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SolanaWalletProvider } from "@/components/wallet/solana-wallet-provider";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoinDuel — 1v1 Solana Memecoin Trading Duels",
  description:
    "CoinDuel is a competitive 1v1 Solana memecoin trading game. Connect your wallet, get matched by MMR, and duel head-to-head on real trading PNL.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          A literal <script> tag, not next/script's <Script> component —
          every next/script strategy (including beforeInteractive) renders
          only a <link rel="preload"> in the actual server HTML and injects
          the real <script> client-side at runtime for performance. Google's
          AdSense site-verification crawler reads the raw HTML response and
          never saw that injected tag, which is what caused the "Couldn't
          verify your site" error. This tag is small and near-zero-cost, so
          skipping next/script's optimization here is the right tradeoff.
        */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4425362934909969"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SolanaWalletProvider>
          <Navbar />
          {children}
          <Footer />
          <CookieConsent />
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
