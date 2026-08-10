"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StepIndicator } from "@/components/auth/step-indicator";
import { WalletVerificationPanel } from "@/components/wallet/wallet-verification-panel";

interface SignupWalletStepProps {
  initialWalletAddress: string | null;
  initialVerified: boolean;
}

export function SignupWalletStep({ initialWalletAddress, initialVerified }: SignupWalletStepProps) {
  const router = useRouter();
  const [step, setStep] = useState<2 | 3>(initialVerified ? 3 : 2);

  useEffect(() => {
    if (step !== 3) return;
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
    return () => clearTimeout(timeout);
  }, [step, router]);

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center gap-6">
        <Image src="/logo.png" alt="CoinDuel" width={40} height={40} />
        <StepIndicator currentStep={step} />
      </div>

      <div
        key={step}
        className="animate-reveal-up mt-10 rounded-2xl border border-border bg-surface p-8"
      >
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                VERIFY YOUR WALLET
              </h1>
              <p className="mt-2 text-sm text-muted">
                Connect a Solana wallet and sign a message to prove you control it. This is
                required before playing ranked matches.
              </p>
            </div>

            <WalletVerificationPanel
              initialWalletAddress={initialWalletAddress}
              initialVerified={initialVerified}
              onVerified={() => setStep(3)}
              onSkip={() => router.push("/dashboard")}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent">
              &#10003;
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              WELCOME TO COINDUEL
            </h1>
            <p className="text-sm text-muted">Taking you to your dashboard&hellip;</p>
          </div>
        )}
      </div>
    </div>
  );
}
