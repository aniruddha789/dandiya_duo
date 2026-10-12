import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { GRIEVANCE_EMAIL, WIPE_DATE } from "@/lib/config";

export const metadata = { title: "Safety — DandiyaDuo" };

export default function Safety() {
  return (
    <AppShell showNav={false}>
      <div className="mx-auto max-w-2xl pt-6">
        <h1 className="headline font-display text-4xl font-black">Dance safe, duo</h1>
        <div className="mt-5 flex flex-col gap-4">
          <Card>
            <h2 className="font-display text-xl font-bold">18+ only</h2>
            <p className="mt-1 text-sm">Everyone here confirms they are 18 or older, and accounts are verified by email. If you suspect someone is underage, report them — we act fast in season.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">Your handle stays yours</h2>
            <p className="mt-1 text-sm">Instagram handles unlock only when both people tap “Let’s dance”. Never share personal details with someone you haven’t matched with.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">Meet where the crowd is</h2>
            <p className="mt-1 text-sm">Meet at the actual garba night — a public, crowded venue. Tell a friend where you’re going, keep your phone charged, and trust your gut.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">Report and block, one tap</h2>
            <p className="mt-1 text-sm">Every card has Report and Block. Blocked people can never see, match or reach you again. A human reads every report within 24 hours during the festival.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">You’re in control</h2>
            <p className="mt-1 text-sm">Pause, edit or permanently delete your profile any time from Account. Everything — profiles, photos, matches — is deleted on {WIPE_DATE}.</p>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">What we never do</h2>
            <p className="mt-1 text-sm">No payments, ever. No showing your handle to non-matches. No messages sent on your behalf. If you’re in danger, contact local emergency services first, then write to us at {GRIEVANCE_EMAIL}.</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
