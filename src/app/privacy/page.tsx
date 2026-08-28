import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = { title: "Privacy — BrandMyFlight" };

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <nav><Link className="wordmark" href="/" aria-label="BrandMyFlight home"><BrandLogo /></Link><Link href="/">Back to Sponsor Pass ↗</Link></nav>
      <header><p className="eyebrow">LAST UPDATED · 28 AUGUST 2026</p><h1>Privacy,<br /><em>kept simple.</em></h1></header>
      <article>
        <section><h2>No user accounts</h2><p>BrandMyFlight does not create user profiles, passwords, or persistent login sessions. You can sponsor a position without registering.</p></section>
        <section><h2>What we store</h2><p>We store only the public sponsorship details needed to deliver the placement: startup URL, startup name, public tagline, favicon URL, optional X handle, selected placement, payment status, and Stripe transaction identifiers. We do not store your receipt email in our Supabase database.</p></section>
        <section><h2>Payments and email</h2><p>Stripe processes card payments and collects the email used for receipts and sponsor follow-up. Card details never pass through BrandMyFlight servers. Stripe processes that data under its own privacy policy.</p></section>
        <section><h2>Website metadata</h2><p>When you enter a startup URL, our server visits that public page to read its title, description, and favicon. It does not access private networks, accounts, or password-protected content.</p></section>
        <section><h2>Anonymous visitor count</h2><p>The live audience counter uses a random session cookie and a short-lived presence timestamp. It does not store your name, email, IP address, user agent, account, or browsing history. Expired presence rows are removed automatically; only the aggregate visit total remains.</p></section>
        <section><h2>Questions or removal</h2><p>For a copy, correction, or deletion request, email <a href="mailto:hello@brandmyflight.com">hello@brandmyflight.com</a>.</p></section>
      </article>
    </main>
  );
}
