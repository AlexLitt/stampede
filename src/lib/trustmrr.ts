import type { BumpSeed, ReceiptChannel } from "./bump-seed";
import { matchClusterScored, UNCLASSIFIED } from "./match";

const BASE = "https://trustmrr.com/api/v1/startups";
const PAGE_LIMIT = 10;
const MAX_PAGES = 20;
const MATCH_MIN = 10;
const RECEIPT_MIN = 20;

function rowSkipReason(row: TrustMrrRow): string | null {
  const n = (row.name ?? "").toLowerCase();
  const s = (row.slug ?? "").toLowerCase();
  if (row.slug === "trustmrr") return "self";
  if (n.includes("anonymous") || s.includes("anonymous")) return "anonymous";
  if (n.includes("stealth") || s.startsWith("stealth-")) return "stealth";
  if (s.startsWith("unnamed-") || n.includes("unnamed")) return "unnamed";
  if (s.startsWith("hidden-")) return "hidden";
  if (s.startsWith("private-venture")) return "private-venture";
  return null;
}

export type TrustMrrQueueItem = {
  slug: string;
  name: string;
  category: string | null;
  website: string | null;
  mrrUsd: number | null;
  why: "unmatched";
};

export function buildTrustMrrQueue(
  seed: BumpSeed,
  rows: TrustMrrRow[],
): TrustMrrQueueItem[] {
  const clusters = seed.clusters.map((c) => ({
    slug: c.slug,
    name: c.name,
    keywords: c.keywords,
  }));
  return rows
    .filter((row) => !rowSkipReason(row))
    .filter((row) => {
      const hay = `${row.name} ${row.description ?? ""}`;
      return matchClusterScored(hay, clusters, MATCH_MIN).slug === UNCLASSIFIED;
    })
    .sort((a, b) => (b.revenue?.mrr ?? 0) - (a.revenue?.mrr ?? 0))
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      category: row.category,
      website: row.website,
      mrrUsd: centsToUsd(row.revenue?.mrr),
      why: "unmatched" as const,
    }));
}

export type TrustMrrRow = {
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  category: string | null;
  customers: number | null;
  activeSubscriptions: number | null;
  revenue?: { mrr?: number | null; last30Days?: number | null };
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function centsToUsd(cents: number | null | undefined): number | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return Math.round(cents / 100);
}

async function listPage(
  key: string,
  page: number,
): Promise<{ data: TrustMrrRow[]; hasMore: boolean; rateLimited?: boolean }> {
  const url = `${BASE}?page=${page}&limit=${PAGE_LIMIT}&sort=revenue-desc`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (res.status === 429) {
      const wait = 8000 * (attempt + 1);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      throw new Error(`TrustMRR ${res.status}`);
    }
    const json = (await res.json()) as {
      data?: TrustMrrRow[];
      meta?: { hasMore?: boolean };
    };
    return {
      data: json.data ?? [],
      hasMore: Boolean(json.meta?.hasMore),
    };
  }
  return { data: [], hasMore: false, rateLimited: true };
}

export async function fetchTrustMrrStartups(
  key: string,
  log = console.log,
): Promise<TrustMrrRow[]> {
  const rows: TrustMrrRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, hasMore, rateLimited } = await listPage(key, page);
    if (rateLimited) {
      log(`trustmrr page ${page} · 429 persisted · keep ${rows.length}`);
      break;
    }
    rows.push(...data);
    log(`trustmrr page ${page} · ${data.length} · total ${rows.length}`);
    if (!hasMore) break;
    await sleep(6000);
  }
  return rows;
}

export function applyTrustMrr(
  seed: BumpSeed,
  rows: TrustMrrRow[],
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
    { row: TrustMrrRow; score: number }
  >();

  for (const row of rows) {
    if (rowSkipReason(row)) continue;
    const hay = `${row.name} ${row.description ?? ""}`;
    const hit = matchClusterScored(hay, clusters, MATCH_MIN);
    if (hit.slug === UNCLASSIFIED) continue;
    const prev = best.get(hit.slug);
    const mrr = row.revenue?.mrr ?? 0;
    if (
      !prev ||
      hit.score > prev.score ||
      (hit.score === prev.score && mrr > (prev.row.revenue?.mrr ?? 0))
    ) {
      best.set(hit.slug, { row, score: hit.score });
    }
  }

  for (const c of seed.clusters) {
    const hit = best.get(c.slug);
    if (!hit) {
      c.channels = (c.channels ?? []).filter((x) => x.channel !== "trustmrr");
      if (c.receipt) {
        c.receipt.channels = (c.receipt.channels ?? []).filter(
          (x) => x.channel !== "trustmrr",
        );
      }
      continue;
    }
    const mrrUsd = centsToUsd(hit.row.revenue?.mrr);
    const url = `https://trustmrr.com/${hit.row.slug}`;
    const ch: ReceiptChannel = {
      channel: "trustmrr",
      query: c.slug,
      url,
      title: hit.row.name,
      note:
        hit.score >= RECEIPT_MIN
          ? `TrustMRR verified. Matched ${c.slug} (score ${hit.score}). Founder copy unused.`
          : `TrustMRR candidate only (score ${hit.score} < ${RECEIPT_MIN}). Not a receipt.`,
      fetchedAt: now,
    };
    c.channels = [...(c.channels ?? []).filter((x) => x.channel !== "trustmrr"), ch];
    if (c.receipt) {
      c.receipt.channels = [
        ...(c.receipt.channels ?? []).filter((x) => x.channel !== "trustmrr"),
        ch,
      ];
      if (hit.score >= RECEIPT_MIN) {
        if (mrrUsd != null) c.receipt.mrrUsd = mrrUsd;
        if (hit.row.activeSubscriptions != null) {
          c.receipt.subs = hit.row.activeSubscriptions;
        }
        c.receipt.source = `TrustMRR · ${url}`;
        c.receipt.label = "TRUSTMRR";
      }
    }
    log(
      `${c.slug.padEnd(28)} trustmrr ${hit.row.slug} · mrr $${mrrUsd ?? "—"} · ${c.lane} · score ${hit.score}${hit.score >= RECEIPT_MIN ? "" : " (no receipt)"}`,
    );
  }

  const queue = buildTrustMrrQueue(seed, rows);
  log(`trustmrr matched ${best.size} clusters · named unmatched ${queue.length}/${rows.length}`);
  for (const row of queue.slice(0, 20)) {
    log(
      `  queue ${row.slug.padEnd(28)} $${row.mrrUsd ?? "—"} · ${row.name} · ${row.category ?? "—"}`,
    );
  }

  return seed;
}
