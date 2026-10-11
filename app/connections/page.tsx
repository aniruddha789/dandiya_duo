import { redirect } from "next/navigation";
import ConnectionsPage from "@/components/ConnectionsList";
import { createClient } from "@/lib/supabase/server";

export default async function Connections() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/connections");
  return <ConnectionsPage />;
}
