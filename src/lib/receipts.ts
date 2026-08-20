import type { BumpSeed, ReceiptChannel } from "./bump-seed";

const UA = "Mozilla/5.0 (compatible; StampedeWeekly/0.1; research)";

export const SEARCH: Record<string, string> = {
  "chatgpt-wrapper": "AI chatbot wrapper software",
  "ai-resume": "AI resume builder",
  "chat-with-pdf": "chat with PDF",
  "meeting-notes": "AI meeting notes",
  "linkedin-ghostwriter": "LinkedIn ghostwriter AI",
  "ai-thumbnails": "YouTube thumbnail maker",
  "ai-email-writer": "AI email writer",
  "instagram-carousel-ai": "Instagram carousel maker",
  "client-portal": "agency client portal",
  "landing-page-ai": "AI landing page builder",
  "room-curtain-visualizer": "curtain visualizer",
  "dating-profile-photo-ai": "dating profile photo AI",
  "tiktok-mrr-tracker": "MRR tracker",
  "dental-recall-sms": "dental recall software",
  "funeral-obituary-cms": "funeral home software",
  "support-inbox-agent": "AI support inbox",
  "sheets-copilot": "spreadsheet AI copilot",
  "hvac-voice-agent": "HVAC dispatch software",
  "farm-sop-wiki": "farm SOP software",
  "church-bulletin-ai": "church bulletin software",
  "proposal-deck-ai": "proposal software",
  "freelance-contract-ai": "freelance contract generator",
  "accountant-white-label": "white label bookkeeping portal",
  "ai-headshot": "AI headshot",
  "photo-colorize": "photo colorize",
  "pet-lost-poster": "lost pet poster",
  "qr-menu": "QR menu restaurant",
  "salon-booking-sms": "salon booking SMS",
  "invoice-pdf-ai": "invoice generator",
  "ynab-wrapper": "envelope budget app",
  "etsy-fee-calc": "Etsy fee calculator",
  "vet-recall-sms": "veterinary recall SMS",
  "auto-shop-sms": "auto shop reminder",
  "property-manager-solo": "solo landlord software",
};

function enc(q: string) {
  return encodeURIComponent(q);
}

function searchUrls(q: string, now: string): ReceiptChannel[] {
  return [
    {
      channel: "g2",
      query: q,
      url: `https://www.g2.com/search?query=${enc(q)}`,
      note: "Search link only. G2 ToS blocks scrape.",
      fetchedAt: now,
    },
    {
      channel: "capterra",
      query: q,
      url: `https://www.capterra.com/search/?query=${enc(q)}`,
      note: "Search link only. Capterra ToS blocks scrape.",
      fetchedAt: now,
    },
    {
      channel: "trustpilot",
      query: q,
      url: `https://www.trustpilot.com/search?query=${enc(q)}`,
      note: "Search link only. Trustpilot ToS blocks scrape.",
      fetchedAt: now,
    },
    {
      channel: "upwork",
      query: q,
      url: `https://www.upwork.com/nx/search/jobs/?q=${enc(q)}`,
      note: "Search link only until UPWORK_ACCESS_TOKEN (official GraphQL).",
      fetchedAt: now,
    },
    {
      channel: "flippa",
      query: q,
      url: `https://flippa.com/search?query=${enc(q)}`,
      note: "Flippa search. Live v3 listings overlay this when the weekly job runs.",
      fetchedAt: now,
    },
    {
      channel: "acquire",
      query: q,
      url: `https://acquire.com/search?q=${enc(q)}`,
      note: "Search link only. Acquire.com ToS forbids scrape. No public API.",
      fetchedAt: now,
    },
  ];
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type ItunesHit = {
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
  averageUserRating?: number;
  userRatingCount?: number;
};

function itunesChannel(
  query: string,
  hit: ItunesHit | undefined,
  pinned: boolean,
): ReceiptChannel {
  const q = query;
  if (!hit) {
    return {
      channel: "appstore",
      query: q,
      url: `https://www.apple.com/us/search/${enc(q)}?src=serp`,
      note: pinned
        ? "Pinned itunesTrackId. Lookup returned nothing."
        : "No pinned itunesTrackId. Search link only. Not a receipt.",
      fetchedAt: new Date().toISOString(),
    };
  }
  return {
    channel: "appstore",
    query: q,
    url: hit.trackViewUrl ?? `https://apps.apple.com/app/id${hit.trackId}`,
    title: hit.trackName,
    rating: hit.averageUserRating
      ? Math.round(hit.averageUserRating * 10) / 10
      : undefined,
    reviews: hit.userRatingCount,
    note: pinned
      ? `iTunes Lookup API. Pinned track ${hit.trackId}. This listing.`
      : "iTunes Search API. Nearest listing for the query. Not the cluster. ESTIMATE. Not a receipt.",
    fetchedAt: new Date().toISOString(),
  };
}

async function itunesLookup(id: string): Promise<ItunesHit | undefined> {
  const data = (await getJson(
    `https://itunes.apple.com/lookup?id=${enc(id)}&country=us&entity=software`,
  )) as { results?: ItunesHit[] } | null;
  return data?.results?.[0];
}

async function itunesSearch(q: string): Promise<ItunesHit | undefined> {
  const data = (await getJson(
    `https://itunes.apple.com/search?term=${enc(q)}&entity=software&limit=1`,
  )) as { results?: ItunesHit[] } | null;
  return data?.results?.[0];
}

function playChannel(
  pkg: string | undefined,
  q: string,
  now: string,
): ReceiptChannel {
  if (pkg) {
    return {
      channel: "playstore",
      query: pkg,
      url: `https://play.google.com/store/apps/details?id=${enc(pkg)}`,
      title: pkg,
      note: "Pinned Google Play package. No public lookup API. Listing URL only. Not scraped.",
      fetchedAt: now,
    };
  }
  return {
    channel: "playstore",
    query: q,
    url: `https://play.google.com/store/search?q=${enc(q)}&c=apps`,
    note: "No pinned playPackage. Search link only. Not a receipt.",
    fetchedAt: now,
  };
}

function redditSearchOnly(q: string, now: string): ReceiptChannel {
  return {
    channel: "reddit",
    query: q,
    url: `https://www.reddit.com/search/?q=${enc(q)}`,
    note: "Search link only. Reddit public JSON is blocked for new apps.",
    fetchedAt: now,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function applyPinnedReceipt(c: BumpSeed["clusters"][number], store: ReceiptChannel) {
  if (!c.receipt || c.lane !== "empty") return;
  if (!store.title) return;
  if (store.rating) c.receipt.rating = store.rating;
  if (store.reviews) c.receipt.reviews = store.reviews;
}

export async function refreshListingChannels(
  seed: BumpSeed,
  log = console.log,
): Promise<BumpSeed> {
  const now = new Date().toISOString();
  for (const c of seed.clusters) {
    const q = SEARCH[c.slug] ?? c.name;
    let store: ReceiptChannel;
    if (c.itunesTrackId) {
      const hit = await itunesLookup(c.itunesTrackId);
      store = itunesChannel(c.itunesTrackId, hit, true);
      applyPinnedReceipt(c, store);
      await sleep(250);
    } else if (c.lane === "empty") {
      store = itunesChannel(q, undefined, false);
    } else {
      const hit = await itunesSearch(q);
      store = itunesChannel(q, hit, false);
      await sleep(250);
    }
    const play = playChannel(c.playPackage, q, now);
    const keep = (c.channels ?? []).filter((x) =>
      [
        "trustmrr",
        "hackernews",
        "github",
        "producthunt",
        "ycombinator",
        "keywords",
      ].includes(x.channel),
    );
    const channels = [
      ...searchUrls(q, now),
      store,
      play,
      redditSearchOnly(q, now),
      ...keep,
    ];
    c.channels = channels;
    if (c.receipt) c.receipt.channels = channels;
    log(
      `${c.slug.padEnd(28)} ${
        c.itunesTrackId
          ? store.title
            ? `app pin ${store.rating ?? "—"}★`
            : "app pin —"
          : c.lane === "empty"
            ? "app unpinned"
            : store.title
              ? `app ${store.rating ?? "—"}★`
              : "app —"
      }${c.playPackage ? " · play pin" : ""}`,
    );
  }
  return seed;
}