"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TextField } from "@/components/ui/text-field";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await loginAction({ email, password });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-sm text-loss">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-accent px-6 py-3.5 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
      >
        {isSubmitting ? "LOGGING IN..." : "LOGIN"}
      </button>

      <Link
        href="/forgot-password"
        className="text-center text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
      >
        Forgot password?
      </Link>
    </form>
  );
}
