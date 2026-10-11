// Season + wipe dates are config values so the app can be reused next season.
// Never print these raw — use fmtDay()/seasonLabel() from lib/festival.ts.
export const SEASON_START = "2026-10-11";
export const SEASON_END = "2026-10-19";
export const WIPE_DATE = "2026-10-21";
export const GRIEVANCE_EMAIL = "hello@dandiyaduo.example";

// Thin-pool threshold: fewer candidates than this triggers the warming-up nudge.
export const THIN_POOL_MIN = 10;

export const CITIES = [
  { id: "bengaluru", label: "Bengaluru" },
  { id: "delhi_ncr", label: "Delhi NCR" },
  { id: "pune", label: "Pune" },
] as const;
export type CityId = (typeof CITIES)[number]["id"];

export function cityLabel(id: string | null | undefined) {
  return CITIES.find((c) => c.id === id)?.label ?? "your city";
}

export function seasonNights(): string[] {
  const out: string[] = [];
  const d = new Date(`${SEASON_START}T00:00:00`);
  const end = new Date(`${SEASON_END}T00:00:00`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function nightLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const GENDERS = [
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "nonbinary", label: "Non-binary" },
] as const;

export const SEEKINGS = [
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "anyone", label: "Anyone" },
  { id: "group", label: "A group to join" },
] as const;

export const DANCE_LEVELS = [
  { id: "first_timer", label: "First-timer" },
  { id: "basic_taali", label: "I know the basic taali" },
  { id: "circle_lead", label: "I lead the circle" },
] as const;

export const INTENTIONS = [
  { id: "just_dance", label: "Just here to dance" },
  { id: "find_group", label: "Looking for a group" },
  { id: "dance_food", label: "Dance + after-garba food" },
  { id: "open_more", label: "Open to something more" },
] as const;

export const HOW_FAR = [
  { id: "same_area", label: "Same area only" },
  { id: "nearby", label: "Nearby zones" },
  { id: "anywhere", label: "Anywhere nearby" },
] as const;

/** "Anywhere" wording depends on metro pooling (brief §3). */
export function anywhereLabel(metroOn: boolean) {
  return metroOn ? "Anywhere in my metro" : "Anywhere in my city";
}

export const LANGUAGES = ["Hindi", "English", "Kannada", "Gujarati", "Marathi", "Punjabi", "Tamil", "Telugu", "Bengali", "Other"];
export const WORKS = ["Tech", "Design", "Product", "Marketing", "Founder", "Finance", "Student", "Creative", "Other"];
export const INTERESTS = ["Music", "Travel", "Books", "Fitness", "Gaming", "Photography", "Food", "Dance", "Art", "Trekking"];
export const MOVIE_GENRES = ["Comedy", "Romance", "Action", "Thriller", "Horror", "Drama", "Sci-fi", "Animation", "Documentary", "Bollywood masala"];
export const CUISINES = ["Gujarati", "South Indian", "North Indian", "Chinese", "Italian", "Street food", "Mexican", "Japanese", "Thai", "Desserts"];
export const DIETS = [
  { id: "veg", label: "Veg" },
  { id: "jain", label: "Jain" },
  { id: "eggetarian", label: "Eggetarian" },
  { id: "non_veg", label: "Non-veg" },
] as const;

export const AFTER_GARBA = [
  { id: "street_food", label: "Street food" },
  { id: "cafe", label: "A cafe" },
  { id: "dinner", label: "A proper dinner" },
  { id: "straight_home", label: "Straight home" },
  { id: "flexible", label: "Flexible" },
] as const;

export const STAR_SIGNS = [
  { n: 1, label: "Aries", glyph: "♈" },
  { n: 2, label: "Taurus", glyph: "♉" },
  { n: 3, label: "Gemini", glyph: "♊" },
  { n: 4, label: "Cancer", glyph: "♋" },
  { n: 5, label: "Leo", glyph: "♌" },
  { n: 6, label: "Virgo", glyph: "♍" },
  { n: 7, label: "Libra", glyph: "♎" },
  { n: 8, label: "Scorpio", glyph: "♏" },
  { n: 9, label: "Sagittarius", glyph: "♐" },
  { n: 10, label: "Capricorn", glyph: "♑" },
  { n: 11, label: "Aquarius", glyph: "♒" },
  { n: 12, label: "Pisces", glyph: "♓" },
];

export const WEIGHT_MODES = [
  { id: 0, label: "Skip" },
  { id: 1, label: "For fun" },
  { id: 2.5, label: "Big deal" },
] as const;
