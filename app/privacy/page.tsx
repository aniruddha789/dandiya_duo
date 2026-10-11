import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { GRIEVANCE_EMAIL } from "@/lib/config";
import { seasonLabel, wipeLabel } from "@/lib/festival";

export const metadata = { title: "Privacy — DandiyaDuo" };

export default function Privacy() {
  return (
    <AppShell showNav={false}>
      <div className="mx-auto max-w-2xl pt-6">
        <h1 className="headline font-display text-4xl font-extrabold">Privacy, in plain words</h1>
        <div className="mt-5 flex flex-col gap-4 text-sm">
          <Card>
            <h2 className="font-display text-xl font-bold">What we collect and why</h2>
            <p className="mt-1 on-light-muted">Your profile details (name, age, city, garba plans, tastes), up to 3 photos, and your Instagram handle — only to rank Duos and reveal handles on a mutual yes. This consent is taken under India’s DPDP Act, 2023.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">Who sees what</h2>
            <p className="mt-1 on-light-muted">Other users see your Duo card through a locked feed — never your Instagram handle or your dealbreakers. Handles unlock only for mutual Duos. Dealbreakers are used for ranking and never shown to anyone. We never read your IP for location beyond a coarse city guess, and we never store it.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">Waitlist and city requests</h2>
            <p className="mt-1 on-light-muted">If you join the waitlist or request your city, we store only your email (and the city name you typed). One reopening email, and we delete it on request — just reply to any email.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">Deletion and withdrawal</h2>
            <p className="mt-1 on-light-muted">Delete your account any time from Account — it removes your profile, photos, handle and login immediately. Whatever remains is wiped for everyone on {wipeLabel()}, after the {seasonLabel()} season. Contact {GRIEVANCE_EMAIL} for corrections or grievances.</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
