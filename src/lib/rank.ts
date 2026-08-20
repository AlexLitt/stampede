export type Lane = "stampede" | "empty";

export type Rankable = { slug: string; lane: Lane };

export function rankLane(
  slugs: string[],
  builders: Record<string, number>,
  prevRank: Record<string, number>,
  lane: Lane,
): Record<string, number> {
  const sorted = [...slugs].sort((a, b) => {
    const ba = builders[a] ?? 0;
    const bb = builders[b] ?? 0;
    if (ba !== bb) return lane === "stampede" ? bb - ba : ba - bb;
    const pa = prevRank[a] ?? 999;
    const pb = prevRank[b] ?? 999;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
  const out: Record<string, number> = {};
  sorted.forEach((slug, i) => {
    out[slug] = i + 1;
  });
  return out;
}

export function rankWeeks(
  clusters: Rankable[],
  weeks: string[],
  builders: Record<string, number[]>,
): Record<string, number[]> {
  const stampede = clusters.filter((c) => c.lane === "stampede").map((c) => c.slug);
  const empty = clusters.filter((c) => c.lane === "empty").map((c) => c.slug);
  const ranks: Record<string, number[]> = {};
  for (const c of clusters) ranks[c.slug] = [];

  let prev: Record<string, number> = {};
  for (let i = 0; i < weeks.length; i++) {
    const counts: Record<string, number> = {};
    for (const c of clusters) counts[c.slug] = builders[c.slug]?.[i] ?? 0;
    const s = rankLane(stampede, counts, prev, "stampede");
    const e = rankLane(empty, counts, prev, "empty");
    prev = { ...s, ...e };
    for (const slug of Object.keys(prev)) ranks[slug].push(prev[slug]);
  }
  return ranks;
}
