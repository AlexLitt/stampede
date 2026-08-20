import { upsertChannel, type BumpSeed, type ReceiptChannel } from "./bump-seed";
import { hayContainsMention, matchClusterScored, mentionQuery, UNCLASSIFIED } from "./match";
import { isoWeekRange, nextIsoWeekId } from "./week";

const ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
const MATCH_MIN = 16;
const PAGE = 20;
const MAX_PAGES = 25;

const QUERY = `
query Posts($after: String, $postedAfter: DateTime!, $postedBefore: DateTime!) {
  posts(
    first: ${PAGE}
    after: $after
    postedAfter: $postedAfter
    postedBefore: $postedBefore
    order: NEWEST
  ) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
      }
    }
  }
}
`;

export type PhPost = {
  id: string;
  name: string;
  tagline: string;
  description?: string | null;
  url: string;
  votesCount: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function weekIso(weekId: string): { postedAfter: string; postedBefore: string } {
  const { start } = isoWeekRange(weekId);
  const next = isoWeekRange(nextIsoWeekId(weekId)).start;
  return {
    postedAfter: start.toISOString(),
    postedBefore: next.toISOString(),
  };
}

type PageShape = {
  posts: PhPost[];
  endCursor: string | null;
  hasNextPage: boolean;
};

async function fetchPage(
  token: string,
  postedAfter: string,
  postedBefore: string,
  after: string | null,
): Promise<PageShape | { error: string }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { after, postedAfter, postedBefore },
    }),
  });
  if (!res.ok) return { error: `Product Hunt ${res.status}` };
  const json = (await res.json()) as {
    errors?: { message?: string }[];
    data?: {
      posts?: {
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
        edges?: { node?: PhPost }[];
      };
    };
  };
  if (json.errors?.length) {
    return { error: json.errors[0]?.message ?? "Product Hunt GraphQL error" };
  }
  const conn = json.data?.posts;
  return {
    posts:
      conn?.edges?.map((e) => e.node).filter((n): n is PhPost => Boolean(n)) ??
      [],
    endCursor: conn?.pageInfo?.endCursor ?? null,
    hasNextPage: Boolean(conn?.pageInfo?.hasNextPage),
  };
}

export async function fetchProductHuntWeek(
  token: string,
  weekId: string,
  log = console.log,
): Promise<PhPost[]> {
  const { postedAfter, postedBefore } = weekIso(weekId);
  const rows: PhPost[] = [];
  let after: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await fetchPage(token, postedAfter, postedBefore, after);
    if ("error" in page) throw new Error(page.error);
    rows.push(...page.posts);
    log(`producthunt page ${i + 1} · ${page.posts.length} · total ${rows.length}`);
    if (!page.hasNextPage || !page.endCursor) break;
    after = page.endCursor;
    await sleep(250);
  }
  return rows;
}

export function applyProductHunt(
  seed: BumpSeed,
  posts: PhPost[],
  weekId: string,
  log = console.log,
): BumpSeed {
  const stampede = seed.clusters.filter((c) => c.lane === "stampede");
  const clusters = stampede.map((c) => ({
    slug: c.slug,
    name: c.name,
    keywords: c.keywords,
  }));
  const now = new Date().toISOString();
  const best = new Map<
    string,
    { post: PhPost; score: number; count: number }
  >();

  for (const post of posts) {
    const hay = `${post.name} ${post.tagline}`;
    const eligible = clusters.filter((c) =>
      hayContainsMention(hay, mentionQuery(c)),
    );
    if (!eligible.length) continue;
    const hit = matchClusterScored(hay, eligible, MATCH_MIN);
    if (hit.slug === UNCLASSIFIED) continue;
    const prev = best.get(hit.slug);
    if (!prev) {
      best.set(hit.slug, { post, score: hit.score, count: 1 });
    } else {
      prev.count += 1;
      if (
        post.votesCount > prev.post.votesCount ||
        (post.votesCount === prev.post.votesCount && hit.score > prev.score)
      ) {
        prev.post = post;
        prev.score = hit.score;
      }
    }
  }

  for (const c of seed.clusters) {
    if (c.lane !== "stampede") {
      c.channels = (c.channels ?? []).filter((x) => x.channel !== "producthunt");
      if (c.receipt) {
        c.receipt.channels = (c.receipt.channels ?? []).filter(
          (x) => x.channel !== "producthunt",
        );
      }
      continue;
    }
    const hit = best.get(c.slug);
    const q = mentionQuery(c);
    const ch: ReceiptChannel = {
      channel: "producthunt",
      query: q,
      url: hit
        ? hit.post.url
        : `https://www.producthunt.com/search?q=${encodeURIComponent(q)}`,
      title: hit?.post.name,
      hits: hit?.count ?? 0,
      note: hit
        ? `Product Hunt this ISO week (${weekId}). Name/tagline contained mentionQuery. ${hit.count} matched. Stampede chip. Not a receipt.`
        : `Product Hunt: no mentionQuery in name/tagline among ${posts.length} posts this ISO week. ESTIMATE.`,
      fetchedAt: now,
    };
    upsertChannel(seed, c.slug, ch);
    if (hit) {
      log(
        `${c.slug.padEnd(28)} ph ${hit.count} · ${hit.post.name}`,
      );
    }
  }
  return seed;
}
