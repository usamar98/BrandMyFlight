import { SponsorSite } from "@/components/sponsor-site";
import { getAuctionHistory, getPlacementInventory } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [placements, auctionHistory] = await Promise.all([
    getPlacementInventory(),
    getAuctionHistory(),
  ]);
  return <SponsorSite placements={placements} auctionHistory={auctionHistory} />;
}
