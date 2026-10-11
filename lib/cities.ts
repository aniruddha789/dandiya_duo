import type { SupabaseClient } from "@supabase/supabase-js";

export type City = {
  id: string;
  slug: string;
  name: string;
  state: string;
  metro_slug: string | null;
  is_launched: boolean;
  sort_order: number;
  aliases: string[];
};

export const POPULAR_SLUGS = [
  "mumbai", "delhi-ncr", "bengaluru", "hyderabad", "pune", "chennai", "kolkata", "ahmedabad",
];

/**
 * Static mirror of the seeded cities for build-time use (sitemap, /c static
 * params, offline fallback). Keep in sync with migration 05 seed + README.
 * id is filled at runtime from the DB; build-time entries use slug as key.
 */
export const STATIC_CITIES: Array<{
  slug: string; name: string; state: string; metro_slug: string | null; popular?: boolean;
}> = [
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra", metro_slug: "mumbai", popular: true },
  { slug: "thane", name: "Thane", state: "Maharashtra", metro_slug: "mumbai" },
  { slug: "navi-mumbai", name: "Navi Mumbai", state: "Maharashtra", metro_slug: "mumbai" },
  { slug: "delhi-ncr", name: "Delhi NCR", state: "Delhi", metro_slug: "delhi", popular: true },
  { slug: "gurugram", name: "Gurugram", state: "Haryana", metro_slug: "delhi" },
  { slug: "noida", name: "Noida", state: "Uttar Pradesh", metro_slug: "delhi" },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", metro_slug: null, popular: true },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", metro_slug: null, popular: true },
  { slug: "ahmedabad", name: "Ahmedabad", state: "Gujarat", metro_slug: null, popular: true },
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu", metro_slug: null, popular: true },
  { slug: "kolkata", name: "Kolkata", state: "West Bengal", metro_slug: null, popular: true },
  { slug: "pune", name: "Pune", state: "Maharashtra", metro_slug: null, popular: true },
  { slug: "surat", name: "Surat", state: "Gujarat", metro_slug: null },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan", metro_slug: null },
  { slug: "lucknow", name: "Lucknow", state: "Uttar Pradesh", metro_slug: null },
  { slug: "vadodara", name: "Vadodara", state: "Gujarat", metro_slug: null },
  { slug: "rajkot", name: "Rajkot", state: "Gujarat", metro_slug: null },
  { slug: "indore", name: "Indore", state: "Madhya Pradesh", metro_slug: null },
  { slug: "bhopal", name: "Bhopal", state: "Madhya Pradesh", metro_slug: null },
  { slug: "nagpur", name: "Nagpur", state: "Maharashtra", metro_slug: null },
  { slug: "chandigarh", name: "Chandigarh", state: "Chandigarh", metro_slug: null },
  { slug: "kochi", name: "Kochi", state: "Kerala", metro_slug: null },
  { slug: "coimbatore", name: "Coimbatore", state: "Tamil Nadu", metro_slug: null },
  { slug: "visakhapatnam", name: "Visakhapatnam", state: "Andhra Pradesh", metro_slug: null },
  { slug: "patna", name: "Patna", state: "Bihar", metro_slug: null },
  { slug: "nashik", name: "Nashik", state: "Maharashtra", metro_slug: null },
  { slug: "gandhinagar", name: "Gandhinagar", state: "Gujarat", metro_slug: null },
  { slug: "mysuru", name: "Mysuru", state: "Karnataka", metro_slug: null },
  { slug: "bhubaneswar", name: "Bhubaneswar", state: "Odisha", metro_slug: null },
  { slug: "raipur", name: "Raipur", state: "Chhattisgarh", metro_slug: null },
  { slug: "dehradun", name: "Dehradun", state: "Uttarakhand", metro_slug: null },
  { slug: "guwahati", name: "Guwahati", state: "Assam", metro_slug: null },
];

/** Legacy ?city= values (old 3-city enum + URL forms) -> slug. */
export const LEGACY_CITY_MAP: Record<string, string> = {
  bengaluru: "bengaluru",
  "delhi-ncr": "delhi-ncr",
  delhi_ncr: "delhi-ncr",
  delhi: "delhi-ncr",
  pune: "pune",
};

export function matchCity<T extends Pick<City, "slug" | "name" | "aliases">>(
  input: string,
  cities: T[],
): T | undefined {
  const q = input.trim().toLowerCase();
  if (!q) return undefined;
  return cities.find(
    (c) =>
      c.slug === q ||
      c.name.toLowerCase() === q ||
      c.aliases?.some((a) => a.toLowerCase() === q),
  );
}

export function staticCityFallback(): City[] {
  return STATIC_CITIES.map((c, i) => ({
    id: "",
    slug: c.slug,
    name: c.name,
    state: c.state,
    metro_slug: c.metro_slug,
    is_launched: true,
    sort_order: i,
    aliases: [],
  }));
}

export async function fetchCities(client: SupabaseClient): Promise<City[]> {
  const { data, error } = await client
    .from("cities")
    .select("id,slug,name,state,metro_slug,is_launched,sort_order,aliases")
    .eq("is_launched", true)
    .order("sort_order");
  if (error || !data?.length) return staticCityFallback();
  return data as City[];
}
