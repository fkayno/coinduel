import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(34,224,122,0.06),transparent)]" />
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            THINK YOU&apos;RE THE BETTER TRADER?
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-5 text-lg text-muted">Your wallet. Your PNL. Your rank.</p>
        </Reveal>
        <Reveal delay={180}>
          <Link
            href="/play"
            className="mt-10 inline-block rounded-md bg-accent px-8 py-4 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.97]"
          >
            PLAY RANKED
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
