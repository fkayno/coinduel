import Stripe from "stripe";

/**
 * Server-only Stripe client singleton, cached on globalThis in dev the same
 * way src/lib/db/client.ts caches the Prisma client — avoids exhausting
 * connections/instantiating a new client on every Turbopack module reload.
 * Always instantiate via `new Stripe(...)`, never the deprecated
 * module-level `stripe.setApiKey` pattern.
 *
 * Deliberately LAZY (a Proxy, not instantiated at module load) — `next
 * build` statically evaluates route modules to collect metadata even
 * without ever invoking the handler, so an eager throw here for a missing
 * STRIPE_SECRET_KEY would fail the production build outright even when no
 * Stripe-dependent route is actually being hit. The error still surfaces
 * immediately and clearly the first time Stripe is actually used.
 */
const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined };

function createClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add a Stripe TEST MODE secret or restricted key to .env — see .env.example."
    );
  }
  return new Stripe(secretKey);
}

function getClient(): Stripe {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = createClient();
  }
  return globalForStripe.stripe;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
