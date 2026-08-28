import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { markSponsorshipPaid, releaseSponsorship } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      await markSponsorshipPaid(session.id, paymentIntent);
    }

    if (event.type === "checkout.session.expired") {
      await releaseSponsorship(event.data.object.id);
    }
  } catch (error) {
    console.error("Stripe webhook fulfillment failed", error);
    return Response.json({ error: "Webhook fulfillment failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
