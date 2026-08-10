"use client";

import { useState } from "react";
import Link from "next/link";
import { ProBadge } from "@/components/ui/pro-badge";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  navLinks: NavLink[];
  user: { username: string } | null;
  isPro: boolean;
}

/** Hamburger + slide-down panel — the only way to reach nav links below the `md` breakpoint. */
export function MobileNav({ navLinks, user, isPro }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background px-6 py-4">
          <div className="flex flex-col gap-4 text-sm font-medium text-muted">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="transition-colors duration-150 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 text-sm font-medium text-muted">
            {user ? (
              <>
                {isPro ? (
                  <Link href="/subscriptions" onClick={() => setOpen(false)} className="flex items-center gap-2">
                    <ProBadge /> Manage subscription
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="font-bold text-accent transition-colors duration-150 hover:text-accent-dim"
                  >
                    GET PRO
                  </Link>
                )}
                <Link href="/dashboard" onClick={() => setOpen(false)} className="hover:text-foreground">
                  Dashboard
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)} className="hover:text-foreground">
                  Profile
                </Link>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="hover:text-foreground">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
