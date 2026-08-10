import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { WalletVerificationPanel } from "@/components/wallet/wallet-verification-panel";
import { AvatarUploadPanel } from "@/components/profile/avatar-upload-panel";

export const metadata: Metadata = {
  title: "Settings — CoinDuel",
};

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">SETTINGS</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
        Account Settings
      </h1>

      <div className="mt-10 flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">USERNAME</span>
          <p className="mt-2 text-sm text-foreground">{user.username}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">EMAIL</span>
          <p className="mt-2 text-sm text-foreground">{user.email}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">
            PROFILE PICTURE
          </span>
          <div className="mt-4">
            <AvatarUploadPanel username={user.username} initialProfileImageUrl={user.profileImageUrl} />
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold tracking-widest text-muted">WALLET</span>
          <div className="mt-2">
            <WalletVerificationPanel
              initialWalletAddress={user.walletAddress}
              initialVerified={user.walletVerified}
            />
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">Editing other account settings is coming soon.</p>
    </div>
  );
}
