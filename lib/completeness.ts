export type Draft = {
  city: string; ageConfirmed: boolean; first_name: string; age: number | "";
  gender: string; seeking: string; area_id: string | "";
  nights: string[]; dance_level: string; intention: string; how_far: string; venue_text: string;
  star_sign: number | null; languages: string[]; hometown: string; work: string;
  interests: string[]; customInterests: string[];
  movie_genres: string[]; fav_movie: string;
  show_languages: boolean; show_hometown: boolean;
  diet: string | ""; cuisines: string[]; after_garba: string | ""; show_food: boolean;
  weight_star: number; weight_food: number;
  age_min: number | ""; age_max: number | ""; diet_rule: string;
  min_dance_level: string; must_share_language: boolean;
  instagram: string; prompt_move: string; prompt_nonneg: string;
  consentTerms: boolean; consentPrivacy: boolean; consentWipe: boolean;
};

export const HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;

export function step1Done(d: Draft) {
  return (
    !!d.city && d.ageConfirmed && d.first_name.trim().length >= 1 &&
    typeof d.age === "number" && d.age >= 18 && !!d.gender && !!d.seeking && !!d.area_id
  );
}
export function step2Done(d: Draft) {
  return d.nights.length > 0 && !!d.dance_level && !!d.intention && !!d.how_far;
}
export function step6Done(d: Draft, hasPhotoOrAvatarOk = true) {
  void hasPhotoOrAvatarOk; // avatar fallback means photos are optional
  return HANDLE_RE.test(d.instagram.trim()) && d.consentTerms && d.consentPrivacy && d.consentWipe;
}
export function liveReady(d: Draft) {
  return step1Done(d) && step2Done(d) && step6Done(d);
}
