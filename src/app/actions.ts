"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { matchCluster, UNCLASSIFIED } from "@/lib/match";
import { prisma } from "@/lib/db";
import { getMatchableClusters, getPublishedWeek } from "@/lib/queries";
import {
  WHO_COOKIE,
  countSecret,
  decideCountMe,
  hashIdentity,
} from "@/lib/count-me";
import { rankLane, type Lane } from "@/lib/rank";

export type SubmitResult =
  | {
      ok: true;
      slug: string;
      name: string;
      rank: number;
      builders: number;
      weekId: string;
    }
  | { ok: false; error: string };

function clientIp(h: Headers): string {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "0.0.0.0";
}

async function whoToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(WHO_COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;
  const token = randomBytes(16).toString("hex");
  jar.set(WHO_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

async function snapshot(
  weekId: string,
  slug: string,
): Promise<SubmitResult> {
  const row = await prisma.clusterWeek.findUnique({
    where: { weekId_clusterSlug: { weekId, clusterSlug: slug } },
    include: { cluster: true },
  });
  if (!row) return { ok: false, error: "No week on the chart." };
  return {
    ok: true,
    slug,
    name: row.cluster.name,
    rank: row.rank,
    builders: row.buildersThisWeek,
    weekId,
  };
}

async function rerankWeek(weekId: string) {
  const rows = await prisma.clusterWeek.findMany({
    where: { weekId },
    select: {
      id: true,
      clusterSlug: true,
      lane: true,
      buildersThisWeek: true,
      lastRank: true,
    },
  });
  const prev: Record<string, number> = {};
  for (const r of rows) {
    if (r.lastRank != null) prev[r.clusterSlug] = r.lastRank;
  }
  const builders: Record<string, number> = {};
  for (const r of rows) builders[r.clusterSlug] = r.buildersThisWeek;
  const stampede = rows
    .filter((r) => r.lane === "stampede")
    .map((r) => r.clusterSlug);
  const empty = rows
    .filter((r) => r.lane === "empty")
    .map((r) => r.clusterSlug);
  const ranks = {
    ...rankLane(stampede, builders, prev, "stampede"),
    ...rankLane(empty, builders, prev, "empty"),
  };
  await prisma.$transaction(
    rows.map((r) => {
      const rank = ranks[r.clusterSlug] ?? r.lastRank ?? 999;
      const lane = r.lane as Lane;
      return prisma.clusterWeek.update({
        where: { id: r.id },
        data: {
          rank,
          isBestHole: lane === "empty" && rank === 1,
        },
      });
    }),
  );
}

export async function submitBuild(formData: FormData): Promise<SubmitResult> {
  const rawText = String(formData.get("rawText") ?? "").trim();
  const forcedSlug = String(formData.get("clusterSlug") ?? "").trim() || null;

  if (rawText.length < 2 && !forcedSlug) {
    return { ok: false, error: "One sentence. What are you building?" };
  }

  const week = await getPublishedWeek();
  if (!week) return { ok: false, error: "No week on the chart." };

  const clusters = await getMatchableClusters();
  const slug =
    forcedSlug && clusters.some((c) => c.slug === forcedSlug)
      ? forcedSlug
      : matchCluster(rawText || "", clusters);

  if (slug === UNCLASSIFIED) {
    return { ok: false, error: "Not on this chart. Try another sentence." };
  }

  const secret = countSecret();
  const who = await whoToken();
  const whoHash = hashIdentity(secret, "who", who);
  const ipHash = hashIdentity(secret, "ip", clientIp(await headers()));
  const text = rawText || `count me: ${slug}`;

  const existing = await prisma.submission.findUnique({
    where: { weekId_whoHash: { weekId: week.id, whoHash } },
    select: { id: true, clusterSlug: true },
  });

  const onIp = await prisma.submission.findMany({
    where: { weekId: week.id, ipHash },
    select: { whoHash: true },
  });
  const identitiesOnIp = new Set(
    onIp.map((r) => r.whoHash).filter((h): h is string => Boolean(h)),
  ).size;

  const decision = decideCountMe({
    targetSlug: slug,
    existing:
      existing?.clusterSlug != null
        ? { clusterSlug: existing.clusterSlug }
        : null,
    identitiesOnIp,
  });
  if (!decision.ok) return decision;

  if (decision.action === "noop") {
    return snapshot(week.id, slug);
  }

  if (decision.action === "move" && existing) {
    const from = existing.clusterSlug;
    if (from && from !== slug) {
      await prisma.$transaction([
        prisma.submission.update({
          where: { id: existing.id },
          data: { clusterSlug: slug, rawText: text },
        }),
        prisma.clusterWeek.update({
          where: { weekId_clusterSlug: { weekId: week.id, clusterSlug: from } },
          data: { buildersThisWeek: { decrement: 1 } },
        }),
        prisma.clusterWeek.update({
          where: { weekId_clusterSlug: { weekId: week.id, clusterSlug: slug } },
          data: { buildersThisWeek: { increment: 1 } },
        }),
      ]);
      await rerankWeek(week.id);
      revalidatePath("/");
    }
    return snapshot(week.id, slug);
  }

  try {
    await prisma.$transaction([
      prisma.submission.create({
        data: {
          rawText: text,
          weekId: week.id,
          clusterSlug: slug,
          whoHash,
          ipHash,
        },
      }),
      prisma.clusterWeek.update({
        where: { weekId_clusterSlug: { weekId: week.id, clusterSlug: slug } },
        data: { buildersThisWeek: { increment: 1 } },
      }),
    ]);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return snapshot(week.id, slug);
    }
    throw e;
  }

  await rerankWeek(week.id);
  revalidatePath("/");
  return snapshot(week.id, slug);
}
