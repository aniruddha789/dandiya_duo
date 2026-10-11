import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { Wizard } from "@/components/Wizard";
import { createClient } from "@/lib/supabase/server";
import { seasonNights } from "@/lib/config";
import { fetchCities, LEGACY_CITY_MAP } from "@/lib/cities";
import type { Draft } from "@/lib/completeness";

function emptyDraft(): Draft {
  return {
    citySlug: "", cityId: "", ageConfirmed: false,
    first_name: "", age: "", gender: "", seeking: "",
    area_id: "", nights: seasonNights(), dance_level: "", intention: "",
    how_far: "anywhere", include_nearby: true, venue_text: "",
    star_sign: null, languages: [],
    hometown: "", work: "", interests: [], customInterests: [], movie_genres: [],
    fav_movie: "", show_languages: true, show_hometown: true, diet: "",
    cuisines: [], after_garba: "", show_food: true, weight_star: 1, weight_food: 1,
    age_min: "", age_max: "", diet_rule: "any", min_dance_level: "first_timer",
    must_share_language: false, instagram: "", prompt_move: "", prompt_nonneg: "",
    consentTerms: false, consentPrivacy: false, consentWipe: false,
  };
}

export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; step?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");
  const { city, step } = await searchParams;

  const cities = await fetchCities(supabase);
  const byId = new Map(cities.map((c) => [c.id, c]));
  const bySlug = new Map(cities.map((c) => [c.slug, c]));

  const [{ data: profile }, { data: areas }, { data: nights }, { data: langs },
    { data: cuisines }, { data: genres }, { data: interests }, { data: db },
    { data: insta }, { data: photos }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("areas").select("id,city_id,name,zone").order("name"),
    supabase.from("profile_nights").select("night").eq("profile_id", user.id),
    supabase.from("profile_languages").select("lang").eq("profile_id", user.id),
    supabase.from("profile_cuisines").select("cuisine").eq("profile_id", user.id),
    supabase.from("profile_movie_genres").select("genre").eq("profile_id", user.id),
    supabase.from("profile_interests").select("label").eq("profile_id", user.id),
    supabase.from("dealbreakers").select("*").eq("profile_id", user.id).single(),
    supabase.from("profile_instagram").select("handle").eq("profile_id", user.id).single(),
    supabase.from("photos").select("storage_path").eq("profile_id", user.id).order("position"),
  ]);

  const d = emptyDraft();
  // Pre-fill city: saved profile → ?city= slug (incl. legacy) → empty (must choose).
  const paramSlug = city ? LEGACY_CITY_MAP[city.toLowerCase()] ?? city.toLowerCase() : null;
  const initialCity = (profile?.city_id && byId.get(profile.city_id)) || (paramSlug && bySlug.get(paramSlug)) || null;
  if (initialCity) {
    d.citySlug = initialCity.slug;
    d.cityId = initialCity.id;
  }
  if (profile) {
    Object.assign(d, {
      first_name: profile.first_name ?? "", age: profile.age ?? "",
      gender: profile.gender ?? "", seeking: profile.seeking ?? "",
      area_id: profile.area_id ?? "", dance_level: profile.dance_level ?? "",
      intention: profile.intention ?? "", how_far: profile.how_far ?? "anywhere",
      include_nearby: profile.include_nearby ?? true,
      venue_text: profile.venue_text ?? "", star_sign: profile.star_sign ?? null,
      hometown: profile.hometown ?? "", work: profile.work ?? "",
      fav_movie: profile.fav_movie ?? "", diet: profile.diet ?? "",
      after_garba: profile.after_garba ?? "", prompt_move: profile.prompt_move ?? "",
      prompt_nonneg: profile.prompt_nonneg ?? "", weight_star: Number(profile.weight_star ?? 1),
      weight_food: Number(profile.weight_food ?? 1),
      show_languages: profile.show_languages ?? true,
      show_hometown: profile.show_hometown ?? true,
      show_food: profile.show_food ?? true,
      ageConfirmed: !!profile.age_confirmed_at,
    });
  }
  if (nights) d.nights = nights.map((n) => n.night);
  if (langs) d.languages = langs.map((l) => l.lang);
  if (cuisines) d.cuisines = cuisines.map((c) => c.cuisine);
  if (genres) d.movie_genres = genres.map((g) => g.genre);
  if (interests) {
    const labels = interests.map((i) => i.label);
    d.interests = labels;
    d.customInterests = [];
  }
  if (db) Object.assign(d, {
    age_min: db.age_min ?? "", age_max: db.age_max ?? "", diet_rule: db.diet_rule ?? "any",
    min_dance_level: db.min_dance_level ?? "first_timer",
    must_share_language: db.must_share_language ?? false,
  });
  if (insta) d.instagram = insta.handle ?? "";
  if (profile) {
    d.consentTerms = true; d.consentPrivacy = true; d.consentWipe = true;
  }

  const initialStep = step ? Number(step) : (profile?.onboarding_step ?? 1);

  return (
    <AppShell>
      <Suspense>
        <Wizard
          userId={user.id}
          areas={(areas ?? []) as Array<{ id: string; city: string | null; city_id: string | null; name: string; zone: string }>}
          cities={cities}
          initial={d}
          initialStep={Number.isFinite(initialStep) ? initialStep : 1}
          initialPhotos={(photos ?? []).map((p) => p.storage_path)}
          isPaused={profile?.is_paused ?? false}
        />
      </Suspense>
    </AppShell>
  );
}
