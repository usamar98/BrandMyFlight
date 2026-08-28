"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  ExternalLink,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Megaphone,
  Plane,
  Sparkles,
  Stamp,
  Video,
  X,
} from "lucide-react";
import { type CSSProperties, FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { createCheckout } from "@/app/actions/create-checkout";
import { BrandLogo } from "@/components/brand-logo";
import { SmoothScroll } from "@/components/smooth-scroll";
import type { PlacementSlug, PlacementWithState } from "@/lib/placements";

type ProjectPreview = {
  url: string;
  name: string;
  tagline: string;
  faviconUrl: string | null;
  brandColor: string;
};

type VisitorCounts = {
  liveVisitors: number;
  totalVisitors: number;
};

type SponsorPreviews = Partial<Record<PlacementSlug, ProjectPreview>>;

const fleetLayout = [
  { side: "left", motion: 8, duration: 8.5 },
  { side: "right", motion: 7, duration: 9.2 },
  { side: "left", motion: 6, duration: 8.8 },
  { side: "right", motion: 6, duration: 9.8 },
  { side: "left", motion: 5, duration: 8.2 },
  { side: "right", motion: 5, duration: 9.4 },
  { side: "left", motion: 4, duration: 7.8 },
  { side: "right", motion: 4, duration: 8.7 },
  { side: "left", motion: 3, duration: 9.1 },
  { side: "right", motion: 3, duration: 8.4 },
] as const;

const benefits = [
  { icon: <Stamp />, title: "Digital Sponsor Pass", copy: "Your logo lives on the public campaign artwork and sponsor directory." },
  { icon: <Link2 />, title: "A real backlink", copy: "Your pass position links directly to your startup for the life of the campaign page." },
  { icon: <Megaphone />, title: "Launch placement", copy: "Your brand is included when the funded-flight campaign launches across social." },
  { icon: <Camera />, title: "Airport photographs", copy: "The Sponsor Pass travels with me and appears in airport and travel photographs." },
  { icon: <Video />, title: "Trip video or recap", copy: "Sponsors appear in the trip video, written recap, or both—based on the position." },
  { icon: <BadgeCheck />, title: "Public trip proof", copy: "A dated proof page closes the loop once the Lahore to New York flight happens." },
];

const proofSteps = [
  { number: "01", label: "Before takeoff", title: "The funded pass goes live", copy: "All ten positions, sponsor links, and the campaign total are published." },
  { number: "02", label: "At the airport", title: "Brands enter the frame", copy: "The fictional Sponsor Pass appears in travel photography without imitating a real boarding pass." },
  { number: "03", label: "Lahore → New York", title: "The story travels", copy: "Launch posts and travel updates carry the sponsor roster through the trip." },
  { number: "04", label: "After landing", title: "Proof, video, recap", copy: "A public recap documents that the flight happened and shows every delivered placement." },
];

export function SponsorSite({ placements }: { placements: PlacementWithState[] }) {
  const [selectedSlug, setSelectedSlug] = useState<PlacementSlug | null>(null);
  const [sponsorPreviews, setSponsorPreviews] = useState<SponsorPreviews>({});
  const [visitorCounts, setVisitorCounts] = useState<VisitorCounts>({ liveVisitors: 1, totalVisitors: 1 });
  const selectedPlacement = placements.find((placement) => placement.slug === selectedSlug) ?? null;
  const availableCount = placements.filter((placement) => placement.status === "available").length;
  const fundedTotal = placements
    .filter((placement) => placement.status === "sold")
    .reduce((total, placement) => total + (placement.currentBid ?? placement.price), 0);

  const handlePreviewChange = useCallback((slug: PlacementSlug, preview: ProjectPreview | null) => {
    setSponsorPreviews((current) => {
      if (preview) return { ...current, [slug]: preview };

      const next = { ...current };
      delete next[slug];
      return next;
    });
  }, []);

  const handleDrawerClose = useCallback(() => setSelectedSlug(null), []);

  useEffect(() => {
    let mounted = true;

    async function refreshVisitorCounts() {
      try {
        const response = await fetch("/api/visitors", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) return;

        const counts = (await response.json()) as VisitorCounts;
        if (mounted && Number.isFinite(counts.liveVisitors) && Number.isFinite(counts.totalVisitors)) {
          setVisitorCounts(counts);
        }
      } catch {
        // Keep the non-blocking first-visitor fallback when analytics is unavailable.
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshVisitorCounts();
    }

    void refreshVisitorCounts();
    const heartbeat = window.setInterval(refreshWhenVisible, 45_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      mounted = false;
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return (
    <main id="top">
      <SmoothScroll />
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="BrandMyFlight home">
          <BrandLogo />
        </a>
        <div className="nav-links">
          <a href="#sponsor-pass">Sponsor Pass</a>
          <a href="#benefits">What you get</a>
          <a href="#inventory">Positions</a>
          <a href="#proof">Proof plan</a>
        </div>
        <a className="nav-cta" href="#inventory">
          Buy a position <ArrowDownRight size={15} />
        </a>
      </nav>

      <section className="flight-hero">
        <HeroFleet
          placements={placements}
          previews={sponsorPreviews}
          selectedSlug={selectedSlug}
        />
        <div className="hero-copy">
          <motion.p className="eyebrow hero-visitors" aria-live="polite" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span><b>{visitorCounts.liveVisitors.toLocaleString()}</b> {visitorCounts.liveVisitors === 1 ? "person" : "people"} visiting this site now</span>
            <i aria-hidden="true" />
            <span><b>{visitorCounts.totalVisitors.toLocaleString()}</b> {visitorCounts.totalVisitors === 1 ? "visitor" : "visitors"} so far</span>
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            Your brand, <em>on my flight.</em>
          </motion.h1>
          <motion.p className="hero-subcopy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.65 }}>
            Your logo flies from Lahore to New York—on the Sponsor Pass, launch posts, airport photos, and trip recap.
          </motion.p>
          <div className="hero-progress" aria-label="Campaign summary">
            <strong>${fundedTotal.toLocaleString()} funded</strong>
            <i aria-hidden="true" />
            <span>{availableCount} unclaimed · all 10 open to bids</span>
          </div>
        </div>

        <motion.div
          className="pass-stage"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <SponsorPass placements={placements} previews={sponsorPreviews} onSelect={setSelectedSlug} />
          <p className="pass-stage-note"><Sparkles size={13} /> Tap any spot to claim or outbid it</p>
        </motion.div>
      </section>

      <section className="ticker" aria-hidden="true">
        <div>
          BRAND THE JOURNEY <Plane /> LHE → JFK <Plane /> TEN FOUNDERS <Plane /> ONE FLIGHT <Plane />
          BRAND THE JOURNEY <Plane /> LHE → JFK <Plane /> TEN FOUNDERS <Plane /> ONE FLIGHT <Plane />
        </div>
      </section>

      <section className="funding-section" id="funding">
        <div className="section-kicker"><span>01</span><p>The funding model</p></div>
        <div className="funding-intro">
          <p className="eyebrow">Transparent by design</p>
          <h2>A $750 flight,<br /><em>split ten ways.</em></h2>
          <p>Every position starts at a clear price. Once claimed, another builder can outbid it by at least $5 and raise their bid in $1 steps; the previous paid sponsor is automatically refunded.</p>
        </div>
        <div className="funding-grid">
          <FundingCard quantity="01" tier="Presenting" unit="$250" total="$250" className="funding-presenting" />
          <FundingCard quantity="02" tier="Premium" unit="$120 ea." total="$240" />
          <FundingCard quantity="03" tier="Medium" unit="$60 ea." total="$180" />
          <FundingCard quantity="04" tier="Small" unit="$20 ea." total="$80" />
          <div className="funding-total"><span>Starting total</span><strong>$750</strong><small>10 / 10 positions · outbids open</small></div>
        </div>
      </section>

      <section className="benefits-section" id="benefits">
        <div className="section-kicker light"><span>02</span><p>What every sponsor gets</p></div>
        <div className="benefits-head">
          <p className="eyebrow">More than a logo tile</p>
          <h2>Your brand joins<br /><em>the whole story.</em></h2>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <motion.article
              key={benefit.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.05 }}
            >
              <div><span>0{index + 1}</span>{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="inventory-section" id="inventory">
        <div className="section-kicker"><span>03</span><p>Live position inventory</p></div>
        <div className="inventory-head">
          <div><p className="eyebrow">Choose your place on the pass</p><h2>Ten positions.<br /><em>One brand each.</em></h2></div>
          <p>Claim an open position or outbid a current sponsor, add your startup URL and optional X handle, then continue to Stripe. Your logo, brand color, name, and tagline are fetched automatically.</p>
        </div>
        <div className="inventory-list">
          <div className="inventory-labels" aria-hidden="true">
            <span>No.</span><span>Position</span><span>Tier</span><span>Status</span><span>Price</span><span />
          </div>
          {placements.map((placement) => (
            <button
              className="inventory-row"
              type="button"
              key={placement.slug}
              onClick={() => setSelectedSlug(placement.slug)}
              aria-label={`${placement.name}, ${placement.status}, ${placement.status === "sold" ? `outbid from $${placement.checkoutPrice}` : `$${placement.price}`}`}
            >
              <span className="inventory-number">{placement.number}</span>
              <span className="inventory-title">
                <strong>{placement.sponsor?.projectName ?? placement.name}</strong>
                <small>{placement.sponsor?.tagline ?? placement.short}</small>
              </span>
              <span className="tier-pill">{placement.tier}</span>
              <span className={`status-pill status-${placement.status}`}>{placement.status === "sold" ? "outbid open" : placement.status}</span>
              <strong className="inventory-price">${placement.status === "sold" ? placement.checkoutPrice : placement.price}</strong>
              <ArrowDownRight size={19} />
            </button>
          ))}
        </div>
      </section>

      <section className="proof-section" id="proof">
        <div className="proof-copy">
          <div className="section-kicker light"><span>04</span><p>The proof plan</p></div>
          <p className="eyebrow">The campaign has an ending</p>
          <h2>From funded<br /><em>to flown.</em></h2>
          <p className="proof-lead">The promise is documented before, during, and after the journey—so sponsors can see exactly where their support went.</p>
          <div className="route-line" aria-hidden="true"><i /><span>LHE</span><b><Plane /></b><span>JFK</span><i /></div>
        </div>
        <div className="proof-list">
          {proofSteps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <div><small>{step.label}</small><h3>{step.title}</h3><p>{step.copy}</p></div>
              <Check />
            </article>
          ))}
        </div>
      </section>

      <section className="safety-section">
        <div className="safety-stamp"><Plane /><strong>SPONSOR<br />PASS</strong><span>PROMO / 01</span></div>
        <div>
          <p className="eyebrow">Designed to be obviously fictional</p>
          <h2>Campaign artwork.<br /><em>Never a travel document.</em></h2>
          <p>BrandMyFlight uses fictional “Indie Air” branding and contains no booking reference, passenger barcode, QR code, airline identity, or machine-readable travel data.</p>
          <strong>PROMOTIONAL DESIGN — NOT VALID FOR TRAVEL.</strong>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-kicker"><span>05</span><p>Questions</p></div>
        <h2>Before you<br /><em>come aboard.</em></h2>
        <div className="faq-list">
          <Faq question="Is this a real boarding pass?" answer="No. It is a fictional Sponsor Pass for a promotional campaign. It cannot be used for travel and deliberately includes no barcode, booking reference, or real airline branding." />
          <Faq question="What happens after I buy a position?" answer="Stripe confirms the payment, then the email on your Stripe receipt is used to coordinate your final logo artwork and campaign delivery. No BrandMyFlight account is created." />
          <Faq question="What happens if another brand outbids me?" answer="Every claimed position remains open to a bid at least $5 above the current amount. Challengers can add more in $1 steps. When the challenger pays successfully, your original Stripe payment is automatically refunded and the new brand takes the position." />
          <Faq question="Do all sponsors receive the same deliverables?" answer="Every sponsor receives the digital Sponsor Pass, backlink, launch placement, airport/travel photography, recap inclusion, and public proof. Larger positions receive more visual prominence; the presenting position also receives the leading campaign credit." />
          <Faq question="What if the trip changes?" answer="If practical travel details shift, sponsors receive an updated delivery schedule. If the campaign cannot be completed, the terms provide for a replacement of equal value or a refund." />
          <Faq question="Can any startup sponsor the flight?" answer="Sponsors are reviewed for fit and safety. Fraudulent, unlawful, misleading, infringing, or travel-confusing artwork can be rejected and refunded." />
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">Lahore → New York · BUILD001</p>
        <h2>Put your logo<br /><em>in motion.</em></h2>
        <a href="#inventory">Choose a position <ArrowRight /></a>
        <div className="final-plane" aria-hidden="true"><Plane /></div>
      </section>

      <footer>
        <div>
          <a className="wordmark" href="#top" aria-label="BrandMyFlight home"><BrandLogo /></a>
          <p>Ten brands funding one founder flight.<br />Lahore → New York.</p>
        </div>
        <div><span>Explore</span><a href="#sponsor-pass">Sponsor Pass</a><a href="#inventory">Positions</a><a href="#proof">Proof plan</a></div>
        <div><span>Details</span><a href="/privacy">Privacy</a><a href="/terms">Sponsor terms</a></div>
        <div><span>Follow</span><a href="https://x.com" target="_blank" rel="noreferrer">X / Twitter <ExternalLink size={10} /></a><a href="mailto:hello@brandmyflight.com">Email <ExternalLink size={10} /></a></div>
        <p className="footer-base">© 2026 BrandMyFlight · Promotional design — not valid for travel.</p>
      </footer>

      <AnimatePresence>
        {selectedPlacement ? (
          <SponsorDrawer
            key={selectedPlacement.slug}
            placement={selectedPlacement}
            initialPreview={sponsorPreviews[selectedPlacement.slug] ?? null}
            onPreviewChange={handlePreviewChange}
            onClose={handleDrawerClose}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function HeroFleet({
  placements,
  previews,
  selectedSlug,
}: {
  placements: PlacementWithState[];
  previews: SponsorPreviews;
  selectedSlug: PlacementSlug | null;
}) {
  return (
    <div className="hero-fleet" aria-hidden="true">
      {placements.map((placement, index) => {
        const layout = fleetLayout[index];
        const preview = previews[placement.slug];
        const brandName = preview?.name ?? placement.sponsor?.projectName ?? "YOUR BRAND";
        const faviconUrl = preview?.faviconUrl ?? placement.sponsor?.faviconUrl ?? null;
        const tagline = preview?.tagline ?? placement.sponsor?.tagline ?? "Your idea deserves the window seat.";
        const brandColor = preview?.brandColor ?? placement.sponsor?.brandColor ?? "#f3f0e7";
        const xHandle = placement.sponsor?.xHandle ?? null;
        const isBranded = Boolean(preview || placement.sponsor);
        const horizontalMotion = layout.side === "left" ? layout.motion : -layout.motion;

        return (
          <div
            className={`hero-plane hero-plane-${layout.side} hero-plane-${placement.tier}`}
            data-active={selectedSlug === placement.slug}
            data-branded={isBranded}
            key={placement.slug}
          >
            <motion.div
              className="hero-plane-flight"
              animate={{
                x: [0, horizontalMotion, -horizontalMotion * 0.45, 0],
                y: [0, -layout.motion, layout.motion * 0.5, 0],
                rotate: [0, layout.side === "left" ? 1.8 : -1.8, 0],
              }}
              transition={{
                duration: layout.duration,
                delay: index * 0.17,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <SponsorPlane
                brandName={brandName}
                faviconUrl={faviconUrl}
                tagline={tagline}
                brandColor={brandColor}
                xHandle={xHandle}
                number={placement.number}
                isBranded={isBranded}
              />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function SponsorPlane({
  brandName,
  faviconUrl,
  tagline,
  brandColor,
  xHandle,
  number,
  isBranded,
}: {
  brandName: string;
  faviconUrl: string | null;
  tagline: string;
  brandColor: string;
  xHandle: string | null;
  number: string;
  isBranded: boolean;
}) {
  const shortName = brandName.toUpperCase().slice(0, 18);
  const shortHandle = (xHandle ?? "SPONSORED BUILDER").toUpperCase().slice(0, 25);
  const shortTagline = tagline.slice(0, 48);
  const inkColor = getContrastColor(brandColor);
  const wingLogos = [
    { x: 101, y: 82, rotation: 18 },
    { x: 258, y: 178, rotation: 18 },
  ];

  return (
    <svg
      className="sponsor-plane"
      viewBox="0 0 360 250"
      focusable="false"
      style={{ "--plane-color": brandColor, "--plane-ink": inkColor } as CSSProperties}
    >
      <title>{`${brandName} sponsor plane`}</title>
      <ellipse className="plane-shadow" cx="180" cy="221" rx="128" ry="12" transform="rotate(-8 180 221)" />

      <path className="plane-shape plane-left-wing" d="M184 112L63 61L48 76L159 139L211 123Z" />
      <path className="plane-shape plane-right-wing" d="M194 122L274 217Q280 224 289 218L296 211L230 91Z" />
      <path className="plane-shape plane-left-tail" d="M108 177L42 194L58 208L132 188Z" />
      <path className="plane-shape plane-right-tail" d="M119 181L135 231L150 223L146 167Z" />

      <path className="plane-shape plane-engine" d="M91 67L105 53L119 65L117 78Z" />
      <path className="plane-shape plane-engine" d="M139 87L153 72L168 86L163 101Z" />
      <path className="plane-shape plane-engine" d="M251 151L270 151L277 168L263 175Z" />
      <path className="plane-shape plane-engine" d="M268 181L287 181L295 198L280 205Z" />

      <path
        className="plane-shape plane-fuselage"
        d="M82 211Q77 205 83 198L159 128L284 28Q304 12 319 18Q333 25 321 43L216 156L111 219Q93 229 82 211Z"
      />
      <path className="plane-outline-detail" d="M91 205L166 136M294 31Q306 25 316 28M112 197L128 181M164 143L180 127" />
      <path className="plane-cockpit" d="M292 31Q307 20 318 25L308 39Z" />
      <path className="plane-window-row" d="M231 82L281 41" />

      {isBranded && faviconUrl
        ? wingLogos.map((logo, index) => (
            <g key={logo.x} transform={`rotate(${logo.rotation} ${logo.x} ${logo.y})`}>
              <rect className="plane-logo-panel" x={logo.x - 19} y={logo.y - 19} width="38" height="38" rx="9" />
              <image href={faviconUrl} x={logo.x - 14} y={logo.y - 14} width="28" height="28" preserveAspectRatio="xMidYMid meet" />
              <text className="plane-wing-label" x={logo.x} y={logo.y + 29} textAnchor="middle">{index === 0 ? "LEFT WING" : "RIGHT WING"}</text>
            </g>
          ))
        : null}

      <g className="plane-copy" transform="rotate(-38 207 112)">
        <rect x="128" y="88" width="158" height="51" rx="10" />
        <text className="plane-brand-name" x="207" y="105" textAnchor="middle">{shortName}</text>
        <text className="plane-brand-handle" x="207" y="117" textAnchor="middle">{shortHandle}</text>
        <text className="plane-brand-tagline" x="207" y="130" textAnchor="middle">{shortTagline}</text>
      </g>

      <g className="plane-slot" transform="rotate(-38 112 188)">
        <circle className="plane-slot-badge" cx="112" cy="188" r="15" />
        <text className="plane-position-number" x="112" y="192" textAnchor="middle">#{number}</text>
      </g>
    </svg>
  );
}

function getContrastColor(hex: string) {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#c8ff25";
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 145 ? "#11110f" : "#fffdf4";
}

function SponsorPass({
  placements,
  previews,
  onSelect,
}: {
  placements: PlacementWithState[];
  previews: SponsorPreviews;
  onSelect: (slug: PlacementSlug) => void;
}) {
  return (
    <article className="sponsor-pass" id="sponsor-pass" aria-label="Interactive fictional Indie Air Sponsor Pass">
      <header className="pass-header">
        <div className="indie-air"><span><Plane /></span><div><strong>INDIE AIR</strong><small>BUILDERS IN MOTION</small></div></div>
        <div className="pass-type"><small>CAMPAIGN ARTWORK</small><strong>SPONSOR PASS</strong></div>
      </header>
      <div className="pass-warning">PROMOTIONAL DESIGN — NOT VALID FOR TRAVEL</div>
      <div className="pass-route">
        <div><small>FROM / لاہور</small><strong>LHE</strong><span>Lahore, Pakistan</span></div>
        <div className="route-flight"><i /><Plane /><i /></div>
        <div><small>TO / NEW YORK</small><strong>JFK</strong><span>New York, USA</span></div>
      </div>
      <dl className="pass-details">
        <div><dt>Passenger</dt><dd>Sponsored Founder</dd></div>
        <div><dt>Flight</dt><dd>BUILD001</dd></div>
        <div><dt>Seat</dt><dd>1A</dd></div>
        <div><dt>Status</dt><dd>Funded by builders</dd></div>
      </dl>
      <div className="pass-sponsors">
        {placements.map((placement) => {
          const preview = previews[placement.slug];
          const sponsorName = preview?.name ?? placement.sponsor?.projectName;
          const faviconUrl = preview?.faviconUrl ?? placement.sponsor?.faviconUrl;
          const tagline = preview?.tagline ?? placement.sponsor?.tagline;
          const brandColor = preview?.brandColor ?? placement.sponsor?.brandColor ?? "#c8ff25";
          const brandInk = getContrastColor(brandColor);
          return (
            <button
              type="button"
              className={`pass-slot pass-slot-${placement.tier}`}
              data-status={placement.status}
              key={placement.slug}
              onClick={() => onSelect(placement.slug)}
              aria-label={`Open ${placement.name}, $${placement.price}, ${placement.status}`}
              data-branded={Boolean(sponsorName)}
              style={{ "--slot-brand": brandColor, "--slot-ink": brandInk } as CSSProperties}
            >
              <span className="pass-slot-meta">{placement.number} · {placement.tier}</span>
              <div className="pass-brand">
                <span
                  className="pass-brand-mark"
                  style={faviconUrl ? { backgroundImage: `url(${faviconUrl})` } : undefined}
                >
                  {faviconUrl ? null : sponsorName?.slice(0, 1) ?? "+"}
                </span>
                <span className="pass-brand-copy">
                  <strong>{sponsorName ?? "YOUR BRAND"}</strong>
                  <small>{tagline ?? placement.short}</small>
                </span>
              </div>
              <span className="pass-slot-foot">
                {placement.status === "available"
                  ? `Available · $${placement.price}`
                  : placement.status === "sold"
                    ? `Outbid · $${placement.checkoutPrice}`
                    : "Checkout active"}
              </span>
            </button>
          );
        })}
      </div>
      <footer className="pass-footer">
        <span>INDIE AIR / SPONSOR CAMPAIGN 01</span>
        <strong>NO BARCODE · NO BOOKING REFERENCE · NOT A TRAVEL DOCUMENT</strong>
        <span>PROMO / 01 OF 01</span>
      </footer>
    </article>
  );
}

function FundingCard({ quantity, tier, unit, total, className = "" }: { quantity: string; tier: string; unit: string; total: string; className?: string }) {
  return <div className={`funding-card ${className}`}><span>{quantity}</span><div><small>{tier}</small><strong>{unit}</strong></div><b>{total}</b></div>;
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return <details><summary><span>{question}</span><i><ChevronDown /></i></summary><p>{answer}</p></details>;
}

function SponsorDrawer({
  placement,
  initialPreview,
  onPreviewChange,
  onClose,
}: {
  placement: PlacementWithState;
  initialPreview: ProjectPreview | null;
  onPreviewChange: (slug: PlacementSlug, preview: ProjectPreview | null) => void;
  onClose: () => void;
}) {
  const [startupUrl, setStartupUrl] = useState(initialPreview?.url ?? "");
  const [xHandle, setXHandle] = useState("");
  const [preview, setPreview] = useState<ProjectPreview | null>(initialPreview);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [bidAmount, setBidAmount] = useState(placement.checkoutPrice);
  const [isPending, startTransition] = useTransition();
  const isOutbid = placement.status === "sold" && Boolean(placement.sponsor);
  const canCheckout = placement.status === "available" || (isOutbid && !placement.hasPendingBid);

  useEffect(() => {
    document.body.classList.add("drawer-open");
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.classList.remove("drawer-open");
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (startupUrl.trim().length < 4) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsPreviewing(true);
      setPreviewError("");
      try {
        const response = await fetch("/api/project-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: startupUrl }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to read that website.");
        setPreview(data);
        onPreviewChange(placement.slug, data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPreview(null);
        onPreviewChange(placement.slug, null);
        setPreviewError(error instanceof Error ? error.message : "Unable to read that website.");
      } finally {
        if (!controller.signal.aborted) setIsPreviewing(false);
      }
    }, 700);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [onPreviewChange, placement.slug, startupUrl]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError("");
    startTransition(async () => {
      const result = await createCheckout({
        placementSlug: placement.slug,
        startupUrl,
        xHandle,
        bidAmount: isOutbid ? bidAmount : undefined,
      });
      if (result.url) window.location.assign(result.url);
      else setCheckoutError(result.error ?? "Unable to start checkout.");
    });
  }

  return (
    <motion.div
      className="drawer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
    >
      <motion.aside
        className="sponsor-drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        aria-modal="true"
        role="dialog"
        aria-labelledby="drawer-title"
      >
        <button className="drawer-close" type="button" onClick={onClose} aria-label="Close sponsorship panel"><X /></button>
        <div className="drawer-head">
          <p className="eyebrow">POSITION {placement.number} · {placement.tier.toUpperCase()}</p>
          <h2 id="drawer-title">{placement.name}</h2>
          <p>{placement.description}</p>
        </div>
        <dl className="drawer-specs">
          <div><dt>Pass format</dt><dd>{placement.format}</dd></div>
          <div><dt>Visibility</dt><dd>{placement.exposure}</dd></div>
          <div><dt>{isOutbid ? "Next minimum bid" : "Starting price"}</dt><dd>${placement.checkoutPrice} USD</dd></div>
        </dl>

        {isOutbid && placement.sponsor ? (
          <div
            className="current-holder-card"
            style={{
              "--holder-color": placement.sponsor.brandColor,
              "--holder-ink": getContrastColor(placement.sponsor.brandColor),
            } as CSSProperties}
          >
            <div
              className="current-holder-logo"
              style={{
                backgroundColor: placement.sponsor.brandColor,
                ...(placement.sponsor.faviconUrl ? { backgroundImage: `url(${placement.sponsor.faviconUrl})` } : {}),
              }}
            >
              {placement.sponsor.faviconUrl ? null : placement.sponsor.projectName.slice(0, 1)}
            </div>
            <div>
              <span>Current sponsor · ${placement.currentBid}</span>
              <strong>{placement.sponsor.projectName}</strong>
              <p>{placement.sponsor.tagline}</p>
            </div>
          </div>
        ) : null}

        {canCheckout ? (
          <form onSubmit={handleSubmit} className="sponsor-form">
            {isOutbid ? (
              <div className="bid-builder">
                <div>
                  <span>Your outbid</span>
                  <strong aria-live="polite">${bidAmount}</strong>
                  <small>Starts $5 above the current bid. Add more in $1 steps.</small>
                </div>
                <button
                  type="button"
                  onClick={() => setBidAmount((amount) => Math.min(amount + 1, 5_000))}
                  disabled={bidAmount >= 5_000}
                  aria-label="Add one dollar to your bid"
                >
                  <b>+</b><span>$1</span>
                </button>
              </div>
            ) : null}
            <label>
              <span>{isOutbid ? "Challenger startup URL" : "Startup URL"}</span>
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="yourstartup.com"
                value={startupUrl}
                onChange={(event) => {
                  const value = event.target.value;
                  setStartupUrl(value);
                  if (value.trim().length < 4) {
                    setPreview(null);
                    onPreviewChange(placement.slug, null);
                    setPreviewError("");
                    setIsPreviewing(false);
                  }
                }}
                required
              />
              <small>We fetch your startup name, logo, brand color, and tagline automatically.</small>
            </label>
            <label>
              <span>X handle <i>optional</i></span>
              <input type="text" autoComplete="off" placeholder="@yourstartup" value={xHandle} onChange={(event) => setXHandle(event.target.value)} />
            </label>

            {isPreviewing || preview || previewError ? (
              <div
                className={`brand-preview ${preview ? "brand-preview-ready" : ""}`}
                style={preview ? {
                  "--preview-color": preview.brandColor,
                  "--preview-ink": getContrastColor(preview.brandColor),
                } as CSSProperties : undefined}
              >
                {isPreviewing ? <><LoaderCircle className="spin" /><span>Reading your website…</span></> : null}
                {!isPreviewing && preview ? (
                  <>
                    <div
                      className="brand-favicon"
                      style={{
                        backgroundColor: preview.brandColor,
                        ...(preview.faviconUrl ? { backgroundImage: `url(${preview.faviconUrl})` } : {}),
                      }}
                    >
                      {preview.faviconUrl ? null : preview.name.slice(0, 1)}
                    </div>
                    <div><strong>{preview.name}</strong><p>{preview.tagline}</p></div>
                  </>
                ) : null}
                {previewError ? <span className="form-error">{previewError}</span> : null}
              </div>
            ) : null}

            {checkoutError ? <p className="checkout-error">{checkoutError}</p> : null}
            <button className="checkout-button" type="submit" disabled={isPending || isPreviewing || !preview}>
              <span>{isPending ? "Opening secure checkout…" : isOutbid ? `Outbid · $${bidAmount}` : `Continue to Stripe · $${placement.checkoutPrice}`}</span>
              {isPending ? <LoaderCircle className="spin" /> : <ArrowRight />}
            </button>
            <p className="stripe-note">
              <LockKeyhole size={13} />
              {isOutbid
                ? "Your payment replaces this sponsor; their real Stripe payment is automatically refunded. Demo entries have no charge to refund."
                : "Stripe asks for your receipt email next. No BrandMyFlight account is created."}
            </p>
          </form>
        ) : (
          <div className="unavailable-panel">
            <strong>{placement.hasPendingBid ? "An outbid checkout is in progress." : `This position is ${placement.status}.`}</strong>
            <p>{placement.hasPendingBid ? "Try again in a few minutes if the challenger does not finish payment." : "Choose another position from the live inventory."}</p>
            <button type="button" onClick={onClose}>Back to positions</button>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}
