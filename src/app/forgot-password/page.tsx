import type { Metadata } from "next";
import Link from "next/link";
import { DISCORD_INVITE_URL } from "@/lib/config";
import { DiscordIcon } from "@/components/ui/discord-icon";

export const metadata: Metadata = {
  title: "Forgot Password — CoinDuel",
};

// Password reset isn't self-serve yet — do not fake a reset email here.
// Users are directed to open a Discord support ticket instead (see the
// popup version of this same content: ResetPasswordButton, used from the
// login form). Kept as a real page too for anyone who lands here directly.
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">PASSWORD RESET</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        Password reset isn&apos;t self-serve on the website yet. Open a ticket in our Discord
        server and we&apos;ll help you regain access.
      </p>

      <a
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-md bg-[#5865F2] px-6 py-3.5 text-sm font-bold tracking-wide text-white transition-all duration-150 hover:bg-[#4752C4] active:scale-[0.98]"
      >
        <DiscordIcon className="h-5 w-5 shrink-0" />
        OPEN A TICKET IN DISCORD
      </a>

      <Link
        href="/login"
        className="mt-8 text-sm font-semibold text-accent transition-colors duration-150 hover:text-accent-dim"
      >
        &larr; Back to login
      </Link>
    </div>
  );
}
