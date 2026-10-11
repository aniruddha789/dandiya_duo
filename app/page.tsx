import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LandingContent, OrgJsonLd } from "@/components/LandingContent";
import { LEGACY_CITY_MAP } from "@/lib/cities";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "DandiyaDuo — Find your DandiyaDuo",
    description:
      "Match with a dance partner for Navratri. Free. Mutual match only. Gone after the festival. Now in cities across India.",
    alternates: { canonical: siteUrl() },
  };
}

type Props = { searchParams: Promise<{ city?: string; code?: string }> };

export default async function Landing({ searchParams }: Props) {
  const { city, code } = await searchParams;
  // Safety net: if Supabase ever falls back to the Site URL root with a
  // code (misconfigured redirect allow-list), forward it to the exchanger.
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/onboarding`);
  // Legacy /?city=xyz links: known slugs redirect to their city page.
  if (city) {
    const slug = LEGACY_CITY_MAP[city.toLowerCase()];
    if (slug) redirect(`/c/${slug}`);
  }

  return (
    <AppShell showNav={false} showDuo={false}>
      <OrgJsonLd base={siteUrl()} />
      <LandingContent page="home" />
    </AppShell>
  );
}
