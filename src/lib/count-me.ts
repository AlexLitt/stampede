import { createHash } from "node:crypto";

export const IP_NEW_PER_WEEK = 3;
export const WHO_COOKIE = "stampede_who";

export type CountAction = "insert" | "noop" | "move";

export type CountDecision =
  | { ok: true; action: CountAction }
  | { ok: false; error: string };

export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

const WEAK_COUNT_SECRET = new Set([
  "",
  "change-me-in-prod",
  "stampede-dev-count",
  "stampede-dev",
]);

export function countSecret(): string {
  const raw = process.env.COUNT_SECRET?.trim() ?? "";
  if (isProduction()) {
    if (WEAK_COUNT_SECRET.has(raw)) {
      throw new Error("COUNT_SECRET must be set in production.");
    }
    return raw;
  }
  return raw || process.env.ADMIN_PASSWORD || "stampede-dev-count";
}

export function hashIdentity(
  secret: string,
  kind: "who" | "ip",
  value: string,
): string {
  return createHash("sha256")
    .update(`${secret}:${kind}:${value}`)
    .digest("hex");
}

export function decideCountMe(input: {
  targetSlug: string;
  existing: { clusterSlug: string } | null;
  identitiesOnIp: number;
}): CountDecision {
  if (input.existing) {
    if (input.existing.clusterSlug === input.targetSlug) {
      return { ok: true, action: "noop" };
    }
    return { ok: true, action: "move" };
  }
  if (input.identitiesOnIp >= IP_NEW_PER_WEEK) {
    return { ok: false, error: "Already counted from this network this week." };
  }
  return { ok: true, action: "insert" };
}

export function foldCounts(
  builders: Record<string, number[]>,
  weeks: string[],
  extras: { weekId: string; clusterSlug: string; n: number }[],
): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [slug, series] of Object.entries(builders)) {
    out[slug] = [...series];
  }
  for (const e of extras) {
    const i = weeks.indexOf(e.weekId);
    if (i < 0) continue;
    const series = out[e.clusterSlug];
    if (!series || i >= series.length) continue;
    series[i] += e.n;
  }
  return out;
}

export function extrasFromSubmissions(
  rows: {
    weekId: string;
    clusterSlug: string | null;
    whoHash: string | null;
  }[],
): { weekId: string; clusterSlug: string; n: number }[] {
  const acc = new Map<string, { who: Set<string>; anon: number }>();
  for (const row of rows) {
    const slug = row.clusterSlug;
    if (!slug || slug === "unclassified") continue;
    const key = `${row.weekId}\0${slug}`;
    let slot = acc.get(key);
    if (!slot) {
      slot = { who: new Set(), anon: 0 };
      acc.set(key, slot);
    }
    if (row.whoHash) slot.who.add(row.whoHash);
    else slot.anon += 1;
  }
  const extras: { weekId: string; clusterSlug: string; n: number }[] = [];
  for (const [key, slot] of acc) {
    const [weekId, clusterSlug] = key.split("\0");
    extras.push({
      weekId,
      clusterSlug,
      n: slot.who.size + slot.anon,
    });
  }
  return extras;
}
