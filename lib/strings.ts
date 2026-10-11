/**
 * All user-facing strings live here (English default) so Hindi/Gujarati can
 * be added later. No raw ISO dates — compose dates via lib/festival.ts.
 * Glossary: "match" stays; "saathi" is now "Duo"; mutual matches are "Duos".
 */
export const en = {
  brand: "DandiyaDuo",
  tagline: "Find your circle this Navratri.",
  heroH1a: "Find your ",
  heroH1b: "DandiyaDuo.",
  heroSub: "Match with a dance partner for Navratri. Free. Mutual match only. Gone after the festival.",
  ctaPrimary: "Create my profile",
  howItWorksLink: "How it works",
  cityLabel: "Your city",
  cityPlaceholder: "Choose city",
  cityDetecting: "Detecting…",
  cityNotHere: "Not here? Tell us",
  badgeBefore: (n: number) => `Navratri starts in ${n} day${n === 1 ? "" : "s"}`,
  badgeDuring: (n: number) => `Navratri is on, ${n} night${n === 1 ? "" : "s"} left`,
  tonightLine: "Tonight's the night, say yes to a dance.",
  afterThanks: "See you next Navratri",
  afterThanksSub: "The circle has closed for this season. Leave your email and we'll nudge you when matching opens again.",
  waitlistPlaceholder: "you@example.com",
  waitlistButton: "Notify me",
  waitlistDone: "You're on the list. Chalo dance, next season!",
  waitlistConsent: "Only used for the reopening nudge. Delete on request — just reply to any email.",
  promises: [
    "18+ only.",
    "Free, forever this season.",
    "Your Instagram stays hidden until you BOTH say yes.",
    "Report or block in one tap.",
    "Everything is deleted after the festival.",
  ],
  howSteps: [
    { title: "Tell us your plans", text: "Nights, dance level, vibe. Two minutes, tops." },
    { title: "Get ranked Duos", text: "One score with real reasons — shared nights, food, films, stars." },
    { title: "Say yes", text: "Both yes = Instagram unlocks. Just here to dance? There's an option for that." },
  ],
  whyCards: [
    { title: "One score, real reasons", text: "Nights, distance, food, films and stars become a vibe score — with the reasons spelled out, never a bare number." },
    { title: "Private by design", text: "Your handle unlocks only on a mutual yes. Your dealbreakers are never shown to anyone. Report or block anyone in one tap." },
    { title: "Gone after the festival", text: "Profiles, photos and matches are wiped after Navratri. Pause, edit or delete any time before that." },
  ],
  safetyStrip: {
    title: "Safe by default",
    items: ["18+ only", "Mutual match only", "Report and block", "Deleted after Navratri"],
    link: "Read the safety guide",
  },
  faq: [
    { q: "Is it free?", a: "Yes. Free all season. We never ask for money, deposits or tickets — you sort the venue after you connect." },
    { q: "Who can see my Instagram?", a: "Only someone you both said yes to. Nobody else — not even in an API response. Unmatch or block and it locks again in the app." },
    { q: "How are matches decided?", a: "Shared nights, distance, intention, food, films, languages and star signs roll into one score out of 100, with the reasons shown on every card. Star signs are just for fun." },
    { q: "What if there's no one in my city yet?", a: "You'll see a warming-up note. Share your link, add more nights, or turn on nearby cities in your metro. New people join every day in season." },
    { q: "How do I delete my profile?", a: "Account → Delete my account. It removes your profile, photos, handle and login immediately. Everything left is wiped after the festival anyway." },
    { q: "Is this a dating app?", a: "It's for finding dance partners and groups for Navratri. People decide what they want — “Just here to dance” and “Looking for a group” are first-class options." },
    { q: "What happens after Navratri?", a: "Matching closes and everything is deleted. If you joined the waitlist, you'll get one email when we reopen." },
  ],
  finalCta: "Your circle is waiting.",
  footerCredit: "Made with dandiya-stick energy for Navratri dancers.",
  emptyMatches: "Your DandiyaDuo is still warming up. More people join every day, share your link and check back soon.",
  emptyDuos: "No Duos yet. Tap “Let's dance” on someone you like.",
  matchMoment: "It's a Duo!",
  sampleLabel: "Example",
} as const;

export type Strings = typeof en;
