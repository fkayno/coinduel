import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logoutAction } from "@/lib/auth/actions";
import { hasProAccess } from "@/lib/billing/entitlement";
import { ProBadge } from "@/components/ui/pro-badge";

const LOGGED_OUT_LINKS = [
  { href: "/#duel", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/pricing", label: "Pricing" },
];

const LOGGED_IN_LINKS = [
  { href: "/play", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/matches", label: "Matches" },
  { href: "/tournaments", label: "Tournaments" },
];

export async function Navbar() {
  const user = await getCurrentUser();
  const navLinks = user ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;
  const isPro = user ? await hasProAccess(user.id) : false;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="CoinDuel" width={28} height={28} priority />
          <span className="text-base font-semibold tracking-tight text-foreground">
            CoinDuel
          </span>
        </Link>

        <div className="hidden items-center gap-9 text-sm font-medium text-muted md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isPro ? (
                <Link
                  href="/subscriptions"
                  className="hidden sm:inline-block"
                  aria-label="Manage subscription"
                >
                  <ProBadge />
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="hidden rounded-md border border-accent/40 px-3 py-1.5 text-xs font-bold tracking-wide text-accent transition-colors duration-150 hover:bg-accent/10 sm:inline-block"
                >
                  GET PRO
                </Link>
              )}
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground sm:inline-block"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="hidden text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground sm:inline-block"
              >
                Profile
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground sm:inline-block"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.97]"
              >
                PLAY NOW
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
