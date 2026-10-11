import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/c/"],
      disallow: ["/matches", "/connections", "/account", "/admin", "/api", "/brand", "/onboarding", "/login"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
