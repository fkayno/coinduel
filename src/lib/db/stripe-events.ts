import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

/**
 * Idempotency gate for webhook processing. Returns true the first time a
 * given Stripe event id is seen (and records it), false on any subsequent
 * delivery of the same id — Stripe retries webhooks at-least-once, so every
 * event type handler in the webhook route must check this BEFORE mutating
 * subscription state, not after.
 */
export async function claimStripeEvent(id: string, type: string): Promise<boolean> {
  try {
    await prisma.stripeEvent.create({ data: { id, type } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false; // already processed — duplicate delivery
    }
    throw error;
  }
}

/**
 * Releases a claim taken by claimStripeEvent when processing then fails —
 * without this, a genuine processing error (not a duplicate delivery) would
 * leave the event permanently marked "seen", so Stripe's automatic retry
 * would be silently skipped as a duplicate and the subscription state would
 * never get fixed. Only ever called from the webhook route's catch block.
 */
export async function releaseStripeEvent(id: string): Promise<void> {
  await prisma.stripeEvent.deleteMany({ where: { id } });
}
