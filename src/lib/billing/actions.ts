"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PRO_PRICE_ID } from "@/lib/billing/plans";
import { createPendingSubscription, getSubscriptionByUserId } from "@/lib/db/subscriptions";
import { getBaseUrl } from "@/lib/http/base-url";

/**
 * Finds (or creates) the Stripe Customer for this user. A Subscription row
 * is created the moment a customer exists — before any payment — purely so
 * repeat checkout attempts (e.g. the user abandons Checkout and clicks "Get
 * Pro" again) reuse one Stripe Customer instead of creating a new one every
 * time. This row's `status` stays "incomplete" until the webhook confirms
 * an actual paid subscription; hasProAccess() never trusts this alone.
 */
async function getOrCreateStripeCustomerId(userId: string, email: string): Promise<string> {
  const existing = await getSubscriptionByUserId(userId);
  if (existing) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await createPendingSubscription(userId, customer.id);
  return customer.id;
}

/**
 * Starts Stripe's hosted subscription Checkout for CoinDuel Pro ($20/month,
 * no trial). Never activates PRO itself — only the webhook handler does
 * that, once Stripe confirms the subscription. Used as a <form action={...}>
 * so the "GET PRO" button works with no client-side JS required.
 */
export async function createCheckoutSessionAction(_formData: FormData): Promise<void> {
  const user = await requireUser();

  if (!STRIPE_PRO_PRICE_ID) {
    redirect("/pricing?error=not_configured");
  }

  let checkoutUrl: string;
  try {
    const customerId = await getOrCreateStripeCustomerId(user.id, user.email);
    const baseUrl = await getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/subscriptions?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id } },
      metadata: { userId: user.id },
    });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    checkoutUrl = session.url;
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("Stripe checkout session creation failed:", error);
    redirect("/pricing?error=checkout_failed");
  }

  redirect(checkoutUrl);
}

/**
 * Opens Stripe's hosted Customer Portal — cancellation, payment method
 * updates, invoices, all handled by Stripe, never a custom billing UI here.
 */
export async function createPortalSessionAction(_formData: FormData): Promise<void> {
  const user = await requireUser();
  const subscription = await getSubscriptionByUserId(user.id);

  if (!subscription) {
    redirect("/pricing");
  }

  let portalUrl: string;
  try {
    const baseUrl = await getBaseUrl();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/subscriptions`,
    });
    portalUrl = session.url;
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("Stripe billing portal session creation failed:", error);
    redirect("/subscriptions?error=portal_failed");
  }

  redirect(portalUrl);
}

/** next/navigation's redirect() throws a special error to unwind — must never be swallowed by a catch. */
function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
