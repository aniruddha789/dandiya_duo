import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/onboarding";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth callback exchange failed:", error.message);
      const login = new URL("/login", url.origin);
      login.searchParams.set("next", next);
      login.searchParams.set("error", error.message);
      return NextResponse.redirect(login);
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
