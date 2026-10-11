export type Area = { id: string; city: string | null; city_id: string | null; name: string; zone: string };

export type MatchCard = {
  profile_id: string;
  first_name: string;
  age: number;
  gender: string;
  seeking: string;
  city: string;
  area_name: string | null;
  zone: string | null;
  dance_level: string;
  intention: string;
  languages: string[];
  hometown: string | null;
  work: string | null;
  diet: string | null;
  cuisines: string[];
  after_garba: string | null;
  star_sign: number | null;
  prompt_move: string | null;
  prompt_nonneg: string | null;
  photo_paths: string[];
  nights: string[];
  shared_nights: number;
  score: number;
  breakdown: Record<string, number>;
  reasons: string[];
};

export type Connection = {
  match_id: string;
  profile_id: string;
  first_name: string;
  age: number;
  area_name: string | null;
  dance_level: string;
  intention: string;
  photo_paths: string[];
  score: number;
  matched_at: string;
};

export const photoUrl = (path: string) => `/api/photo?p=${encodeURIComponent(path)}`;
