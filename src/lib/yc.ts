import { upsertChannel, type BumpSeed, type ReceiptChannel } from "./bump-seed";
import { hayContainsMention, matchClusterScored, mentionQuery } from "./match";

const URL = "https://yc-oss.github.io/api/companies/all.json";
const MATCH_MIN = 12;

type YcCo = {
  name?: string;
  slug?: string;
  one_liner?: string | null;
  long_description?: string | null;
  website?: string | null;
  url?: string;
  status?: string;
};

export async function fetchYcCompanies(log = console.log): Promise<YcCo[]> {
  const res = await fetch(URL, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`YC-oss ${res.status}`);
  const rows = (await res.json()) as YcCo[];
  log(`yc-oss ${rows.length} companies`);
  return rows;
}

export function applyYcCompanies(
  seed: BumpSeed,
  rows: YcCo[],
  log = console.log,
): BumpSeed {
  const clusters = seed.clusters.map((c) => ({
    slug: c.slug,
    name: c.name,
    keywords: c.keywords,
  }));
  const now = new Date().toISOString();
  const best = new Map<string, { co: YcCo; score: number; count: number }>();

  for (const co of rows) {
    if (co.status && co.status !== "Active") continue;
    const hay = `${co.name ?? ""} ${co.one_liner ?? ""}`;
    const eligible = clusters.filter((c) =>
      hayContainsMention(hay, mentionQuery(c)),
    );
    if (!eligible.length) continue;
    const hit = matchClusterScored(hay, eligible, MATCH_MIN);
    if (hit.slug === "unclassified") continue;
    const prev = best.get(hit.slug);
    if (!prev) best.set(hit.slug, { co, score: hit.score, count: 1 });
    else {
      prev.count += 1;
      if (hit.score > prev.score) {
        prev.co = co;
        prev.score = hit.score;
      }
    }
  }

  for (const c of seed.clusters) {
    const hit = best.get(c.slug);
    const q = mentionQuery(c);
    if (!hit) {
      upsertChannel(seed, c.slug, {
        channel: "ycombinator",
        query: q,
        url: `https://www.ycombinator.com/companies?query=${encodeURIComponent(q)}`,
        note: "YC directory: no one-liner contained mentionQuery. Search URL. ESTIMATE. Not a receipt.",
        fetchedAt: now,
      });
      continue;
    }
    const ch: ReceiptChannel = {
      channel: "ycombinator",
      query: q,
      url: hit.co.url ?? `https://www.ycombinator.com/companies/${hit.co.slug ?? ""}`,
      title: hit.co.name,
      hits: hit.count,
      note: `YC directory (yc-oss public JSON). ${hit.count} active companies matched mentionQuery. ESTIMATE. Not a receipt.`,
      fetchedAt: now,
    };
    upsertChannel(seed, c.slug, ch);
    log(`${c.slug.padEnd(28)} yc ${hit.count} · ${hit.co.name}`);
  }
  return seed;
}
