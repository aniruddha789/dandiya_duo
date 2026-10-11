import { redirect } from "next/navigation";
import MatchesFeed from "@/components/MatchesFeed";
import { createClient } from "@/lib/supabase/server";

export default async function Matches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/matches");
  const { data: profile } = await supabase.from("profiles").select("city,is_live").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");
  if (!profile.is_live) redirect("/onboarding");
  return <MatchesFeed city={profile.city} />;
}
