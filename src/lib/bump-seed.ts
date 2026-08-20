import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ReceiptChannel = {
  channel:
    | "g2"
    | "reddit"
    | "trustpilot"
    | "appstore"
    | "upwork"
    | "capterra"
    | "trustmrr"
    | "hackernews"
    | "github"
    | "producthunt"
    | "playstore"
    | "flippa"
    | "ycombinator"
    | "keywords"
    | "acquire";
  query: string;
  url: string;
  title?: string;
  rating?: number;
  reviews?: number;
  hits?: number;
  note: string;
  fetchedAt: string;
};

export type Receipt = {
  source: string;
  mrrUsd: number | null;
  subs: number | null;
  rating: number | null;
  reviews: number | null;
  leak: string;
  label: string;
  channels?: ReceiptChannel[];
};

export type BumpSeed = {
  weeks: string[];
  clusters: {
    slug: string;
    name: string;
    oneLine: string;
    because: string;
    doNot: string;
    tip: string;
    lane: "stampede" | "empty";
    category: string;
    keywords: string;
    itunesTrackId?: string;
    playPackage?: string;
    channels?: ReceiptChannel[];
    receipt?: Receipt;
  }[];
  builders: Record<string, number[]>;
};

export function upsertChannel(seed: BumpSeed, slug: string, ch: ReceiptChannel) {
  const c = seed.clusters.find((x) => x.slug === slug);
  if (!c) return;
  c.channels = [
    ...(c.channels ?? []).filter((x) => x.channel !== ch.channel),
    ch,
  ];
  if (c.receipt) {
    c.receipt.channels = [
      ...(c.receipt.channels ?? []).filter((x) => x.channel !== ch.channel),
      ch,
    ];
  }
}

export function loadBumpSeed(cwd = process.cwd()): BumpSeed {
  return JSON.parse(
    readFileSync(resolve(cwd, "data/bump.json"), "utf8"),
  ) as BumpSeed;
}

export function validateBumpSeed(seed: BumpSeed): string[] {
  const issues: string[] = [];
  if (!Array.isArray(seed.weeks) || seed.weeks.length < 1) {
    issues.push("weeks missing");
    return issues;
  }
  const n = seed.weeks.length;
  const slugs = new Set<string>();
  for (const id of seed.weeks) {
    if (!/^20\d{2}-W\d{2}$/.test(id)) issues.push(`bad week id ${id}`);
  }

  for (const c of seed.clusters ?? []) {
    if (!c.slug) issues.push("cluster missing slug");
    if (slugs.has(c.slug)) issues.push(`dup slug ${c.slug}`);
    slugs.add(c.slug);
    if (!c.name) issues.push(`${c.slug} missing name`);
    if (!c.oneLine) issues.push(`${c.slug} missing oneLine`);
    if (!c.because) issues.push(`${c.slug} missing because`);
    if (!c.doNot) issues.push(`${c.slug} missing doNot`);
    if (!c.tip) issues.push(`${c.slug} missing tip`);
    if (c.lane !== "stampede" && c.lane !== "empty") {
      issues.push(`${c.slug} bad lane ${c.lane}`);
    }
    if (!c.category || c.category === "all") {
      issues.push(`${c.slug} category must be a real bucket, not all`);
    }
    if (c.lane === "empty") {
      const r = c.receipt;
      if (!r?.source || !r.leak || !r.label) {
        issues.push(`${c.slug} empty needs receipt source, leak, label`);
      }
    }
    const b = seed.builders?.[c.slug];
    if (!b) issues.push(`${c.slug} missing builders`);
    else if (b.length !== n) {
      issues.push(`${c.slug} builders length ${b.length} vs ${n}`);
    } else {
      for (let i = 0; i < b.length; i++) {
        if (!Number.isInteger(b[i]) || b[i] < 0) {
          issues.push(`${c.slug} builders[${i}] not a non-neg int`);
        }
      }
    }
  }

  for (const slug of Object.keys(seed.builders ?? {})) {
    if (!slugs.has(slug)) issues.push(`orphan builders ${slug}`);
  }

  return issues;
}
