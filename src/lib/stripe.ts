import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  stripeClient ??= new Stripe(key, {
    maxNetworkRetries: 2,
    typescript: true,
  });

  return stripeClient;
}
