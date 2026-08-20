import type { ReceiptChannel } from "./bump-seed";
import { prisma } from "./db";
import { shownReceiptMrr } from "./channel-evidence";

export type BumpPoint = {
  weekId: string;
  rank: number;
  builders: number;
};

export type BumpSeries = {
  slug: string;
  name: string;
  oneLine: string;
  because: string;
  doNot: string;
  tip: string;
  lane: "stampede" | "empty";
  category: string;
  receiptSource: string | null;
  receiptMrrUsd: number | null;
  receiptSubs: number | null;
  receiptRating: number | null;
  receiptReviews: number | null;
  receiptLeak: string | null;
  receiptLabel: string | null;
  channels: ReceiptChannel[];
  points: BumpPoint[];
};

function parseChannels(raw: string | null): ReceiptChannel[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as ReceiptChannel[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function getBumpData(): Promise<{
  weeks: string[];
  series: BumpSeries[];
}> {
  const weeks = await prisma.week.findMany({
    where: { published: true },
    orderBy: { id: "asc" },
  });
  const weekIds = weeks.map((w) => w.id);
  const latest = weekIds[weekIds.length - 1];
  if (!latest) return { weeks: [], series: [] };

  const latestRows = await prisma.clusterWeek.findMany({
    where: { weekId: latest, NOT: { clusterSlug: "unclassified" } },
    include: { cluster: true },
  });

  const picked = latestRows.sort((a, b) => {
    if (a.lane !== b.lane) return a.lane === "stampede" ? -1 : 1;
    return a.rank - b.rank;
  });
  const slugs = picked.map((r) => r.clusterSlug);

  const history = await prisma.clusterWeek.findMany({
    where: { clusterSlug: { in: slugs }, weekId: { in: weekIds } },
    include: { cluster: true },
    orderBy: { weekId: "asc" },
  });

  const series: BumpSeries[] = picked.map((head) => {
    const byWeek = new Map(
      history
        .filter((h) => h.clusterSlug === head.clusterSlug)
        .map((h) => [h.weekId, h]),
    );
    const pts = weekIds.flatMap((id) => {
      const h = byWeek.get(id);
      return h
        ? [{ weekId: h.weekId, rank: h.rank, builders: h.buildersThisWeek }]
        : [];
    });
    const channels = parseChannels(head.receiptChannels);
    const receiptMrrUsd = shownReceiptMrr(head.receiptMrrUsd, channels);
    const billed = receiptMrrUsd != null;
    return {
      slug: head.clusterSlug,
      name: head.cluster.name,
      oneLine: head.cluster.oneLine,
      because: head.cluster.because,
      doNot: head.cluster.doNot,
      tip: head.cluster.tip,
      lane: head.lane as "stampede" | "empty",
      category: head.cluster.category,
      receiptSource: head.receiptSource,
      receiptMrrUsd,
      receiptSubs: billed ? head.receiptSubs : null,
      receiptRating: billed ? head.receiptRating : null,
      receiptReviews: billed ? head.receiptReviews : null,
      receiptLeak: head.receiptLeak,
      receiptLabel: head.receiptLabel,
      channels,
      points: pts,
    };
  });

  return { weeks: weekIds, series };
}

export async function getPublishedWeek() {
  return prisma.week.findFirst({
    where: { published: true },
    orderBy: { id: "desc" },
  });
}

export async function getMatchableClusters() {
  return prisma.cluster.findMany({
    where: { NOT: { slug: "unclassified" } },
    select: { slug: true, name: true, keywords: true },
  });
}
