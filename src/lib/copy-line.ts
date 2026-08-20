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
  const topic = c.name.replace(/\.$/, "");
  const lines = [
    `# Research this hole as a business I could ship. Source: Stampede (empty = few vibe-coders, industry already bills this way). Counts and dollars are ESTIMATE. Do not invent verified MRR.`,
    "",
    `Topic: ${topic}`,
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
  if (leak) lines.push(`Where they sell: ${leak}`);
  if (c.evidence?.length) {
    lines.push("Starting links:");
    for (const e of c.evidence) lines.push(`- ${e.title}: ${e.url}`);
  }
  lines.push(
    "",
    "Tell me, concrete and short:",
    "1. What's working now — named vendors, how they bill, who pays, public price if it exists.",
    "2. The job to be done in one sentence. Who has the budget. Where they hang out (not Twitter/PH unless that's actually true).",
    "3. What kind of business I can do as a solo founder: one ugly first product, how it charges, first customers.",
    "4. What not to build — the herd/wrapper version of this topic.",
    "5. Why this hole stays empty, or why the receipt might be a mirage.",
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
