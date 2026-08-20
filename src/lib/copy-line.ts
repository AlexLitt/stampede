export type CopyCluster = {
  slug: string;
  name: string;
  oneLine: string;
  lane: "stampede" | "empty";
  rank: number;
  builders: number;
  weekId: string;
  receiptMrrUsd: number | null;
  receiptLabel: string | null;
};

export function clusterPermalink(
  origin: string,
  weekId: string,
  slug: string,
): string {
  const url = new URL("/", origin);
  url.searchParams.set("w", weekId);
  url.searchParams.set("c", slug);
  return url.toString();
}

export function copyLine(c: CopyCluster, origin: string): string {
  const verb = c.lane === "empty" ? "STEAL" : "SKIP";
  const builders = `${c.builders.toLocaleString("en-US")} builders`;
  const parts = [
    verb,
    `#${c.rank} ${c.name}`,
    c.oneLine,
    builders,
  ];
  if (c.lane === "empty") {
    parts.push(estimateLine(c.receiptMrrUsd));
  }
  parts.push(c.weekId);
  parts.push(clusterPermalink(origin, c.weekId, c.slug));
  return parts.join(" · ");
}

export function estimateLine(receiptMrrUsd: number | null): string {
  if (receiptMrrUsd != null) {
    return `ESTIMATE $${receiptMrrUsd.toLocaleString("en-US")}/mo`;
  }
  return "ESTIMATE";
}

export function pickLaneLead<
  T extends {
    slug: string;
    lane: "stampede" | "empty";
    points: { rank: number }[];
  },
>(series: T[], weekIndex: number, lane: "stampede" | "empty"): T | null {
  let best: T | null = null;
  let bestRank = Infinity;
  for (const s of series) {
    if (s.lane !== lane) continue;
    const pt = s.points[weekIndex] ?? s.points[s.points.length - 1];
    if (!pt) continue;
    if (pt.rank < bestRank) {
      best = s;
      bestRank = pt.rank;
    }
  }
  return best;
}
