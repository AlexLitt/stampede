import { upsertChannel, type BumpSeed, type ReceiptChannel } from "./bump-seed";
import { hayContainsMention, matchClusterScored, mentionQuery } from "./match";
import { SEARCH } from "./receipts";

const BASE = "https://flippa.com/v3/listings";
const PAGE = 20;
const MAX_PAGES = 5;
const MATCH_MIN = 12;

export type FlippaListing = {
  id: number | string;
  title?: string;
  summary?: string;
  property_name?: string;
  html_url?: string;
  industry?: string;
  average_revenue?: number | null;
  has_verified_revenue?: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function listPage(page: number): Promise<FlippaListing[]> {
  const url = `${BASE}?page%5Bnumber%5D=${page}&page%5Bsize%5D=${PAGE}&filter%5Bproperty_type%5D=saas&sort_alias=most_recent`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Flippa ${res.status}`);
  const json = (await res.json()) as { data?: FlippaListing[] };
  return json.data ?? [];
}

export async function fetchFlippaListings(log = console.log): Promise<FlippaListing[]> {
  const rows: FlippaListing[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await listPage(page);
    rows.push(...data);
    log(`flippa page ${page} · ${data.length} · total ${rows.length}`);
    if (data.length < PAGE) break;
    await sleep(400);
  }
  return rows;
}

export function applyFlippa(
  seed: BumpSeed,
  rows: FlippaListing[],
  log = console.log,
): BumpSeed {
  const clusters = seed.clusters.map((c) => ({
    slug: c.slug,
    name: c.name,
    keywords: c.keywords,
  }));
  const now = new Date().toISOString();
  const best = new Map<
    string,
    { row: FlippaListing; score: number; count: number }
  >();

  for (const row of rows) {
    const hay = `${row.property_name ?? ""} ${row.title ?? ""} ${row.summary ?? ""} ${row.industry ?? ""}`;
    const eligible = clusters.filter((c) =>
      hayContainsMention(hay, mentionQuery(c)),
    );
    if (!eligible.length) continue;
    const hit = matchClusterScored(hay, eligible, MATCH_MIN);
    if (hit.slug === "unclassified") continue;
    const prev = best.get(hit.slug);
    if (!prev) best.set(hit.slug, { row, score: hit.score, count: 1 });
    else {
      prev.count += 1;
      if (hit.score > prev.score) {
        prev.row = row;
        prev.score = hit.score;
      }
    }
  }

  for (const c of seed.clusters) {
    const hit = best.get(c.slug);
    const q = SEARCH[c.slug] ?? c.name;
    if (!hit) {
      upsertChannel(seed, c.slug, {
        channel: "flippa",
        query: q,
        url: `https://flippa.com/search?query=${encodeURIComponent(q)}`,
        note: "Flippa v3: no mentionQuery phrase in last 100 SaaS listings. Search URL. ESTIMATE.",
        fetchedAt: now,
      });
      continue;
    }
    const url =
      hit.row.html_url ?? `https://flippa.com/${hit.row.id}`;
    const ch: ReceiptChannel = {
      channel: "flippa",
      query: mentionQuery(c),
      url,
      title: hit.row.property_name ?? hit.row.title,
      hits: hit.count,
      note: `Flippa public v3 listings. ${hit.count} matched mentionQuery. ${hit.row.has_verified_revenue ? "Verified revenue badge." : "Revenue unverified."} ESTIMATE. Not a TrustMRR receipt.`,
      fetchedAt: now,
    };
    upsertChannel(seed, c.slug, ch);
    log(
      `${c.slug.padEnd(28)} flippa ${hit.count} · ${ch.title ?? hit.row.id}`,
    );
  }
  return seed;
}
