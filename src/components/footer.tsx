import Image from "next/image";
import Link from "next/link";
import { DISCORD_INVITE_URL } from "@/lib/config";
import { DiscordIcon } from "@/components/ui/discord-icon";

const FOOTER_LINKS = [
  { href: "/#duel", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="CoinDuel" width={24} height={24} />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              CoinDuel
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-150 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Discord"
              title="Join our Discord"
              className="text-muted transition-colors duration-150 hover:text-foreground"
            >
              <DiscordIcon />
            </a>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-xs leading-relaxed text-muted/80 sm:text-left">
            CoinDuel is a competitive trading analytics game. It does not custody user funds,
            execute trades, or hold assets on a user&apos;s behalf. &copy;{" "}
            {new Date().getFullYear()} CoinDuel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
