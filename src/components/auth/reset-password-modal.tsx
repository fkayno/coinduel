"use client";

import { useState } from "react";
import { DISCORD_INVITE_URL } from "@/lib/config";
import { DiscordIcon } from "@/components/ui/discord-icon";

/** Triggers a popup pointing users to a Discord support ticket — password reset isn't self-serve yet. */
export function ResetPasswordButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-center text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
      >
        Forgot password?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md border border-border p-1.5 text-muted transition-colors duration-150 hover:border-muted hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-foreground">
              Need to reset your password?
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
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
          </div>
        </div>
      )}
    </>
  );
}
