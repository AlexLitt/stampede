import { loadBumpSeed, validateBumpSeed } from "../src/lib/bump-seed";
import {
  extrasFromSubmissions,
  foldCounts,
} from "../src/lib/count-me";
import { prisma } from "../src/lib/db";
import { rankWeeks } from "../src/lib/rank";

async function main() {
  const seed = loadBumpSeed();
  const issues = validateBumpSeed(seed);
  if (issues.length) {
    throw new Error(issues.join("\n"));
  }

  const counted = await prisma.submission.findMany({
    where: { weekId: { in: seed.weeks } },
    select: { weekId: true, clusterSlug: true, whoHash: true },
  });
  const builders = foldCounts(
    seed.builders,
    seed.weeks,
    extrasFromSubmissions(counted),
  );

  const ranks = rankWeeks(
    seed.clusters.map((c) => ({ slug: c.slug, lane: c.lane })),
    seed.weeks,
    builders,
  );

  for (const c of seed.clusters) {
    await prisma.cluster.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        oneLine: c.oneLine,
        because: c.because,
        doNot: c.doNot,
        tip: c.tip,
        keywords: c.keywords,
        category: c.category,
      },
      update: {
        name: c.name,
        oneLine: c.oneLine,
        because: c.because,
        doNot: c.doNot,
        tip: c.tip,
        keywords: c.keywords,
        category: c.category,
      },
    });
  }

  await prisma.cluster.upsert({
    where: { slug: "unclassified" },
    create: {
      slug: "unclassified",
      name: "Unclassified",
      oneLine: "Not on the chart.",
      keywords: "",
      category: "all",
    },
    update: {},
  });

  await prisma.clusterWeek.deleteMany({
    where: { weekId: { in: seed.weeks } },
  });

  for (let i = 0; i < seed.weeks.length; i++) {
    const id = seed.weeks[i];
    const publishedAt = new Date(Date.UTC(2026, 5, 29 + i * 7, 8, 0, 0));
    await prisma.week.upsert({
      where: { id },
      create: {
        id,
        published: true,
        publishedAt,
        note: "ESTIMATE. Builders seeded; ranks derived.",
      },
      update: {
        published: true,
        publishedAt,
        note: "ESTIMATE. Builders seeded; ranks derived.",
      },
    });

    for (const c of seed.clusters) {
      const rank = ranks[c.slug][i];
      const n = builders[c.slug][i];
      const lastRank = i > 0 ? ranks[c.slug][i - 1] : null;
      const lastBuilders = i > 0 ? builders[c.slug][i - 1] : 0;
      const r = c.receipt;
      await prisma.clusterWeek.create({
        data: {
          weekId: id,
          clusterSlug: c.slug,
          lane: c.lane,
          rank,
          lastRank,
          buildersThisWeek: n,
          buildersLastWeek: lastBuilders,
          isBestHole: c.lane === "empty" && rank === 1,
          receiptSource: r?.source ?? null,
          receiptMrrUsd: r?.mrrUsd ?? null,
          receiptSubs: r?.subs ?? null,
          receiptRating: r?.rating ?? null,
          receiptReviews: r?.reviews ?? null,
          receiptLeak: r?.leak ?? null,
          receiptLabel: r?.label ?? null,
          receiptChannels: JSON.stringify(c.channels ?? r?.channels ?? null),
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
