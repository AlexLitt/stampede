import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadBumpSeed } from "../src/lib/bump-seed";
import { applyTrustMrr, fetchTrustMrrStartups } from "../src/lib/trustmrr";
import { applyHnMentions, countHnStories } from "../src/lib/hn";
import { applyGithubMentions } from "../src/lib/github-search";
import { applyProductHunt, fetchProductHuntWeek } from "../src/lib/producthunt";
import { isoWeekIdFromUtc } from "../src/lib/week";
import { SEARCH } from "../src/lib/receipts";
import { matchClusterScored, UNCLASSIFIED } from "../src/lib/match";

function loadDotenv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const k = t.slice(0, i);
      let v = t.slice(i + 1);
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (process.env[k] == null) process.env[k] = v;
    }
  } catch {
    /* no .env */
  }
}

function chHits(seed: ReturnType<typeof loadBumpSeed>, slug: string, channel: string) {
  const c = seed.clusters.find((x) => x.slug === slug);
  const hit = (c?.channels ?? []).find((x) => x.channel === channel);
  return { hits: hit?.hits ?? null, title: hit?.title ?? null, note: hit?.note ?? null };
}

async function main() {
  loadDotenv();
  const weekId = isoWeekIdFromUtc();
  let seed = loadBumpSeed();
  const report: Record<string, unknown> = { weekId, started: new Date().toISOString() };

  const tmrrKey = process.env.TRUSTMRR_API_KEY;
  if (!tmrrKey) throw new Error("TRUSTMRR_API_KEY missing");
  const rows = await fetchTrustMrrStartups(tmrrKey);
  seed = applyTrustMrr(seed, rows);
  const clusters = seed.clusters.map((c) => ({
    slug: c.slug,
    name: c.name,
    keywords: c.keywords,
    lane: c.lane,
  }));
  const unmatched = rows
    .filter((row) => {
      const hay = `${row.name} ${row.description ?? ""}`;
      return matchClusterScored(hay, clusters, 10).slug === UNCLASSIFIED;
    })
    .sort((a, b) => (b.revenue?.mrr ?? 0) - (a.revenue?.mrr ?? 0))
    .slice(0, 25)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      category: row.category,
      mrrUsd: row.revenue?.mrr != null ? Math.round(row.revenue.mrr / 100) : null,
      website: row.website,
    }));
  report.trustmrr = {
    fetched: rows.length,
    unmatchedTop: unmatched,
  };

  seed = await applyHnMentions(seed, weekId);

  const gh = process.env.GITHUB_TOKEN;
  if (gh) {
    const emptySlugs = new Set(
      seed.clusters.filter((c) => c.lane === "empty").map((c) => c.slug),
    );
    const probe = {
      ...seed,
      clusters: seed.clusters.filter(
        (c) => emptySlugs.has(c.slug) || c.slug === "chatgpt-wrapper" || c.slug === "ai-resume",
      ),
    };
    await applyGithubMentions(probe, weekId, gh);
    for (const c of probe.clusters) {
      const src = seed.clusters.find((x) => x.slug === c.slug);
      if (src) src.channels = c.channels;
    }
  }

  const ph = process.env.PRODUCTHUNT_TOKEN;
  if (ph) {
    const posts = await fetchProductHuntWeek(ph, weekId);
    seed = applyProductHunt(seed, posts, weekId);
    report.producthuntPosts = posts.length;
  }

  const last = seed.weeks.length - 1;
  report.clusters = seed.clusters.map((c) => ({
    slug: c.slug,
    lane: c.lane,
    builders: seed.builders[c.slug][last],
    receiptLabel: c.receipt?.label ?? null,
    receiptMrr: c.receipt?.mrrUsd ?? null,
    trustmrr: chHits(seed, c.slug, "trustmrr").title,
    hn: chHits(seed, c.slug, "hackernews").hits,
    gh: chHits(seed, c.slug, "github").hits,
    ph: chHits(seed, c.slug, "producthunt").hits,
    itunes: (c.channels ?? []).find((x) => x.channel === "appstore")?.title ?? null,
  }));

  const emptyHn = seed.clusters.filter((c) => c.lane === "empty").map((c) => ({
    slug: c.slug,
    q: SEARCH[c.slug],
  }));
  report.emptyHnSpot = [];
  for (const e of emptyHn.slice(0, 3)) {
    const hit = await countHnStories(e.q ?? e.slug, weekId);
    (report.emptyHnSpot as object[]).push({ ...e, ...hit });
  }

  const out = "/tmp/stampede-experiment-feeds.json";
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
