"use client";

import { ArrowDownRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { AuctionBid, PlacementSlug, PlacementWithState } from "@/lib/placements";

type AuctionTab = "spots" | "history";
type AuctionSort = "newest" | "highest";
type TierFilter = "all" | PlacementWithState["tier"];

export function AuctionSection({
  placements,
  history,
  onSelect,
}: {
  placements: PlacementWithState[];
  history: AuctionBid[];
  onSelect: (slug: PlacementSlug) => void;
}) {
  const [tab, setTab] = useState<AuctionTab>("spots");
  const [tier, setTier] = useState<TierFilter>("all");
  const [sort, setSort] = useState<AuctionSort>("newest");

  const visibleSpots = useMemo(() => {
    const filtered = tier === "all"
      ? placements
      : placements.filter((placement) => placement.tier === tier);
    if (sort === "newest") return filtered;
    return [...filtered].sort(
      (left, right) => (right.currentBid ?? right.price) - (left.currentBid ?? left.price),
    );
  }, [placements, sort, tier]);

  const visibleHistory = useMemo(() => {
    const filtered = tier === "all"
      ? history
      : history.filter((bid) => bid.tier === tier);
    if (sort === "newest") return filtered;
    return [...filtered].sort((left, right) => right.amount - left.amount);
  }, [history, sort, tier]);

  return (
    <section className="auction-section" id="auction">
      <div className="auction-shell">
        <header className="auction-head">
          <p className="eyebrow">Live sponsor board</p>
          <h2>The auction, live.</h2>
          <p>Every spot shows its current top bid.</p>
          <small>Spots start at $20 Small · $60 Medium · $120 Premium · $250 Presenting.</small>
        </header>

        <div className="auction-tabs" role="tablist" aria-label="Auction view">
          <button type="button" role="tab" aria-selected={tab === "spots"} onClick={() => setTab("spots")}>Spots</button>
          <button type="button" role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}>History ({history.length})</button>
        </div>

        <div className="auction-controls">
          <label>
            <span className="sr-only">Filter auction by tier</span>
            <select value={tier} onChange={(event) => setTier(event.target.value as TierFilter)}>
              <option value="all">All spots</option>
              <option value="presenting">Presenting</option>
              <option value="premium">Premium</option>
              <option value="medium">Medium</option>
              <option value="small">Small</option>
            </select>
          </label>
          <div className="auction-sort" aria-label="Sort auction rows">
            <button type="button" aria-pressed={sort === "newest"} onClick={() => setSort("newest")}>Newest</button>
            <button type="button" aria-pressed={sort === "highest"} onClick={() => setSort("highest")}>Highest</button>
          </div>
        </div>

        <div className="auction-list" role="tabpanel">
          {tab === "spots" ? visibleSpots.map((placement) => (
            <button
              className="auction-row"
              type="button"
              key={placement.slug}
              onClick={() => onSelect(placement.slug)}
              aria-label={`Open ${placement.name}, ${placement.status === "sold" ? `top bid $${placement.currentBid}` : `starts at $${placement.price}`}`}
            >
              <AuctionMark
                brandColor={placement.sponsor?.brandColor ?? "#f3f0e7"}
                faviconUrl={placement.sponsor?.faviconUrl ?? null}
                fallback={placement.number}
              />
              <span className="auction-row-copy">
                <strong>{placement.sponsor?.projectName ?? placement.name}</strong>
                <small>· {placement.tier} · position {placement.number}</small>
              </span>
              <strong className="auction-amount">${(placement.currentBid ?? placement.price).toLocaleString()}</strong>
              <span className="auction-row-state">{placement.status === "sold" ? "Top bid" : placement.status === "reserved" ? "Checkout" : "Open"}</span>
              <ArrowDownRight aria-hidden="true" />
            </button>
          )) : null}

          {tab === "history" ? visibleHistory.map((bid) => (
            <button
              className="auction-row"
              type="button"
              key={bid.id}
              onClick={() => onSelect(bid.placementSlug)}
              aria-label={`${bid.projectName} bid $${bid.amount} on ${bid.placementName}`}
            >
              <AuctionMark brandColor={bid.brandColor} faviconUrl={bid.faviconUrl} fallback={bid.projectName.slice(0, 1)} />
              <span className="auction-row-copy">
                <strong>{bid.projectName}</strong>
                <small>· {bid.placementName}</small>
              </span>
              <strong className="auction-amount">${bid.amount.toLocaleString()}</strong>
              <span className="auction-row-state">{bid.timeLabel}</span>
              <ArrowDownRight aria-hidden="true" />
            </button>
          )) : null}

          {tab === "history" && visibleHistory.length === 0 ? (
            <div className="auction-empty">
              <strong>No bids yet.</strong>
              <span>The first completed sponsorship will appear here.</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AuctionMark({
  brandColor,
  faviconUrl,
  fallback,
}: {
  brandColor: string;
  faviconUrl: string | null;
  fallback: string;
}) {
  return (
    <span
      className="auction-mark"
      style={{
        backgroundColor: brandColor,
        ...(faviconUrl ? { backgroundImage: `url(${faviconUrl})` } : {}),
      }}
      aria-hidden="true"
    >
      {faviconUrl ? null : fallback}
    </span>
  );
}
