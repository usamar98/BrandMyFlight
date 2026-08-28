import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = { title: "Terms — BrandMyFlight" };

export default function TermsPage() {
  return (
    <main className="legal-page">
      <nav><Link className="wordmark" href="/" aria-label="BrandMyFlight home"><BrandLogo /></Link><Link href="/">Back to Sponsor Pass ↗</Link></nav>
      <header><p className="eyebrow">CAMPAIGN 01 · SPONSOR TERMS</p><h1>The clear<br /><em>agreement.</em></h1></header>
      <article>
        <section><h2>What you are buying</h2><p>Your payment purchases the named position for BrandMyFlight Campaign 01: logo placement on the fictional digital Sponsor Pass, a site backlink, launch-post placement, travel photography inclusion, trip recap inclusion, and public proof of campaign delivery.</p></section>
        <section><h2>Not a travel document</h2><p>The Sponsor Pass is promotional artwork and is not valid for travel. Sponsors must not supply artwork that imitates a barcode, booking reference, airline identity, security credential, or other machine-readable travel information.</p></section>
        <section><h2>Review and artwork</h2><p>All sponsors are reviewed before production. You confirm that you have the right to use the submitted brand assets. Fraudulent, unlawful, misleading, unsafe, or infringing sponsors may be declined and refunded.</p></section>
        <section><h2>Visibility, not performance</h2><p>We promise to install and visibly feature the placement as described. We do not guarantee views, clicks, conversions, reach, press coverage, or a financial return.</p></section>
        <section><h2>Schedule and changes</h2><p>Travel timing and the content schedule may move for practical, safety, visa, weather, or carrier reasons. If the campaign cannot be delivered, we will offer a replacement of equal or greater value or a refund.</p></section>
        <section><h2>Questions</h2><p>Email <a href="mailto:hello@brandmyflight.com">hello@brandmyflight.com</a> before purchasing if your campaign has special requirements.</p></section>
      </article>
    </main>
  );
}
