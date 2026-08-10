import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — CoinDuel",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col px-6 py-24">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">LEGAL</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-6 text-sm leading-6 text-muted">
        This page summarizes what CoinDuel actually collects and stores today. It is not a
        substitute for a formal legal privacy policy — a complete policy reviewed by counsel
        will replace this page before public launch.
      </p>
      <div className="mt-8 flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-bold text-foreground">Account information</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            Email address, username, and a securely hashed password (never stored or transmitted
            in plain text) are collected at signup.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Solana wallet address</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            If you verify a wallet, we store its public address and the time it was verified.
            Verification proves you control the wallet via a signed message — we never request
            or store a private key or seed phrase, and no on-chain transaction is ever made on
            your behalf.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Trading performance (PNL)</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            To run ranked matches, we fetch your verified wallet&apos;s publicly-visible
            all-time trading profit/loss from a third-party data provider (Solana Tracker) and
            store a snapshot of it against each match you play.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Profile picture</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            If you upload a profile picture (CoinDuel Pro), the image is stored in our cloud
            storage provider (Supabase) and is publicly visible, like the rest of your profile.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Billing (CoinDuel Pro)</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            Subscription payments are processed entirely by Stripe. We never see or store your
            card details — only your subscription status and billing dates.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Session cookies</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            A single httpOnly session cookie keeps you signed in. It is not used for tracking or
            advertising.
          </p>
        </div>
      </div>
      <Link
        href="/"
        className="mt-10 inline-block text-sm font-semibold text-accent transition-colors duration-150 hover:text-accent-dim"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
