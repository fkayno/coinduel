/** Central place for CoinDuel's two plans — mirrors src/lib/config.ts's role for game constants. */

export const PRO_MONTHLY_PRICE_USD = 20;

/**
 * The Stripe Price id for the recurring $20/month CoinDuel Pro plan.
 * Created once via `npm run stripe:setup` (scripts/stripe-setup.ts), which
 * prints the id to set here. There is deliberately no Stripe Price for the
 * FREE plan — a user with no Subscription row (or no active one) simply IS
 * on the free plan, there is nothing to represent in Stripe for $0/month.
 */
export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";

export const FREE_FEATURES = [
  "Ranked 1v1",
  "MMR",
  "Leaderboards",
  "Match history",
  "Basic profile",
] as const;

export const PRO_FEATURES = [
  "Private 1v1 duels",
  "Tournament participation",
  "Profile picture",
  "PRO badge",
  "Future PRO features",
] as const;
