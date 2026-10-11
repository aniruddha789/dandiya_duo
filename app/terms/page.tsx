import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { SEASON_LABEL, WIPE_DATE } from "@/lib/config";

export const metadata = { title: "Terms — DandiyaDuo" };

export default function Terms() {
  return (
    <AppShell showNav={false}>
      <div className="mx-auto max-w-2xl pt-6">
        <h1 className="headline font-display text-4xl font-black">House rules</h1>
        <div className="mt-5 flex flex-col gap-4 text-sm">
          <Card><h2 className="font-display text-xl font-bold">The short version</h2>
            <p className="mt-1">DandiyaDuo is a free, seasonal way to find garba partners for {SEASON_LABEL} in three cities. You must be 18+. Be kind, show up, and don’t be creepy.</p></Card>
          <Card><h2 className="font-display text-xl font-bold">Your promises</h2>
            <p className="mt-1">You are 18 or older; your photos are yours; you won’t harass, stalk, spam or share anyone’s details outside the app. One strike for harassment and you’re out.</p></Card>
          <Card><h2 className="font-display text-xl font-bold">Our promises</h2>
            <p className="mt-1">Free forever this season. No ticket sales — you sort the venue after you connect. No ads, no data sale, and a full wipe on {WIPE_DATE}.</p></Card>
          <Card><h2 className="font-display text-xl font-bold">Matches aren’t magic</h2>
            <p className="mt-1">Scores are playful ranking signals, not compatibility science. Meeting anyone is your call and your responsibility — public places only.</p></Card>
        </div>
      </div>
    </AppShell>
  );
}
