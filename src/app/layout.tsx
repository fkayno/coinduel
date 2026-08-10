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
