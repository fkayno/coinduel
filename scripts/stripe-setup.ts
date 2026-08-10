/**
 * One-time (idempotent) setup script — creates the "CoinDuel Pro" Product
 * and its recurring $20/month Price using whatever STRIPE_SECRET_KEY is in
 * .env. Deliberately NOT run via the Stripe MCP plugin/tools, since that
 * plugin is connected to the live Stripe account in this environment — this
 * script uses the ordinary `stripe` npm SDK against whatever key you put in
 * .env, so it only ever touches TEST mode as long as that key is a
 * sk_test_/rk_test_ key.
 *
 * Run with: npm run stripe:setup
 * Safe to re-run — finds the existing Product/Price by lookup_key instead
 * of creating a duplicate every time.
 */
import "dotenv/config";
import Stripe from "stripe";

const LOOKUP_KEY = "coinduel_pro_monthly";

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set in .env. Add a Stripe TEST MODE key first.");
    process.exit(1);
  }
  if (secretKey.startsWith("sk_live") || secretKey.startsWith("rk_live")) {
    console.error(
      "STRIPE_SECRET_KEY looks like a LIVE mode key (sk_live_.../rk_live_...). Refusing to run — use a TEST mode key (sk_test_.../rk_test_...) for development."
    );
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);

  const existingPrices = await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], limit: 1 });
  if (existingPrices.data.length > 0) {
    console.log(`Price already exists: ${existingPrices.data[0].id}`);
    console.log(`Set STRIPE_PRO_PRICE_ID=${existingPrices.data[0].id} in .env (if not already set).`);
    return;
  }

  const product = await stripe.products.create({
    name: "CoinDuel Pro",
    description: "Private 1v1 duels, tournament participation, profile picture, and PRO badge.",
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 2000, // $20.00
    recurring: { interval: "month" },
    lookup_key: LOOKUP_KEY,
  });

  console.log(`Created product ${product.id} and price ${price.id}.`);
  console.log(`Set STRIPE_PRO_PRICE_ID=${price.id} in .env.`);
}

main().catch((error) => {
  console.error("Stripe setup failed:", error);
  process.exit(1);
});
