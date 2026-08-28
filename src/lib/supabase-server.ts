import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { placements, type PlacementWithState } from "@/lib/placements";

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
    return placements.map((placement) => ({ ...placement, status: "available", sponsor: null }));
  }

  const [{ data: inventory, error: inventoryError }, { data: sponsorships, error: sponsorshipError }] =
    await Promise.all([
      supabase.from("flight_placements").select("slug,status,reservation_expires_at"),
      supabase
        .from("flight_sponsorships")
        .select("placement_slug,project_name,project_url,tagline,favicon_url,x_handle,status")
        .eq("status", "paid"),
    ]);

  if (inventoryError || sponsorshipError) {
    console.error("Unable to load placement inventory", inventoryError ?? sponsorshipError);
    return placements.map((placement) => ({ ...placement, status: "available", sponsor: null }));
  }

  const inventoryBySlug = new Map((inventory ?? []).map((row) => [row.slug, row]));
  const sponsorBySlug = new Map((sponsorships ?? []).map((row) => [row.placement_slug, row]));

  return placements.map((placement) => {
    const row = inventoryBySlug.get(placement.slug);
    const sponsor = sponsorBySlug.get(placement.slug);
    const reservationExpired =
      row?.status === "reserved" &&
      row.reservation_expires_at &&
      new Date(row.reservation_expires_at).getTime() < Date.now();

    return {
      ...placement,
      status: reservationExpired ? "available" : (row?.status ?? "available"),
      sponsor: sponsor
        ? {
            projectName: sponsor.project_name,
            projectUrl: sponsor.project_url,
            tagline: sponsor.tagline,
            faviconUrl: sponsor.favicon_url,
            xHandle: sponsor.x_handle,
          }
        : null,
    } as PlacementWithState;
  });
}

type ReservationInput = {
  sessionId: string;
  placementSlug: string;
  projectName: string;
  projectUrl: string;
  tagline: string;
  faviconUrl: string | null;
  xHandle: string | null;
  amountCents: number;
  expiresAt: Date;
};

export async function reservePlacement(input: ReservationInput) {
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

  const { error: insertError } = await supabase.from("flight_sponsorships").insert({
    placement_slug: input.placementSlug,
    stripe_checkout_session_id: input.sessionId,
    project_name: input.projectName,
    project_url: input.projectUrl,
    tagline: input.tagline,
    favicon_url: input.faviconUrl,
    x_handle: input.xHandle,
    amount_cents: input.amountCents,
    status: "pending",
    expires_at: input.expiresAt.toISOString(),
  });

  if (insertError) {
    await supabase
      .from("flight_placements")
      .update({ status: "available", reservation_expires_at: null, updated_at: new Date().toISOString() })
      .eq("slug", input.placementSlug)
      .eq("status", "reserved");
    throw insertError;
  }
}

export async function markSponsorshipPaid(sessionId: string, paymentIntent: string | null) {
  const supabase = getSupabaseService();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: sponsorship, error } = await supabase
    .from("flight_sponsorships")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntent,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_checkout_session_id", sessionId)
    .select("placement_slug")
    .maybeSingle();

  if (error) throw error;
  if (!sponsorship) return;

  const { error: placementError } = await supabase
    .from("flight_placements")
    .update({ status: "sold", reservation_expires_at: null, updated_at: new Date().toISOString() })
    .eq("slug", sponsorship.placement_slug);

  if (placementError) throw placementError;
}

export async function releaseSponsorship(sessionId: string) {
  const supabase = getSupabaseService();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: sponsorship, error } = await supabase
    .from("flight_sponsorships")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("stripe_checkout_session_id", sessionId)
    .eq("status", "pending")
    .select("placement_slug")
    .maybeSingle();

  if (error) throw error;
  if (!sponsorship) return;

  const { error: placementError } = await supabase
    .from("flight_placements")
    .update({ status: "available", reservation_expires_at: null, updated_at: new Date().toISOString() })
    .eq("slug", sponsorship.placement_slug)
    .eq("status", "reserved");

  if (placementError) throw placementError;
}
