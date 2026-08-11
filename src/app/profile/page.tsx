import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { getRankForMmr } from "@/lib/game/mmr";
import { hasProAccess } from "@/lib/billing/entitlement";
import { WalletVerificationPanel } from "@/components/wallet/wallet-verification-panel";
import { WalletSafetyButton } from "@/components/wallet/wallet-safety-modal";
import { Avatar } from "@/components/ui/avatar";
import { ProBadge } from "@/components/ui/pro-badge";
import { AvatarUploadPanel } from "@/components/profile/avatar-upload-panel";

export const metadata: Metadata = {
  title: "Profile — CoinDuel",
};

export default async function ProfilePage() {
  const user = await requireUser();
  const isPro = await hasProAccess(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">PROFILE</span>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <Avatar username={user.username} profileImageUrl={user.profileImageUrl} size="xl" />
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {user.username}
            </h1>
            {isPro && <ProBadge />}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/90">
              {getRankForMmr(user.mmr)}
            </span>
            <span className="text-xs text-muted">{user.mmr.toLocaleString()} MMR</span>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <span className="text-xs font-semibold tracking-[0.3em] text-muted">
          PROFILE PICTURE
        </span>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
          {isPro ? (
            <AvatarUploadPanel username={user.username} initialProfileImageUrl={user.profileImageUrl} />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar username={user.username} profileImageUrl={user.profileImageUrl} size="lg" />
                <p className="max-w-xs text-sm text-muted">
                  Profile pictures are a CoinDuel Pro feature.
                </p>
              </div>
              <Link
                href="/pricing"
                className="shrink-0 rounded-md bg-accent px-5 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
              >
                GET PRO
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <span className="text-xs font-semibold tracking-[0.3em] text-muted">WALLET</span>
        <div className="mt-4">
          <WalletVerificationPanel
            initialWalletAddress={user.walletAddress}
            initialVerified={user.walletVerified}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          A verified wallet is required to play ranked matches. Verifying proves you control the
          wallet — it never asks for your seed phrase or private key.
        </p>
        <WalletSafetyButton />
      </div>

      <p className="mt-10 text-sm text-muted">
        Full trading stats and match history are coming soon.
      </p>
    </div>
  );
}
