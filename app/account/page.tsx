import { redirect } from "next/navigation";
import AccountPage from "@/components/AccountView";
import { createClient } from "@/lib/supabase/server";
import type { Draft } from "@/lib/completeness";

export default async function Account() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  // completeness: share of filled optional fields
  const [langs, cuisines, genres, interests, db, insta, photos, blocks, areaRow, nightRows] = await Promise.all([
    supabase.from("profile_languages").select("lang").eq("profile_id", user.id),
    supabase.from("profile_cuisines").select("cuisine").eq("profile_id", user.id),
    supabase.from("profile_movie_genres").select("genre").eq("profile_id", user.id),
    supabase.from("profile_interests").select("label").eq("profile_id", user.id),
    supabase.from("dealbreakers").select("*").eq("profile_id", user.id).single(),
    supabase.from("profile_instagram").select("handle").eq("profile_id", user.id).single(),
    supabase.from("photos").select("id,storage_path").eq("profile_id", user.id).order("position"),
    supabase.from("blocks").select("blocked").eq("blocker", user.id),
    profile.area_id
      ? supabase.from("areas").select("name").eq("id", profile.area_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("profile_nights").select("night").eq("profile_id", user.id),
  ]);

  const bits = [
    !!profile.star_sign, (langs.data?.length ?? 0) > 0, !!profile.hometown, !!profile.work,
    (interests.data?.length ?? 0) > 0, (genres.data?.length ?? 0) > 0, !!profile.fav_movie,
    !!profile.diet, (cuisines.data?.length ?? 0) > 0, !!profile.after_garba,
    !!db.data, !!insta.data, (photos.data?.length ?? 0) > 0,
    !!profile.prompt_move, !!profile.prompt_nonneg,
  ];
  const completeness = Math.round((100 * bits.filter(Boolean).length) / bits.length);

  const blockedIds = (blocks.data ?? []).map((b) => b.blocked);
  let blockedNames: Array<{ id: string; name: string }> = [];
  if (blockedIds.length) {
    const { data: names } = await supabase.from("profiles").select("id,first_name").in("id", blockedIds);
    // RLS hides other users' rows; fall back to short ids.
    blockedNames = blockedIds.map((id) => ({
      id, name: names?.find((n) => n.id === id)?.first_name ?? id.slice(0, 8),
    }));
  }

  const draft = {
    city: profile.city, ageConfirmed: true, first_name: profile.first_name, age: profile.age,
    gender: profile.gender, seeking: profile.seeking, area_id: profile.area_id ?? "",
    nights: [], dance_level: profile.dance_level, intention: profile.intention,
    how_far: profile.how_far, venue_text: "", star_sign: null, languages: [],
    hometown: "", work: "", interests: [], customInterests: [], movie_genres: [],
    fav_movie: "", show_languages: true, show_hometown: true, diet: "",
    cuisines: [], after_garba: "", show_food: true, weight_star: 1, weight_food: 1,
    age_min: "", age_max: "", diet_rule: "any", min_dance_level: "first_timer",
    must_share_language: false, instagram: "", prompt_move: "", prompt_nonneg: "",
    consentTerms: true, consentPrivacy: true, consentWipe: true,
  } satisfies Draft;

  return (
    <AccountPage
      draft={draft}
      paused={profile.is_paused}
      blocked={blockedNames}
      completeness={completeness}
      preview={{
        first_name: profile.first_name,
        age: profile.age,
        area: areaRow.data?.name ?? null,
        dance_level: profile.dance_level,
        intention: profile.intention,
        languages: profile.show_languages ? (langs.data ?? []).map((l) => l.lang) : [],
        hometown: profile.show_hometown ? profile.hometown : null,
        diet: profile.show_food ? profile.diet : null,
        cuisines: profile.show_food ? (cuisines.data ?? []).map((c) => c.cuisine) : [],
        after_garba: profile.show_food ? profile.after_garba : null,
        prompt_move: profile.prompt_move,
        prompt_nonneg: profile.prompt_nonneg,
        photo_paths: (photos.data ?? []).map((p) => p.storage_path),
        nights: (nightRows.data ?? []).length,
      }}
    />
  );
}
