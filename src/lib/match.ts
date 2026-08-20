export function mentionQuery(cluster: {
  slug: string;
  keywords: string;
  name?: string;
}): string {
  const skip = new Set(["ai", "with", "the", "and", "for", "sms"]);
  const mapped = (KEYWORD_MAP[cluster.slug] ?? []).map((k) => k.toLowerCase());
  const first = mapped[0];
  if (first && first.split(/\s+/).length >= 2) return first;
  const bits = cluster.slug
    .split("-")
    .map((b) => b.toLowerCase())
    .filter((b) => b.length >= 3 && !skip.has(b));
  if (bits.length >= 2) return `${bits[0]} ${bits[1]}`;
  const two = mapped.find((k) => k.split(/\s+/).length >= 2);
  if (two) return two;
  if (first) return first;
  const kw = cluster.keywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length >= 3 && !skip.has(k));
  return kw[0] ?? bits[0] ?? cluster.slug;
}

/** Whole phrase from mentionQuery. Blocks KEYWORD_MAP one-word bait (agent, pdf, farm). */
export function hayContainsMention(hay: string, q: string): boolean {
  const n = normalize(hay);
  const p = normalize(q);
  if (!n || !p) return false;
  if (p.includes(" ")) return n.includes(p);
  if (p.length < 4) return false;
  return n.split(" ").includes(p);
}

export type MatchableCluster = {
  slug: string;
  name: string;
  keywords: string;
};

export const UNCLASSIFIED = "unclassified";

export const KEYWORD_MAP: Record<string, string[]> = {
  "chatgpt-wrapper": [
    "chatgpt wrapper",
    "gpt wrapper",
    "llm wrapper",
    "chatgpt",
  ],
  "ai-resume": ["resume", "cv", "curriculum", "ai resume", "resume builder"],
  "chat-with-pdf": [
    "pdf",
    "chat-pdf",
    "chatpdf",
    "chat with pdf",
    "ask pdf",
  ],
  "meeting-notes": ["meeting", "call summary", "transcript", "zoom recap"],
  "linkedin-ghostwriter": ["linkedin", "ghostwriter"],
  "ai-thumbnails": ["thumbnail", "youtube thumbnail"],
  "ai-email-writer": ["email writer", "ai email", "outreach"],
  "instagram-carousel-ai": ["instagram", "carousel"],
  "client-portal": ["client portal", "agency portal"],
  "landing-page-ai": ["landing page builder", "ai landing page", "waitlist"],
  "room-curtain-visualizer": [
    "curtain",
    "curtains",
    "curtain-viz",
    "room photo",
    "room visualizer",
    "drape",
    "visualizer",
  ],
  "dating-profile-photo-ai": ["dating", "tinder", "hinge", "profile photo"],
  "tiktok-mrr-tracker": ["tiktok", "mrr tracker"],
  "dental-recall-sms": ["dental", "dentist", "recall"],
  "funeral-obituary-cms": ["funeral", "obituary"],
  "support-inbox-agent": ["support inbox", "zendesk", "intercom agent"],
  "sheets-copilot": ["spreadsheet", "sheets copilot", "excel copilot"],
  "hvac-voice-agent": ["hvac", "dispatch", "voice agent"],
  "farm-sop-wiki": ["farm sop", "sop wiki", "farm"],
  "church-bulletin-ai": ["church", "bulletin", "parish"],
  "proposal-deck-ai": ["proposal", "pitch deck"],
  "freelance-contract-ai": ["freelance contract", "msa"],
  "accountant-white-label": ["accountant", "white label"],
  "ai-headshot": ["headshot", "headshots"],
  "photo-colorize": ["colorize", "old photo"],
  "pet-lost-poster": ["lost pet poster", "missing dog"],
  "qr-menu": ["qr menu", "restaurant menu"],
  "salon-booking-sms": ["salon", "barber", "booking"],
  "invoice-pdf-ai": ["invoice", "invoicing"],
  "ynab-wrapper": ["budget", "ynab", "envelope"],
  "etsy-fee-calc": ["etsy", "etsy fees"],
  "vet-recall-sms": ["vet recall", "veterinary recall", "rabies reminder"],
  "auto-shop-sms": ["auto shop reminder", "repair shop sms", "mechanic reminder"],
  "property-manager-solo": [
    "solo landlord",
    "twelve unit landlord",
    "small landlord",
  ],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function score(text: string, cluster: MatchableCluster): number {
  const n = normalize(text);
  const words = n.split(" ").filter(Boolean);
  let s = 0;
  const extras = [
    ...(KEYWORD_MAP[cluster.slug] ?? []),
    ...cluster.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    cluster.name,
    cluster.slug.replace(/-/g, " "),
  ];
  for (const phrase of extras) {
    const p = normalize(phrase);
    if (!p) continue;
    if (n.includes(p)) s += p.split(" ").length * 4 + 3;
  }
  const hay = new Set(
    normalize(
      [cluster.slug.replace(/-/g, " "), cluster.name, extras.join(" ")].join(
        " ",
      ),
    ).split(" "),
  );
  for (const w of words) {
    if (w.length < 3) continue;
    if (hay.has(w)) s += 2;
  }
  return s;
}

export function matchClusterScored(
  rawText: string,
  clusters: MatchableCluster[],
  minScore = 4,
): { slug: string; score: number } {
  const n = normalize(rawText);
  if (!n) return { slug: UNCLASSIFIED, score: 0 };
  let best: { slug: string; score: number } | null = null;
  for (const c of clusters) {
    if (c.slug === UNCLASSIFIED) continue;
    const sc = score(rawText, c);
    if (!best || sc > best.score) best = { slug: c.slug, score: sc };
  }
  if (!best || best.score < minScore) {
    return { slug: UNCLASSIFIED, score: best?.score ?? 0 };
  }
  return best;
}

export function matchCluster(
  rawText: string,
  clusters: MatchableCluster[],
): string {
  return matchClusterScored(rawText, clusters).slug;
}
