import type { MetadataRoute } from "next";
import { STATIC_CITIES } from "@/lib/cities";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    ...STATIC_CITIES.map((c) => ({
      url: `${base}/c/${c.slug}` as string,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    { url: `${base}/safety`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
