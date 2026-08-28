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
import { FormEvent, useEffect, useState, useTransition } from "react";
import { createCheckout } from "@/app/actions/create-checkout";
import { SmoothScroll } from "@/components/smooth-scroll";
import type { PlacementSlug, PlacementWithState } from "@/lib/placements";

type ProjectPreview = {
  url: string;
  name: string;
  tagline: string;
  faviconUrl: string | null;
};

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
  const selectedPlacement = placements.find((placement) => placement.slug === selectedSlug) ?? null;
  const availableCount = placements.filter((placement) => placement.status === "available").length;
  const fundedTotal = placements
    .filter((placement) => placement.status === "sold")
    .reduce((total, placement) => total + placement.price, 0);

  return (
    <main id="top">
      <SmoothScroll />
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="BrandMyFlight home">
          BrandMyFlight<span>®</span>
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
        <div className="hero-copy">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Lahore → New York · Sponsor campaign 01
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            Ten brands.<br /><em>One funded flight.</em>
          </motion.h1>
          <motion.blockquote initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.7 }}>
            “Ten brands are buying my flight from Lahore to New York.<br />Your logo travels with me.”
          </motion.blockquote>
          <div className="hero-actions">
            <a className="primary-button" href="#sponsor-pass">Explore the pass <ArrowDownRight size={17} /></a>
            <a className="text-link" href="#benefits">See what sponsors get <ArrowRight size={15} /></a>
          </div>
          <div className="hero-metrics" aria-label="Campaign summary">
            <div><strong>10</strong><span>exclusive positions</span></div>
            <div><strong>${fundedTotal.toLocaleString()}</strong><span>funded of $750</span></div>
            <div><strong>{availableCount}</strong><span>currently available</span></div>
          </div>
        </div>

        <motion.div
          className="pass-stage"
          initial={{ opacity: 0, scale: 0.96, rotate: 1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: -1.1 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <SponsorPass placements={placements} onSelect={setSelectedSlug} />
          <p className="pass-stage-note"><Sparkles size={13} /> Every logo position is clickable</p>
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
          <a className="wordmark" href="#top">BrandMyFlight<span>®</span></a>
          <p>Ten brands funding one founder flight.<br />Lahore → New York.</p>
        </div>
        <div><span>Explore</span><a href="#sponsor-pass">Sponsor Pass</a><a href="#inventory">Positions</a><a href="#proof">Proof plan</a></div>
        <div><span>Details</span><a href="/privacy">Privacy</a><a href="/terms">Sponsor terms</a></div>
        <div><span>Follow</span><a href="https://x.com" target="_blank" rel="noreferrer">X / Twitter <ExternalLink size={10} /></a><a href="mailto:hello@brandmyflight.com">Email <ExternalLink size={10} /></a></div>
        <p className="footer-base">© 2026 BrandMyFlight · Promotional design — not valid for travel.</p>
      </footer>

      <AnimatePresence>
        {selectedPlacement ? <SponsorDrawer placement={selectedPlacement} onClose={() => setSelectedSlug(null)} /> : null}
      </AnimatePresence>
    </main>
  );
}

function SponsorPass({ placements, onSelect }: { placements: PlacementWithState[]; onSelect: (slug: PlacementSlug) => void }) {
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
          const sponsorName = placement.sponsor?.projectName;
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
                  style={placement.sponsor?.faviconUrl ? { backgroundImage: `url(${placement.sponsor.faviconUrl})` } : undefined}
                >
                  {placement.sponsor?.faviconUrl ? null : sponsorName?.slice(0, 1) ?? "+"}
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

function SponsorDrawer({ placement, onClose }: { placement: PlacementWithState; onClose: () => void }) {
  const [startupUrl, setStartupUrl] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
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
      } catch (error) {
        if (controller.signal.aborted) return;
        setPreview(null);
        setPreviewError(error instanceof Error ? error.message : "Unable to read that website.");
      } finally {
        if (!controller.signal.aborted) setIsPreviewing(false);
      }
    }, 700);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [startupUrl]);

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
