import { upsertChannel, type BumpSeed, type ReceiptChannel } from "./bump-seed";
import { mentionQuery } from "./match";

const ENDPOINT =
  "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live";

type VolRow = {
  keyword?: string;
  search_volume?: number | null;
  competition?: number | null;
  cpc?: number | null;
};

export async function fetchSearchVolumes(
  login: string,
  password: string,
  keywords: string[],
  log = console.log,
): Promise<Map<string, VolRow>> {
  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keywords,
        location_code: 2840,
        language_code: "en",
      },
    ]),
  });
  if (res.status === 401 || res.status === 402 || res.status === 403) {
    throw new Error(`DataForSEO ${res.status}`);
  }
  if (!res.ok) throw new Error(`DataForSEO ${res.status}`);
  const json = (await res.json()) as {
    tasks?: { result?: VolRow[] }[];
  };
  const out = new Map<string, VolRow>();
  for (const row of json.tasks?.[0]?.result ?? []) {
    if (row.keyword) out.set(row.keyword.toLowerCase(), row);
  }
  log(`dataforseo ${out.size} keyword volumes`);
  return out;
}

export async function applyKeywordVolumes(
  seed: BumpSeed,
  login: string,
  password: string,
  log = console.log,
): Promise<BumpSeed> {
  const now = new Date().toISOString();
  const kws = [...new Set(seed.clusters.map((c) => mentionQuery(c)))];
  const vols = await fetchSearchVolumes(login, password, kws, log);
  for (const c of seed.clusters) {
    const q = mentionQuery(c);
    const row = vols.get(q);
    const ch: ReceiptChannel = {
      channel: "keywords",
      query: q,
      url: `https://ads.google.com/aw/keywordplanner/home`,
      title: q,
      hits: row?.search_volume ?? undefined,
      note: row
        ? `Google Ads search volume via DataForSEO. ${row.search_volume ?? "—"}/mo US. ESTIMATE demand, not builders.`
        : "DataForSEO returned no volume for this query. ESTIMATE.",
      fetchedAt: now,
    };
    upsertChannel(seed, c.slug, ch);
    if (row?.search_volume != null) {
      log(`${c.slug.padEnd(28)} kw ${row.search_volume}/mo · ${q}`);
    }
  }
  return seed;
}
