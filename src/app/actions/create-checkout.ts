"use server";

import { z } from "zod";
import { fetchProjectMetadata } from "@/lib/project-metadata";
import { getPlacement } from "@/lib/placements";
import { getCheckoutQuote, reservePlacement } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  placementSlug: z.string().min(1).max(60),
  startupUrl: z.string().trim().min(3).max(240),
  xHandle: z
    .string()
    .trim()
    .max(32)
    .regex(/^@?[A-Za-z0-9_]*$/, "Enter a valid X handle.")
    .optional()
    .default(""),
  bidAmount: z.number().int().min(1).max(5_000).optional(),
});

export type CheckoutResult = { url?: string; error?: string };

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function createCheckout(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the sponsorship details." };
  }

  const placement = getPlacement(parsed.data.placementSlug);
  if (!placement) return { error: "That placement does not exist." };

  const stripe = getStripe();
  if (!stripe || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Checkout is ready but payment configuration is still missing." };
  }

  try {
    const [project, quote] = await Promise.all([
      fetchProjectMetadata(parsed.data.startupUrl),
      getCheckoutQuote(
        placement.slug,
        parsed.data.bidAmount ? parsed.data.bidAmount * 100 : undefined,
      ),
    ]);
    const xHandle = parsed.data.xHandle
      ? `@${parsed.data.xHandle.replace(/^@/, "")}`
      : null;
    const siteUrl = getSiteUrl();
    const expiresAt = Math.floor(Date.now() / 1000) + 31 * 60;
    const metadata = {
      placement_slug: placement.slug,
      project_url: project.url.slice(0, 500),
      project_name: project.name.slice(0, 500),
      project_tagline: project.tagline.slice(0, 500),
      favicon_url: (project.faviconUrl ?? "").slice(0, 500),
      brand_color: project.brandColor,
      x_handle: (xHandle ?? "").slice(0, 500),
      bid_mode: quote.isOutbid ? "outbid" : "opening",
      supersedes_sponsorship_id: quote.supersedesSponsorshipId ?? "",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: quote.amountCents,
            product_data: {
              name: `BrandMyFlight · ${quote.isOutbid ? "Outbid" : "Claim"} ${placement.name}`,
              description: quote.isOutbid
                ? `Replace the current sponsor in ${placement.name}. The previous paid sponsor is automatically refunded.`
                : placement.description.slice(0, 500),
              metadata: { placement_slug: placement.slug },
            },
          },
        },
      ],
      payment_method_types: ["card"],
      customer_creation: "if_required",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      allow_promotion_codes: false,
      expires_at: expiresAt,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled#inventory`,
      metadata,
      payment_intent_data: { metadata },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    try {
      await reservePlacement({
        sessionId: session.id,
        placementSlug: placement.slug,
        projectName: project.name,
        projectUrl: project.url,
        tagline: project.tagline,
        faviconUrl: project.faviconUrl,
        brandColor: project.brandColor,
        xHandle,
        amountCents: quote.amountCents,
        expiresAt: new Date(expiresAt * 1000),
        supersedesSponsorshipId: quote.supersedesSponsorshipId,
      });
    } catch (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      throw error;
    }

    return { url: session.url };
  } catch (error) {
    console.error("Checkout creation failed", error);
    return {
      error: error instanceof Error ? error.message : "Unable to start checkout. Please try again.",
    };
  }
}
