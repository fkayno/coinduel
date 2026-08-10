import { Reveal } from "@/components/ui/reveal";
import { HOW_IT_WORKS_STEPS } from "@/lib/mock-data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-sm font-bold tracking-[0.3em] text-muted">HOW IT WORKS</h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 80}>
              <div className="group h-full rounded-2xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-muted/60">
                <span className="text-sm font-bold tracking-widest text-accent">
                  {step.number}
                </span>
                <h3 className="mt-4 text-base font-bold tracking-wide text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
