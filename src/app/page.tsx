import { SponsorSite } from "@/components/sponsor-site";
import { getPlacementInventory } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const placements = await getPlacementInventory();
  return <SponsorSite placements={placements} />;
}
