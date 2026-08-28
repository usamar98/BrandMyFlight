export const placements = [
  {
    slug: "presenting-sponsor",
    number: "01",
    name: "Presenting sponsor",
    tier: "presenting",
    price: 250,
    short: "Own the headline of the Sponsor Pass",
    description:
      "The single largest logo position, paired with a presenting credit across the Sponsor Pass, launch posts, airport photographs, and trip recap.",
    exposure: "Hero credit + trip mention",
    format: "Primary logo lockup",
  },
  {
    slug: "premium-position-a",
    number: "02",
    name: "Premium position A",
    tier: "premium",
    price: 120,
    short: "High-visibility route panel",
    description:
      "A large sponsor block beside the flight route, included in the digital pass, travel photographs, launch posts, and recap assets.",
    exposure: "Pass + launch + travel photos",
    format: "Large horizontal logo",
  },
  {
    slug: "premium-position-b",
    number: "03",
    name: "Premium position B",
    tier: "premium",
    price: 120,
    short: "High-visibility status panel",
    description:
      "A large sponsor block in the main status area, included in the digital pass, travel photographs, launch posts, and recap assets.",
    exposure: "Pass + launch + travel photos",
    format: "Large horizontal logo",
  },
  {
    slug: "medium-position-a",
    number: "04",
    name: "Medium position A",
    tier: "medium",
    price: 60,
    short: "A clear mid-pass brand tile",
    description:
      "A medium logo tile on the Sponsor Pass with backlink, launch-post placement, airport photographs, and the public proof page.",
    exposure: "Pass + backlink + proof",
    format: "Medium brand tile",
  },
  {
    slug: "medium-position-b",
    number: "05",
    name: "Medium position B",
    tier: "medium",
    price: 60,
    short: "A clear mid-pass brand tile",
    description:
      "A medium logo tile on the Sponsor Pass with backlink, launch-post placement, airport photographs, and the public proof page.",
    exposure: "Pass + backlink + proof",
    format: "Medium brand tile",
  },
  {
    slug: "medium-position-c",
    number: "06",
    name: "Medium position C",
    tier: "medium",
    price: 60,
    short: "A clear mid-pass brand tile",
    description:
      "A medium logo tile on the Sponsor Pass with backlink, launch-post placement, airport photographs, and the public proof page.",
    exposure: "Pass + backlink + proof",
    format: "Medium brand tile",
  },
  {
    slug: "small-position-a",
    number: "07",
    name: "Small position A",
    tier: "small",
    price: 20,
    short: "Compact founder-supporter mark",
    description:
      "A compact logo position on the Sponsor Pass with a site backlink, inclusion in launch posts, and public trip proof.",
    exposure: "Pass + backlink + proof",
    format: "Compact logo mark",
  },
  {
    slug: "small-position-b",
    number: "08",
    name: "Small position B",
    tier: "small",
    price: 20,
    short: "Compact founder-supporter mark",
    description:
      "A compact logo position on the Sponsor Pass with a site backlink, inclusion in launch posts, and public trip proof.",
    exposure: "Pass + backlink + proof",
    format: "Compact logo mark",
  },
  {
    slug: "small-position-c",
    number: "09",
    name: "Small position C",
    tier: "small",
    price: 20,
    short: "Compact founder-supporter mark",
    description:
      "A compact logo position on the Sponsor Pass with a site backlink, inclusion in launch posts, and public trip proof.",
    exposure: "Pass + backlink + proof",
    format: "Compact logo mark",
  },
  {
    slug: "small-position-d",
    number: "10",
    name: "Small position D",
    tier: "small",
    price: 20,
    short: "Compact founder-supporter mark",
    description:
      "A compact logo position on the Sponsor Pass with a site backlink, inclusion in launch posts, and public trip proof.",
    exposure: "Pass + backlink + proof",
    format: "Compact logo mark",
  },
] as const;

export type PlacementSlug = (typeof placements)[number]["slug"];
export type Placement = (typeof placements)[number];

export type SponsorPreview = {
  projectName: string;
  projectUrl: string;
  tagline: string;
  faviconUrl: string | null;
  xHandle: string | null;
};

export type PlacementWithState = Placement & {
  status: "available" | "reserved" | "sold";
  sponsor: SponsorPreview | null;
};

export function getPlacement(slug: string) {
  return placements.find((placement) => placement.slug === slug);
}
