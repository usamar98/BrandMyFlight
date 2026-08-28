import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BrandMyFlight — Ten brands. One funded flight.",
  description:
    "Sponsor one of ten positions on a fictional Sponsor Pass funding a founder flight from Lahore to New York.",
  applicationName: "BrandMyFlight",
  keywords: ["founder sponsorship", "startup advertising", "build in public", "travel campaign", "Lahore to New York"],
  openGraph: {
    type: "website",
    title: "BrandMyFlight — Ten brands. One funded flight.",
    description: "Your logo travels with a founder from Lahore to New York.",
    siteName: "BrandMyFlight",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrandMyFlight — Ten brands. One funded flight.",
    description: "Ten sponsor positions. Lahore to New York. Your logo travels with me.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
