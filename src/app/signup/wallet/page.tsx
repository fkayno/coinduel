import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { SignupWalletStep } from "@/components/auth/signup-wallet-step";

export const metadata: Metadata = {
  title: "Verify Wallet — CoinDuel",
};

export default async function SignupWalletPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-6 py-16">
      <SignupWalletStep
        initialWalletAddress={user.walletAddress}
        initialVerified={user.walletVerified}
      />
    </div>
  );
}
