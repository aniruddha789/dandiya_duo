import type { Metadata } from "next";
import { Baloo_2, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { siteUrl } from "@/lib/site";

const display = Baloo_2({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body" });

const base = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: {
    default: "DandiyaDuo — Find your DandiyaDuo",
    template: "%s — DandiyaDuo",
  },
  description:
    "A free, seasonal, mutual-match-only garba and dandiya partner finder for Navratri, in cities across India.",
  openGraph: {
    type: "website",
    siteName: "DandiyaDuo",
    title: "DandiyaDuo — Find your DandiyaDuo",
    description: "Match with a dance partner for Navratri. Free. Mutual match only. Gone after the festival.",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport = { themeColor: "#1B1030" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
