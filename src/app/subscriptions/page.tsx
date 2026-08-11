import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { getSubscriptionByUserId } from "@/lib/db/subscriptions";
import { createPortalSessionAction } from "@/lib/billing/actions";
import { PRO_FEATURES, PRO_MONTHLY_PRICE_USD } from "@/lib/billing/plans";
import { formatDate } from "@/lib/format";
import { ProBadge } from "@/components/ui/pro-badge";

export const metadata: Metadata = {
  title: "Subscription — CoinDuel",
};

export default async function SubscriptionsPage() {
  const user = await requireUser();
  const subscription = await getSubscriptionByUserId(user.id);
  const isPro = subscription?.status === "active";

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">SUBSCRIPTION</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
        Manage your plan
      </h1>

      <div className="mt-10 rounded-2xl border border-border bg-surface p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-widest text-muted">CURRENT PLAN</span>
            <div className="mt-2 flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-foreground">
                {isPro ? "COINDUEL PRO" : "FREE"}
              </h2>
              {isPro && <ProBadge />}
            </div>
          </div>
          {isPro && (
            <p className="text-2xl font-extrabold text-foreground">
              ${PRO_MONTHLY_PRICE_USD}
              <span className="text-sm font-semibold text-muted">/month</span>
            </p>
          )}
        </div>

        {isPro && subscription && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold tracking-widest text-muted">STATUS</span>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                ACTIVE
              </p>
            </div>
            {subscription.currentPeriodEnd && (
              <div>
                <span className="text-xs font-semibold tracking-widest text-muted">
                  NEXT BILLING DATE
                </span>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            )}
          </div>
        )}

        {isPro && subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <p className="mt-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
            Your subscription is scheduled to cancel on{" "}
            <strong>{formatDate(subscription.currentPeriodEnd)}</strong>. You will keep Pro access
            until then.
          </p>
        )}

        {!isPro && subscription && subscription.status !== "incomplete" && (
          <p className="mt-6 rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">
            Your last subscription is no longer active (status: {subscription.status}). Pro
            features are unavailable until you resubscribe.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {isPro ? (
            <form action={createPortalSessionAction}>
              <button
                type="submit"
                className="rounded-md border border-border px-6 py-3 text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
              >
                MANAGE SUBSCRIPTION
              </button>
            </form>
          ) : (
            <Link
              href="/pricing"
              className="rounded-md bg-accent px-6 py-3 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
            >
              GET PRO — ${PRO_MONTHLY_PRICE_USD}/month
            </Link>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        Billing, invoices, payment methods, and cancellation are all managed securely through
        Stripe&apos;s Customer Portal.
      </p>

      <div className="mt-10 rounded-2xl border border-accent/30 bg-surface p-8">
        <span className="text-xs font-semibold tracking-widest text-accent">
          {isPro ? "WHAT YOU GET WITH PRO" : "WHAT COINDUEL PRO UNLOCKS"}
        </span>
        <ul className="mt-5 flex flex-col gap-3">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/90">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {feature}
            </li>
          ))}
        </ul>
        {!isPro && (
          <Link
            href="/pricing"
            className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
          >
            GET PRO — ${PRO_MONTHLY_PRICE_USD}/month
          </Link>
        )}
      </div>
    </div>
  );
}
