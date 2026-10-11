import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const display = Fraunces({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-display" });
const body = Outfit({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "DandiyaDuo — Find your circle this Navratri",
  description:
    "A free, seasonal, mutual-match-only garba partner finder for Navratri in Bengaluru, Delhi NCR and Pune.",
};

export const viewport = { themeColor: "#f0a92e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
