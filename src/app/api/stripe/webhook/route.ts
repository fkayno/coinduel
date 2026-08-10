import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { claimStripeEvent, releaseStripeEvent } from "@/lib/db/stripe-events";
import { getSubscriptionByStripeCustomerId, upsertSubscriptionState } from "@/lib/db/subscriptions";

/**
 * The ONLY place CoinDuel Pro subscription state is ever written from
 * outside a checkout/portal redirect. Every field comes straight off a
 * Stripe-signature-verified event — nothing here is ever influenced by
 * anything the browser sends. See src/lib/billing/entitlement.ts for how
 * this state is read.
 */

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  // Stripe moved current_period_start/end from the Subscription object to
  // each SubscriptionItem (flexible billing mode, the default on recent API
  // versions) — a subscription with a single recurring price still has
  // exactly one item, so items.data[0] is authoritative here.
  const item = subscription.items.data[0];
  return {
    start: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
    end: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
  };
}

function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Also moved recently: invoice.subscription -> invoice.parent.subscription_details.subscription.
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (fromParent) return typeof fromParent === "string" ? fromParent : fromParent.id;
  return null;
}

async function resolveUserId(customerId: string, subscription: Stripe.Subscription): Promise<string | null> {
  const metadataUserId = subscription.metadata?.userId;
  if (metadataUserId) return metadataUserId;

  // Fallback for events where metadata didn't propagate — look up by the
  // Stripe Customer id, which was recorded on our side the moment checkout started.
  const existing = await getSubscriptionByStripeCustomerId(customerId);
  return existing?.userId ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const userId = await resolveUserId(customerId, subscription);
  if (!userId) {
    console.error(`Stripe webhook: no CoinDuel user found for customer ${customerId} / subscription ${subscription.id}`);
    return;
  }

  const { start, end } = getSubscriptionPeriod(subscription);

  await upsertSubscriptionState(userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id ?? null,
    status: subscription.status,
    currentPeriodStart: start,
    currentPeriodEnd: end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe-Signature header." }, { status: 400 });
  }

  // Signature verification requires the exact raw body bytes Stripe sent —
  // request.text() here, never request.json() (which would re-serialize
  // and break the signature).
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency: insert-or-skip on the event id BEFORE any state mutation,
  // so Stripe's at-least-once retry delivery can never double-apply an event.
  const isNewEvent = await claimStripeEvent(event.id, event.type);
  if (!isNewEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = extractSubscriptionId(invoice);
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      default:
        break; // event type we don't act on — acknowledged, not an error
    }
  } catch (error) {
    // Release the claim so Stripe's automatic retry can actually reprocess
    // this event instead of it being wrongly skipped as "already handled".
    await releaseStripeEvent(event.id);
    console.error(`Stripe webhook: failed to process ${event.type} (${event.id}):`, error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
