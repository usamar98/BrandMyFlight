import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const stripe = getStripe();
  let projectName = "your startup";
  let placementName = "Sponsor Pass position";
  let confirmed = false;

  if (stripe && sessionId?.startsWith("cs_")) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      projectName = session.metadata?.project_name || projectName;
      placementName = session.metadata?.placement_slug?.replaceAll("-", " ") || placementName;
      confirmed = session.payment_status === "paid";
    } catch {
      confirmed = false;
    }
  }

  return (
    <main className="result-page">
      <Link className="result-back" href="/"><ArrowLeft size={16} /> BrandMyFlight</Link>
      <div className="result-card">
        <div className="result-icon"><Check /></div>
        <p className="eyebrow">{confirmed ? "PAYMENT CONFIRMED" : "CHECKOUT RECEIVED"}</p>
        <h1>You’re officially<br /><em>on the pass.</em></h1>
        <p>
          The <strong>{placementName}</strong> is now held for <strong>{projectName}</strong>.
          I’ll use the email on your Stripe receipt to confirm the final logo artwork and campaign schedule.
        </p>
        <Link href="/">Return to the Sponsor Pass <ArrowLeft size={15} /></Link>
      </div>
      <div className="result-stamp">B/M/F</div>
    </main>
  );
}
