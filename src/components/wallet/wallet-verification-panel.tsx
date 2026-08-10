"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { bytesToHex } from "@/lib/hex";
import { shortenAddress } from "@/lib/solana";

type LocalStatus = "idle" | "requesting-signature" | "verifying" | "failed";
type DisplayState = "not-connected" | "connected" | "awaiting-signature" | "verified" | "failed";

interface WalletVerificationPanelProps {
  initialWalletAddress: string | null;
  initialVerified: boolean;
  /** Fired once a wallet is successfully verified. */
  onVerified?: (walletAddress: string) => void;
  /** Signup shows a skip link; the profile page doesn't. */
  onSkip?: () => void;
}

export function WalletVerificationPanel({
  initialWalletAddress,
  initialVerified,
  onVerified,
  onSkip,
}: WalletVerificationPanelProps) {
  const { wallets, wallet, select, connect, disconnect, connecting, connected, publicKey, signMessage } =
    useWallet();

  const [serverVerified, setServerVerified] = useState(initialVerified);
  const [verifiedAddress, setVerifiedAddress] = useState(initialWalletAddress);
  const [status, setStatus] = useState<LocalStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingConnectName, setPendingConnectName] = useState<WalletName | null>(null);

  // wallet-adapter's `wallets`/`connected`/`publicKey` depend on browser-only
  // wallet detection that doesn't exist during server rendering — rendering
  // them before hydration completes causes a hydration mismatch. Only
  // `serverVerified` (from server props) is safe to render immediately.
  const [mounted, setMounted] = useState(false);
  // Justified exception to react-hooks/set-state-in-effect: this is the
  // standard "has hydration finished" flag. There is no render-time way to
  // compute it — by definition, the client only knows hydration is done
  // once an effect has actually run — so it can't be derived during render
  // the way the rule generally wants.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // select() only marks a wallet as chosen — actually connecting has to wait
  // until the hook reports that selection took effect.
  useEffect(() => {
    if (!pendingConnectName) return;
    if (wallet?.adapter.name !== pendingConnectName) return;
    if (connected || connecting) return;

    connect()
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not connect to wallet.");
        setStatus("failed");
      })
      .finally(() => setPendingConnectName(null));
  }, [pendingConnectName, wallet, connected, connecting, connect]);

  function handleSelectWallet(name: WalletName, readyState: string, url: string) {
    setError(null);
    if (readyState === "NotDetected" || readyState === "Unsupported") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    select(name);
    setPendingConnectName(name);
  }

  async function handleVerify() {
    if (!publicKey || !signMessage) {
      setError("This wallet doesn't support message signing.");
      setStatus("failed");
      return;
    }

    setError(null);
    setStatus("requesting-signature");

    try {
      const walletAddress = publicKey.toBase58();

      const challengeRes = await fetch("/api/wallet/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) {
        throw new Error(challengeData.error ?? "Could not start verification.");
      }

      // This is what actually opens the wallet's signing prompt.
      const signatureBytes = await signMessage(new TextEncoder().encode(challengeData.message));

      setStatus("verifying");

      const verifyRes = await fetch("/api/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signature: bytesToHex(signatureBytes) }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.ok) {
        throw new Error(verifyData.error ?? "Signature verification failed.");
      }

      setServerVerified(true);
      setVerifiedAddress(walletAddress);
      setStatus("idle");
      onVerified?.(walletAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setStatus("failed");
    }
  }

  async function handleDisconnect() {
    await fetch("/api/wallet/disconnect", { method: "POST" }).catch(() => {});
    await disconnect().catch(() => {});
    setServerVerified(false);
    setVerifiedAddress(null);
    setStatus("idle");
    setError(null);
  }

  const displayState: DisplayState = serverVerified
    ? "verified"
    : status === "requesting-signature" || status === "verifying"
      ? "awaiting-signature"
      : status === "failed"
        ? "failed"
        : connected
          ? "connected"
          : "not-connected";

  if (displayState === "verified" && verifiedAddress) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              WALLET VERIFIED
            </span>
            <p className="mt-2 text-sm text-foreground">{shortenAddress(verifiedAddress)}</p>
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            className="rounded-md border border-border px-4 py-2 text-xs font-semibold tracking-wide text-muted transition-colors duration-150 hover:border-loss/60 hover:text-loss"
          >
            DISCONNECT
          </button>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <span className="text-xs font-semibold tracking-widest text-muted">
          WALLET VERIFICATION
        </span>
        <p className="mt-4 text-sm text-muted">Checking for a wallet&hellip;</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <span className="text-xs font-semibold tracking-widest text-muted">
        {displayState === "awaiting-signature" ? "AWAITING SIGNATURE" : "WALLET VERIFICATION"}
      </span>

      {displayState === "not-connected" && (
        <div className="mt-4 flex flex-col gap-2">
          {wallets.length === 0 && (
            <p className="text-sm text-muted">
              No Solana wallet detected. Install{" "}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:text-accent-dim"
              >
                Phantom
              </a>{" "}
              or{" "}
              <a
                href="https://solflare.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:text-accent-dim"
              >
                Solflare
              </a>{" "}
              to continue.
            </p>
          )}
          {wallets.map((w) => (
            <button
              key={w.adapter.name}
              type="button"
              onClick={() => handleSelectWallet(w.adapter.name, w.readyState, w.adapter.url)}
              className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors duration-150 hover:border-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.adapter.icon} alt="" className="h-5 w-5" />
              {w.adapter.name}
              {w.readyState === "NotDetected" && (
                <span className="ml-auto text-xs font-normal text-muted">Install</span>
              )}
            </button>
          ))}
        </div>
      )}

      {displayState === "connected" && publicKey && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-foreground">
            Connected: {shortenAddress(publicKey.toBase58())}
          </p>
          <button
            type="button"
            onClick={handleVerify}
            className="rounded-md bg-accent px-6 py-3 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
          >
            SIGN TO VERIFY
          </button>
        </div>
      )}

      {displayState === "awaiting-signature" && (
        <p className="mt-4 text-sm text-muted">
          Check your wallet for a signature request&hellip;
        </p>
      )}

      {displayState === "failed" && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-loss">{error ?? "Verification failed."}</p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setError(null);
            }}
            className="rounded-md border border-border px-6 py-3 text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {onSkip && displayState !== "awaiting-signature" && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-4 text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
        >
          Skip for now — verify later from your profile
        </button>
      )}
    </div>
  );
}
