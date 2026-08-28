import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getEffectiveBidAmountCents,
  getNextBidAmountCents,
  getPlacement,
  placements,
  type AuctionBid,
  type PlacementWithState,
} from "@/lib/placements";

let serviceClient: SupabaseClient | null = null;

export function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  serviceClient ??= createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return serviceClient;
}

export type VisitorCounts = {
  liveVisitors: number;
  totalVisitors: number;
};

type VisitorCountRow = {
  live_visitors: number | string;
  total_visitors: number | string;
};

export async function recordSiteVisit(sessionId: string): Promise<VisitorCounts | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;

  const { data, error } = await supabase
    .rpc("record_site_visit", { p_session_id: sessionId })
    .single();

  if (error) throw error;

  const row = data as VisitorCountRow;
  return {
    liveVisitors: Number(row.live_visitors),
    totalVisitors: Number(row.total_visitors),
  };
}

export async function getPlacementInventory(): Promise<PlacementWithState[]> {
  const supabase = getSupabaseService();
  if (!supabase) {
    return placements.map((placement) => ({
      ...placement,
      status: "available",
      sponsor: null,
      currentBid: null,
      checkoutPrice: placement.price,
      hasPendingBid: false,
    }));
  }

  const [{ data: inventory, error: inventoryError }, { data: sponsorships, error: sponsorshipError }] =
    await Promise.all([
      supabase.from("flight_placements").select("slug,status,reservation_expires_at"),
      supabase
        .from("flight_sponsorships")
        .select("id,placement_slug,project_name,project_url,tagline,favicon_url,brand_color,x_handle,amount_cents,status,expires_at,supersedes_sponsorship_id")
        .in("status", ["paid", "pending"]),
    ]);

  if (inventoryError || sponsorshipError) {
    console.error("Unable to load placement inventory", inventoryError ?? sponsorshipError);
    return placements.map((placement) => ({
      ...placement,
      status: "available",
      sponsor: null,
      currentBid: null,
      checkoutPrice: placement.price,
      hasPendingBid: false,
    }));
  }

  const inventoryBySlug = new Map((inventory ?? []).map((row) => [row.slug, row]));
  const sponsorBySlug = new Map(
    (sponsorships ?? []).filter((row) => row.status === "paid").map((row) => [row.placement_slug, row]),
  );
  const now = Date.now();
  const pendingBySlug = new Set(
    (sponsorships ?? [])
      .filter((row) => row.status === "pending" && new Date(row.expires_at).getTime() > now)
      .map((row) => row.placement_slug),
  );

  return placements.map((placement) => {
    const row = inventoryBySlug.get(placement.slug);
    const sponsor = sponsorBySlug.get(placement.slug);
    const reservationExpired =
      row?.status === "reserved" &&
      row.reservation_expires_at &&
      new Date(row.reservation_expires_at).getTime() < Date.now();
    const effectiveBidAmountCents = sponsor
      ? getEffectiveBidAmountCents(Number(sponsor.amount_cents), placement.price * 100)
      : null;

    return {
      ...placement,
      status: sponsor ? "sold" : (reservationExpired ? "available" : (row?.status ?? "available")),
      sponsor: sponsor
        ? {
            projectName: sponsor.project_name,
            projectUrl: sponsor.project_url,
            tagline: sponsor.tagline,
            faviconUrl: sponsor.favicon_url,
            brandColor: sponsor.brand_color,
            xHandle: sponsor.x_handle,
          }
        : null,
      currentBid: effectiveBidAmountCents === null ? null : effectiveBidAmountCents / 100,
      checkoutPrice: sponsor
        ? getNextBidAmountCents(Number(sponsor.amount_cents), placement.price * 100) / 100
        : placement.price,
      hasPendingBid: pendingBySlug.has(placement.slug),
    } as PlacementWithState;
  });
}

function formatAuctionAge(createdAt: string) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

export async function getAuctionHistory(): Promise<AuctionBid[]> {
  const supabase = getSupabaseService();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("flight_sponsorships")
    .select("id,placement_slug,project_name,favicon_url,brand_color,amount_cents,status,created_at")
    .in("status", ["paid", "refunded", "outbid"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Unable to load auction history", error);
    return [];
  }

  return (data ?? []).flatMap((bid) => {
    const placement = getPlacement(bid.placement_slug);
    if (!placement || !["paid", "refunded", "outbid"].includes(bid.status)) return [];

    return [{
      id: bid.id,
      placementSlug: placement.slug,
      placementName: placement.name,
      tier: placement.tier,
      projectName: bid.project_name,
      faviconUrl: bid.favicon_url,
      brandColor: bid.brand_color,
      amount: getEffectiveBidAmountCents(Number(bid.amount_cents), placement.price * 100) / 100,
      timeLabel: formatAuctionAge(bid.created_at),
    }];
  });
}

export type CheckoutQuote = {
  amountCents: number;
  supersedesSponsorshipId: string | null;
  isOutbid: boolean;
};

export async function getCheckoutQuote(
  placementSlug: string,
  requestedAmountCents?: number,
): Promise<CheckoutQuote> {
  const placement = getPlacement(placementSlug);
  if (!placement) throw new Error("That placement does not exist.");

  const supabase = getSupabaseService();
  if (!supabase) throw new Error("Supabase is not configured.");

  const now = new Date().toISOString();
  await supabase
    .from("flight_sponsorships")
    .update({ status: "expired", updated_at: now })
    .eq("placement_slug", placementSlug)
    .eq("status", "pending")
    .lt("expires_at", now);

  const { data: sponsorships, error } = await supabase
    .from("flight_sponsorships")
    .select("id,amount_cents,status,expires_at")
    .eq("placement_slug", placementSlug)
    .in("status", ["paid", "pending"]);

  if (error) throw error;

  const pending = (sponsorships ?? []).find(
    (sponsorship) => sponsorship.status === "pending" && new Date(sponsorship.expires_at).getTime() > Date.now(),
  );
  if (pending) throw new Error("Another sponsor is checking out this position. Try again in a few minutes.");

  const currentSponsor = (sponsorships ?? []).find((sponsorship) => sponsorship.status === "paid");
  if (currentSponsor) {
    const minimumAmountCents = getNextBidAmountCents(
      Number(currentSponsor.amount_cents),
      placement.price * 100,
    );
    const amountCents = requestedAmountCents ?? minimumAmountCents;

    if (!Number.isInteger(amountCents) || amountCents % 100 !== 0) {
      throw new Error("Bids must be entered in whole-dollar amounts.");
    }
    if (amountCents < minimumAmountCents) {
      throw new Error(`The minimum outbid is $${minimumAmountCents / 100}.`);
    }
    if (amountCents > 500_000) {
      throw new Error("The maximum bid is $5,000.");
    }

    return {
      amountCents,
      supersedesSponsorshipId: currentSponsor.id,
      isOutbid: true,
    };
  }

  return {
    amountCents: placement.price * 100,
    supersedesSponsorshipId: null,
    isOutbid: false,
  };
}

type ReservationInput = {
  sessionId: string;
  placementSlug: string;
  projectName: string;
  projectUrl: string;
  tagline: string;
  faviconUrl: string | null;
  brandColor: string;
  xHandle: string | null;
  amountCents: number;
  expiresAt: Date;
  supersedesSponsorshipId: string | null;
};

export async function reservePlacement(input: ReservationInput) {
  const placement = getPlacement(input.placementSlug);
  if (!placement) throw new Error("That placement does not exist.");

  const supabase = getSupabaseService();
  if (!supabase) throw new Error("Supabase is not configured.");

  const now = new Date().toISOString();

  await supabase
    .from("flight_sponsorships")
    .update({ status: "expired", updated_at: now })
    .eq("placement_slug", input.placementSlug)
    .eq("status", "pending")
    .lt("expires_at", now);

  await supabase
    .from("flight_placements")
    .update({ status: "available", reservation_expires_at: null, updated_at: now })
    .eq("slug", input.placementSlug)
    .eq("status", "reserved")
    .lt("reservation_expires_at", now);

  if (input.supersedesSponsorshipId) {
    const { data: currentSponsor, error: currentSponsorError } = await supabase
      .from("flight_sponsorships")
      .select("id,amount_cents")
      .eq("id", input.supersedesSponsorshipId)
      .eq("placement_slug", input.placementSlug)
      .eq("status", "paid")
      .maybeSingle();

    if (currentSponsorError) throw currentSponsorError;
    if (!currentSponsor) throw new Error("That sponsor was already replaced. Refresh and try again.");
    const minimumAmountCents = getNextBidAmountCents(
      Number(currentSponsor.amount_cents),
      placement.price * 100,
    );
    if (
      !Number.isInteger(input.amountCents) ||
      input.amountCents % 100 !== 0 ||
      input.amountCents < minimumAmountCents ||
      input.amountCents > 500_000
    ) {
      throw new Error("The minimum outbid price changed. Refresh and try again.");
    }
  } else {
    const { data: reserved, error: reserveError } = await supabase
      .from("flight_placements")
      .update({
        status: "reserved",
        reservation_expires_at: input.expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("slug", input.placementSlug)
      .eq("status", "available")
      .select("slug")
      .maybeSingle();

    if (reserveError) throw reserveError;
    if (!reserved) throw new Error("This placement was just reserved by someone else.");
  }

  const { error: insertError } = await supabase.from("flight_sponsorships").insert({
    placement_slug: input.placementSlug,
    stripe_checkout_session_id: input.sessionId,
    project_name: input.projectName,
    project_url: input.projectUrl,
    tagline: input.tagline,
    favicon_url: input.faviconUrl,
    brand_color: input.brandColor,
    x_handle: input.xHandle,
    amount_cents: input.amountCents,
    status: "pending",
    expires_at: input.expiresAt.toISOString(),
    supersedes_sponsorship_id: input.supersedesSponsorshipId,
  });

  if (insertError) {
    if (!input.supersedesSponsorshipId) {
      await supabase
        .from("flight_placements")
        .update({ status: "available", reservation_expires_at: null, updated_at: new Date().toISOString() })
        .eq("slug", input.placementSlug)
        .eq("status", "reserved");
    }
    throw insertError;
  }
}

export type OutbidRefundTarget = {
  sponsorshipId: string;
  paymentIntentId: string | null;
  refundId: string | null;
};

export async function getOutbidRefundTarget(sessionId: string): Promise<OutbidRefundTarget | null> {
  const supabase = getSupabaseService();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: challenger, error: challengerError } = await supabase
    .from("flight_sponsorships")
    .select("supersedes_sponsorship_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (challengerError) throw challengerError;
  if (!challenger?.supersedes_sponsorship_id) return null;

  const { data: currentSponsor, error: currentSponsorError } = await supabase
    .from("flight_sponsorships")
    .select("id,stripe_payment_intent_id,stripe_refund_id,status")
    .eq("id", challenger.supersedes_sponsorship_id)
    .maybeSingle();

  if (currentSponsorError) throw currentSponsorError;
  if (!currentSponsor) throw new Error("The sponsor being outbid could not be found.");
  if (!["paid", "outbid", "refunded"].includes(currentSponsor.status)) {
    throw new Error("The sponsor being outbid is no longer eligible for replacement.");
  }

  return {
    sponsorshipId: currentSponsor.id,
    paymentIntentId: currentSponsor.stripe_payment_intent_id,
    refundId: currentSponsor.stripe_refund_id,
  };
}

export async function markSponsorshipPaid(
  sessionId: string,
  paymentIntent: string | null,
  refundId: string | null = null,
) {
  const supabase = getSupabaseService();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("promote_flight_sponsorship", {
    p_session_id: sessionId,
    p_payment_intent_id: paymentIntent,
    p_refund_id: refundId,
  });

  if (error) throw error;
}

export async function releaseSponsorship(sessionId: string) {
  const supabase = getSupabaseService();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: sponsorship, error } = await supabase
    .from("flight_sponsorships")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("stripe_checkout_session_id", sessionId)
    .eq("status", "pending")
    .select("placement_slug,supersedes_sponsorship_id")
    .maybeSingle();

  if (error) throw error;
  if (!sponsorship) return;
  if (sponsorship.supersedes_sponsorship_id) return;

  const { error: placementError } = await supabase
    .from("flight_placements")
    .update({ status: "available", reservation_expires_at: null, updated_at: new Date().toISOString() })
    .eq("slug", sponsorship.placement_slug)
    .eq("status", "reserved");

  if (placementError) throw placementError;
}
