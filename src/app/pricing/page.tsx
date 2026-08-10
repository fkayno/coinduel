import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasProAccess } from "@/lib/billing/entitlement";
import { createCheckoutSessionAction } from "@/lib/billing/actions";
import { FREE_FEATURES, PRO_FEATURES, PRO_MONTHLY_PRICE_USD } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Pricing — CoinDuel",
};

const ERROR_MESSAGES: Record<string, string> = {
  checkout_failed: "Couldn't start checkout. Please try again.",
  not_configured: "Pro subscriptions aren't configured yet. Try again shortly.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const reasonParam = params.reason;
  const reason = Array.isArray(reasonParam) ? reasonParam[0] : reasonParam;
  const errorParam = params.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  const user = await getCurrentUser();
  const isPro = user ? await hasProAccess(user.id) : false;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-20">
      <div className="text-center">
        <span className="text-xs font-semibold tracking-[0.3em] text-muted">PRICING</span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Skill wins duels. Not your plan.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted">
          CoinDuel Pro never changes matchmaking, MMR, or PNL — it unlocks private duels,
          tournaments, and profile customization.
        </p>
      </div>

      {reason && (
        <p className="mx-auto mt-8 max-w-md rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-center text-sm text-foreground">
          {reason}
        </p>
      )}
      {error && (
        <p className="mx-auto mt-8 max-w-md rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-center text-sm text-loss">
          {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
        </p>
      )}

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-8">
          <span className="text-xs font-semibold tracking-widest text-muted">FREE</span>
          <p className="mt-3 text-3xl font-extrabold text-foreground">
            $0<span className="text-base font-semibold text-muted">/month</span>
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/90">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-2xl border border-accent/50 bg-surface p-8 ring-1 ring-accent/20">
          <span className="text-xs font-semibold tracking-widest text-accent">COINDUEL PRO</span>
          <p className="mt-3 text-3xl font-extrabold text-foreground">
            ${PRO_MONTHLY_PRICE_USD}
            <span className="text-base font-semibold text-muted">/month</span>
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/90">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isPro ? (
              <Link
                href="/subscriptions"
                className="block w-full rounded-md border border-border py-3.5 text-center text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
              >
                MANAGE SUBSCRIPTION
              </Link>
            ) : user ? (
              <form action={createCheckoutSessionAction}>
                <button
                  type="submit"
                  className="w-full rounded-md bg-accent py-3.5 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
                >
                  GET PRO
                </button>
              </form>
            ) : (
              <Link
                href="/login?next=/pricing"
                className="block w-full rounded-md bg-accent py-3.5 text-center text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
              >
                GET PRO
              </Link>
            )}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted">
        No free trial. Cancel anytime — you keep Pro access until the end of your current billing
        period. Payments processed securely by Stripe.
      </p>
    </div>
  );
}
