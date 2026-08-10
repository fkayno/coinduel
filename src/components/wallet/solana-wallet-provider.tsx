"use client";

import { useMemo } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

/**
 * Wraps the app with Solana wallet-adapter's connection context. No
 * ConnectionProvider/RPC endpoint is configured — this app only ever needs
 * wallet CONNECT + SIGN MESSAGE (no on-chain reads/writes), so there's
 * nothing to talk to an RPC node for.
 *
 * Phantom and Solflare are registered explicitly for broad compatibility,
 * but modern versions of both (and any other Wallet Standard-compliant
 * extension) are also auto-detected by wallet-adapter-react regardless.
 */
export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <WalletProvider wallets={wallets} autoConnect={false}>
      {children}
    </WalletProvider>
  );
}
