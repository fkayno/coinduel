"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StepIndicator } from "@/components/auth/step-indicator";
import { TextField } from "@/components/ui/text-field";
import { signupAction } from "@/lib/auth/actions";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/lib/validation";

interface AccountFields {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof AccountFields, string>>;

export function SignupWizard() {
  const router = useRouter();

  const [account, setAccount] = useState<AccountFields>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleAccountChange(field: keyof AccountFields, value: string) {
    setAccount((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleContinueFromAccount() {
    const errors: FieldErrors = {
      username: validateUsername(account.username) ?? undefined,
      email: validateEmail(account.email) ?? undefined,
      password: validatePassword(account.password) ?? undefined,
      confirmPassword:
        validateConfirmPassword(account.password, account.confirmPassword) ?? undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSubmitError(null);
    setIsSubmitting(true);

    // The account is created for real here — wallet verification lives on its
    // own /signup/wallet route (not a client-side step on this page), since
    // the moment this sets a session cookie, Next.js refreshes /signup and
    // the middleware would otherwise redirect a now-logged-in user away.
    const result = await signupAction({
      username: account.username,
      email: account.email,
      password: account.password,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      if (result.field) {
        setFieldErrors((prev) => ({ ...prev, [result.field as keyof AccountFields]: result.error }));
      } else {
        setSubmitError(result.error);
      }
      return;
    }

    router.push("/signup/wallet");
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center gap-6">
        <Image src="/logo.png" alt="CoinDuel" width={40} height={40} />
        <StepIndicator currentStep={1} />
      </div>

      <div className="animate-reveal-up mt-10 rounded-2xl border border-border bg-surface p-8">
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            CREATE YOUR COINDUEL ACCOUNT
          </h1>

          <div className="flex flex-col gap-4">
            <TextField
              label="Username"
              name="username"
              autoComplete="username"
              maxLength={20}
              value={account.username}
              error={fieldErrors.username}
              onChange={(e) => handleAccountChange("username", e.target.value)}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={account.email}
              error={fieldErrors.email}
              onChange={(e) => handleAccountChange("email", e.target.value)}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={account.password}
              error={fieldErrors.password}
              onChange={(e) => handleAccountChange("password", e.target.value)}
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={account.confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={(e) => handleAccountChange("confirmPassword", e.target.value)}
            />
          </div>

          {submitError && <p className="text-sm text-loss">{submitError}</p>}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleContinueFromAccount}
            className="rounded-md bg-accent px-6 py-3.5 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? "CREATING ACCOUNT..." : "CONTINUE"}
          </button>
        </div>
      </div>
    </div>
  );
}
