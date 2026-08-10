import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot Password — CoinDuel",
};

// TODO: implement the real password-reset flow (email token + reset form)
// once the production auth backend (Prisma/Postgres) is wired up. This is
// intentionally a placeholder — do not fake a reset email here.
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">PASSWORD RESET</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        Password reset isn&apos;t available yet. This flow will let you reset your password by
        email once it&apos;s built.
      </p>
      <Link
        href="/login"
        className="mt-8 text-sm font-semibold text-accent transition-colors duration-150 hover:text-accent-dim"
      >
        &larr; Back to login
      </Link>
    </div>
  );
}
