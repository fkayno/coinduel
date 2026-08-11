"use client";

import { useState } from "react";

const POINTS = [
  {
    title: "We never see your seed phrase or private key",
    body: "Verifying only ever asks your wallet to sign a short message. Signing proves you control the wallet without exposing any secret — your seed phrase and private key never leave your wallet app, and CoinDuel never asks for them.",
  },
  {
    title: "CoinDuel can't move or spend your funds",
    body: "This isn't a custodial app — we don't hold, transfer, or have any ability to touch your assets. No match, no verification step, and no other action on CoinDuel ever creates a real transaction.",
  },
  {
    title: "Your trading data is already public",
    body: "Solana wallet activity is public on-chain by design — anyone can already look up a wallet's trade history. CoinDuel just reads that public data to compare it in a match; it isn't private information you're handing over.",
  },
  {
    title: "Built on the same standard Phantom and Solflare publish",
    body: "Wallet connection uses the official, open-source Solana wallet-adapter libraries — the same integration standard Phantom and Solflare themselves maintain and that thousands of Solana apps use. There's no custom or hidden integration with your wallet.",
  },
];

export function WalletSafetyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-bold tracking-wide text-accent transition-colors duration-150 hover:bg-accent/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" />
        </svg>
        Is this safe?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-[0.3em] text-muted">WALLET SAFETY</span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                  Is this safe?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 rounded-md border border-border p-1.5 text-muted transition-colors duration-150 hover:border-muted hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              {POINTS.map((point) => (
                <div key={point.title}>
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {point.title}
                  </p>
                  <p className="mt-1.5 pl-3.5 text-xs leading-relaxed text-muted">{point.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 rounded-xl border border-border bg-surface-2 px-4 py-3 text-[11px] leading-relaxed text-muted">
              As always: only ever connect your wallet through <strong className="text-foreground">coinduel.online</strong>,
              and never approve a signature request whose message you don&apos;t recognize or understand.
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-md border border-border px-5 py-2.5 text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
