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

const GENERIC_SOURCE =
  /^(industry vendor|vendor site|vendor demo)/i;

export function shownReceiptSource(source: string | null): string | null {
  const s = source?.trim() ?? "";
  if (!s || GENERIC_SOURCE.test(s)) return null;
  return s;
}

export function billThisWay(name: string): string {
  const n = name.trim().replace(/\.$/, "");
  if (!n) return "Bill this way.";
  return `Bill this way on ${n}.`;
}

export function receiptDek(opts: {
  name: string;
  leak: string | null;
  tip: string;
  subs: number | null;
}): string {
  const leak = opts.leak?.trim() ?? "";
  const noisy =
    !leak ||
    leak === opts.tip.trim() ||
    /^https?:\/\//i.test(leak) ||
    /lookup ·/i.test(leak) ||
    /apps\.apple\.com/i.test(leak);
  if (!noisy) return leak;
  if (opts.subs != null) {
    return `About ${opts.subs.toLocaleString("en-US")} pay this way.`;
  }
  return billThisWay(opts.name);
}

export type EmptyPromptCluster = {
  slug: string;
  name: string;
  oneLine: string;
  because: string;
  doNot: string;
  tip: string;
  weekId: string;
  receiptMrrUsd: number | null;
  receiptSource: string | null;
  receiptLeak: string | null;
  evidence?: { title: string; url: string }[];
};

export function emptyResearchPrompt(
  c: EmptyPromptCluster,
  origin: string,
): string {
  const permalink = clusterPermalink(origin, c.weekId, c.slug);
  const lines = [
    "Research this Stampede empty hole. Empty = steal, not skip.",
    "Receipts and counts are ESTIMATE. Do not invent verified MRR.",
    "",
    `Cluster: ${c.name}`,
    `Permalink: ${permalink}`,
    `One line: ${c.oneLine}`,
  ];
  if (c.because.trim()) lines.push(`Because: ${c.because.trim()}`);
  if (c.doNot.trim()) lines.push(`Do not: ${c.doNot.trim()}`);
  if (c.tip.trim()) lines.push(`Tip: ${c.tip.trim()}`);
  lines.push(`Receipt: ${estimateLine(c.receiptMrrUsd)}`);
  const source = shownReceiptSource(c.receiptSource);
  if (source) lines.push(`Source: ${source}`);
  const leak = c.receiptLeak?.trim();
  if (leak) lines.push(`Leak: ${leak}`);
  if (c.evidence?.length) {
    lines.push("Evidence:");
    for (const e of c.evidence) lines.push(`- ${e.title}: ${e.url}`);
  }
  lines.push(
    "",
    "Add, in Stampede voice (dry, short, specific, no SaaS warmth):",
    `1. Who already bills this way on ${c.name.replace(/\.$/, "")} — named vendor, channel, public price if it exists.`,
    "2. Who the buyer is and where they hang out (not Twitter/PH unless that's actually true).",
    "3. What a vibe-coder should ship first: one ugly job.",
    "4. The herd version of this hole — what not to build.",
  );
  return lines.join("\n");
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
