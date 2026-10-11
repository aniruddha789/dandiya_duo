import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LandingContent, OrgJsonLd } from "@/components/LandingContent";
import { STATIC_CITIES } from "@/lib/cities";
import { siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  return STATIC_CITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = STATIC_CITIES.find((c) => c.slug === slug);
  if (!city) return { title: "City not found" };
  const base = siteUrl();
  return {
    title: `Find your DandiyaDuo in ${city.name}`,
    description: `Match with a garba dance partner for Navratri in ${city.name}. Free. Mutual match only. Gone after the festival.`,
    alternates: { canonical: `${base}/c/${slug}` },
    openGraph: {
      title: `DandiyaDuo in ${city.name}`,
      description: `${city.name}'s garba circle is warming up. Create your profile free.`,
    },
  };
}

export default async function CityLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = STATIC_CITIES.find((c) => c.slug === slug);
  if (!city) notFound();

  return (
    <AppShell showNav={false} showDuo={false}>
      <OrgJsonLd base={siteUrl()} />
      <LandingContent city={{ slug: city.slug, name: city.name }} page="city" />
    </AppShell>
  );
}
