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
import { FormEvent, useCallback, useEffect, useId, useState, useTransition } from "react";
import { createCheckout } from "@/app/actions/create-checkout";
import { BrandLogo } from "@/components/brand-logo";
import { SmoothScroll } from "@/components/smooth-scroll";
import type { PlacementSlug, PlacementWithState } from "@/lib/placements";

type ProjectPreview = {
  url: string;
  name: string;
  tagline: string;
  faviconUrl: string | null;
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
    .reduce((total, placement) => total + placement.price, 0);

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
            <span>{availableCount} of 10 spots available</span>
          </div>
        </div>

        <motion.div
          className="pass-stage"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <SponsorPass placements={placements} previews={sponsorPreviews} onSelect={setSelectedSlug} />
          <p className="pass-stage-note"><Sparkles size={13} /> Tap any spot to claim it</p>
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
          <p>One presenting partner leads the campaign. Nine more brands join at clear, fixed prices—no bidding, hidden fees, or fake scarcity.</p>
        </div>
        <div className="funding-grid">
          <FundingCard quantity="01" tier="Presenting" unit="$250" total="$250" className="funding-presenting" />
          <FundingCard quantity="02" tier="Premium" unit="$120 ea." total="$240" />
          <FundingCard quantity="03" tier="Medium" unit="$60 ea." total="$180" />
          <FundingCard quantity="04" tier="Small" unit="$20 ea." total="$80" />
          <div className="funding-total"><span>Possible total</span><strong>$750</strong><small>10 / 10 positions</small></div>
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
          <p>Pick a position, add your startup URL and optional X handle, then continue to Stripe. Your favicon, startup name, and tagline are fetched automatically.</p>
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
              aria-label={`${placement.name}, ${placement.status}, $${placement.price}`}
            >
              <span className="inventory-number">{placement.number}</span>
              <span className="inventory-title">
                <strong>{placement.sponsor?.projectName ?? placement.name}</strong>
                <small>{placement.sponsor?.tagline ?? placement.short}</small>
              </span>
              <span className="tier-pill">{placement.tier}</span>
              <span className={`status-pill status-${placement.status}`}>{placement.status}</span>
              <strong className="inventory-price">${placement.price}</strong>
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
                number={placement.number}
                side={layout.side}
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
  number,
  side,
}: {
  brandName: string;
  faviconUrl: string | null;
  number: string;
  side: "left" | "right";
}) {
  const paintId = useId().replaceAll(":", "");
  const bodyGradientId = `${paintId}-body`;
  const wingGradientId = `${paintId}-wing`;
  const metalGradientId = `${paintId}-metal`;
  const fuselageClipId = `${paintId}-fuselage`;
  const planeTransform = side === "right" ? "translate(360 0) scale(-1 1)" : undefined;
  const shortName = brandName.toUpperCase().slice(0, 16);
  const sponsorLabel = side === "left"
    ? { x: 211, y: 108, rotation: -31 }
    : { x: 149, y: 108, rotation: 31 };
  const wingLogo = side === "left"
    ? { x: 262, y: 157, rotation: 45 }
    : { x: 98, y: 157, rotation: -45 };
  const slotBadge = side === "left"
    ? { x: 91, y: 159, rotation: -16 }
    : { x: 269, y: 159, rotation: 16 };
  const fuselagePath = "M48 164C84 157 119 141 151 121L299 27C317 15 337 14 346 21C352 29 346 41 333 50L191 145C150 172 107 186 65 188C54 188 47 181 46 173C45 168 46 166 48 164Z";

  return (
    <svg className="sponsor-plane" viewBox="0 0 360 220" focusable="false">
      <defs>
        <linearGradient id={bodyGradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="0.5" stopColor="#f0ecdf" />
          <stop offset="1" stopColor="#bdb7a9" />
        </linearGradient>
        <linearGradient id={wingGradientId} x1="0" x2="0.9" y1="0" y2="1">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="0.72" stopColor="#d8d2c5" />
          <stop offset="1" stopColor="#aaa497" />
        </linearGradient>
        <linearGradient id={metalGradientId} x1="0" x2="1">
          <stop offset="0" stopColor="#1b1b18" />
          <stop offset="0.48" stopColor="#f5f1e6" />
          <stop offset="1" stopColor="#55544e" />
        </linearGradient>
        <clipPath id={fuselageClipId}>
          <path d={fuselagePath} />
        </clipPath>
      </defs>

      <ellipse className="plane-shadow" cx="180" cy="190" rx="126" ry="14" transform="rotate(-8 180 190)" />
      <g transform={planeTransform}>
        <path
          className="plane-far-wing"
          d="M182 96L60 62L38 73L157 119L207 101Z"
          fill={`url(#${wingGradientId})`}
        />
        <path className="plane-far-wing-accent" d="M61 63L38 73L158 119L171 114Z" />
        <path className="plane-panel-line" d="M66 72L159 110M93 75L101 88M124 84L130 99M154 92L158 107" />
        <path className="plane-far-engine" d="M99 73C104 63 115 63 123 76L118 82L103 79Z" />
        <path className="plane-far-engine" d="M161 89C166 79 178 80 185 94L179 100L165 96Z" />

        <path
          className="plane-near-wing"
          d="M187 119L273 204C280 211 290 209 295 202C298 198 296 192 294 187L248 100Z"
          fill={`url(#${wingGradientId})`}
        />
        <path className="plane-wing-wrap" d="M224 132L274 185L292 180L251 105Z" />
        <path className="plane-wing-tip" d="M273 204C280 211 290 209 295 202L292 188L280 193Z" />
        <path className="plane-panel-line" d="M202 120L280 196M226 116L291 183M244 123L232 144M256 146L247 161M270 169L261 179" />

        <g className="plane-engine-pod">
          <path d="M248 118C259 113 273 119 276 129L277 142C276 151 267 154 258 148L251 137Z" fill={`url(#${metalGradientId})`} />
          <ellipse cx="272" cy="132" rx="5" ry="9" />
          <path className="plane-engine-detail" d="M255 121L261 146" />
        </g>
        <g className="plane-engine-pod">
          <path d="M273 145C285 140 298 147 300 157L299 170C297 178 287 181 279 174L274 164Z" fill={`url(#${metalGradientId})`} />
          <ellipse cx="296" cy="160" rx="5" ry="9" />
          <path className="plane-engine-detail" d="M280 148L284 173" />
        </g>

        <path
          className="plane-rear-stabilizer"
          d="M83 151L18 171L59 190L128 161Z"
          fill={`url(#${wingGradientId})`}
        />
        <path className="plane-tail-accent" d="M18 171L59 190L76 183L38 169Z" />
        <path className="plane-panel-line" d="M35 173L76 183M57 164L96 174" />

        <path
          className="plane-vertical-tail"
          d="M91 156L65 83C62 73 70 67 79 72L153 126L131 157Z"
          fill={`url(#${wingGradientId})`}
        />
        <path className="plane-tail-wrap" d="M66 85C63 75 70 68 79 72L101 89L89 130Z" />
        <path className="plane-panel-line" d="M84 86L119 126M91 103L80 139M101 120L89 148" />

        <path className="plane-fuselage" d={fuselagePath} fill={`url(#${bodyGradientId})`} />
        <g clipPath={`url(#${fuselageClipId})`}>
          <path className="plane-brand-wrap" d="M112 150C158 132 210 102 304 43L316 57C224 116 170 146 124 163Z" />
          <path className="plane-wrap-highlight" d="M119 149C166 130 219 98 307 44" />
          <path className="plane-belly-shade" d="M49 172C94 173 137 154 181 128C147 163 106 184 64 188C54 188 48 181 49 172Z" />
        </g>
        <path className="plane-fuselage-highlight" d="M73 158C119 147 157 123 195 99L306 29" />
        <path className="plane-window-line" d="M137 135C183 113 235 82 308 36" />
        <path className="plane-window-rail" d="M132 141C181 119 238 84 315 35" />

        <path className="plane-cockpit-window" d="M312 30L326 24L331 26L321 34Z" />
        <path className="plane-cockpit-window" d="M326 23L337 22L339 25L331 28Z" />
        <path className="plane-nose-detail" d="M333 31C340 29 344 29 348 30" />

        <g className="plane-door" transform="rotate(-29 132 143)">
          <rect x="126" y="134" width="11" height="18" rx="3" />
          <circle cx="134" cy="143" r="1.2" />
        </g>
        <g className="plane-door" transform="rotate(-31 288 55)">
          <rect x="283" y="48" width="10" height="16" rx="3" />
          <circle cx="290" cy="56" r="1.1" />
        </g>
        <path className="plane-service-line" d="M74 171C110 165 139 151 169 133M195 112L293 49" />
        <circle className="plane-navigation-light" cx="295" cy="201" r="3" />
      </g>

      <g transform={`rotate(${sponsorLabel.rotation} ${sponsorLabel.x} ${sponsorLabel.y})`}>
        <text className="plane-brand-name" x={sponsorLabel.x} y={sponsorLabel.y} textAnchor="middle">{shortName}</text>
        <text className="plane-brand-subline" x={sponsorLabel.x} y={sponsorLabel.y + 10} textAnchor="middle">SPONSOR PASS · BUILD001</text>
      </g>

      <g transform={`rotate(${wingLogo.rotation} ${wingLogo.x} ${wingLogo.y})`}>
        <rect className="plane-logo-panel" x={wingLogo.x - 16} y={wingLogo.y - 16} width="32" height="32" rx="7" />
        {faviconUrl ? (
          <image href={faviconUrl} x={wingLogo.x - 11} y={wingLogo.y - 11} width="22" height="22" preserveAspectRatio="xMidYMid meet" />
        ) : (
          <text className="plane-logo-placeholder" x={wingLogo.x} y={wingLogo.y + 8} textAnchor="middle">+</text>
        )}
      </g>

      <g transform={`rotate(${slotBadge.rotation} ${slotBadge.x} ${slotBadge.y})`}>
        <circle className="plane-slot-badge" cx={slotBadge.x} cy={slotBadge.y} r="14" />
        <text className="plane-position-number" x={slotBadge.x} y={slotBadge.y + 4} textAnchor="middle">#{number}</text>
      </g>
    </svg>
  );
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
          return (
            <button
              type="button"
              className={`pass-slot pass-slot-${placement.tier}`}
              data-status={placement.status}
              key={placement.slug}
              onClick={() => onSelect(placement.slug)}
              aria-label={`Open ${placement.name}, $${placement.price}, ${placement.status}`}
            >
              <span className="pass-slot-meta">{placement.number} · {placement.tier}</span>
              <div className="pass-brand">
                <span
                  className="pass-brand-mark"
                  style={faviconUrl ? { backgroundImage: `url(${faviconUrl})` } : undefined}
                >
                  {faviconUrl ? null : sponsorName?.slice(0, 1) ?? "+"}
                </span>
                <strong>{sponsorName ?? "YOUR BRAND"}</strong>
              </div>
              <span className="pass-slot-foot">{placement.status === "available" ? `Available · $${placement.price}` : placement.status}</span>
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
  const [isPending, startTransition] = useTransition();

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
      const result = await createCheckout({ placementSlug: placement.slug, startupUrl, xHandle });
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
          <div><dt>Campaign fee</dt><dd>${placement.price} USD</dd></div>
        </dl>

        {placement.status === "available" ? (
          <form onSubmit={handleSubmit} className="sponsor-form">
            <label>
              <span>Startup URL</span>
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
              <small>We fetch your startup name, favicon, and tagline automatically.</small>
            </label>
            <label>
              <span>X handle <i>optional</i></span>
              <input type="text" autoComplete="off" placeholder="@yourstartup" value={xHandle} onChange={(event) => setXHandle(event.target.value)} />
            </label>

            <div className={`brand-preview ${preview ? "brand-preview-ready" : ""}`}>
              {isPreviewing ? <><LoaderCircle className="spin" /><span>Reading your website…</span></> : null}
              {!isPreviewing && preview ? (
                <>
                  <div className="brand-favicon" style={preview.faviconUrl ? { backgroundImage: `url(${preview.faviconUrl})` } : undefined}>{preview.faviconUrl ? null : preview.name.slice(0, 1)}</div>
                  <div><strong>{preview.name}</strong><p>{preview.tagline}</p></div>
                </>
              ) : null}
              {!isPreviewing && !preview && !previewError ? <><Sparkles /><span>Your Sponsor Pass preview appears here.</span></> : null}
              {previewError ? <span className="form-error">{previewError}</span> : null}
            </div>

            {checkoutError ? <p className="checkout-error">{checkoutError}</p> : null}
            <button className="checkout-button" type="submit" disabled={isPending || isPreviewing || !preview}>
              <span>{isPending ? "Opening secure checkout…" : `Continue to Stripe · $${placement.price}`}</span>
              {isPending ? <LoaderCircle className="spin" /> : <ArrowRight />}
            </button>
            <p className="stripe-note"><LockKeyhole size={13} /> Stripe asks for your receipt email next. No BrandMyFlight account is created.</p>
          </form>
        ) : (
          <div className="unavailable-panel">
            <strong>This position is {placement.status}.</strong>
            <p>{placement.sponsor ? `${placement.sponsor.projectName} currently holds this Sponsor Pass position.` : "Choose another position from the live inventory."}</p>
            <button type="button" onClick={onClose}>Back to positions</button>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}
