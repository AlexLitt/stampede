import { upsertChannel, type BumpSeed, type ReceiptChannel } from "./bump-seed";
import { hayContainsMention, mentionQuery } from "./match";
import { isoWeekRange, nextIsoWeekId } from "./week";

const BASE = "https://hn.algolia.com/api/v1/search_by_date";
const HITS_PER_PAGE = 100;
const MAX_PAGES = 3;

type Hit = {
  objectID?: string;
  title?: string | null;
  url?: string | null;
  author?: string | null;
  created_at_i?: number;
};

type Page = {
  hits?: Hit[];
  nbPages?: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function weekWindow(weekId: string): { start: number; endExcl: number } {
  const { start } = isoWeekRange(weekId);
  const next = isoWeekRange(nextIsoWeekId(weekId)).start;
  return {
    start: Math.floor(start.getTime() / 1000),
    endExcl: Math.floor(next.getTime() / 1000),
  };
}

function searchUrl(q: string, weekId: string): string {
  const { start, endExcl } = weekWindow(weekId);
  return `https://hn.algolia.com/?dateRange=custom&startDate=${start}&endDate=${endExcl - 1}&type=show&query=${encodeURIComponent(q)}`;
}

async function fetchPage(
  q: string,
  start: number,
  endExcl: number,
  page: number,
): Promise<Page> {
  const url = `${BASE}?query=${encodeURIComponent(q)}&tags=show_hn&hitsPerPage=${HITS_PER_PAGE}&page=${page}&numericFilters=${encodeURIComponent(`created_at_i>=${start},created_at_i<${endExcl}`)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HN Algolia ${res.status}`);
  return (await res.json()) as Page;
}

export async function countHnStories(
  q: string,
  weekId: string,
): Promise<{ authors: number; stories: number; title?: string }> {
  const { start, endExcl } = weekWindow(weekId);
  const authors = new Set<string>();
  const stories = new Set<string>();
  let title: string | undefined;
  let nbPages = 1;

  for (let page = 0; page < Math.min(MAX_PAGES, nbPages); page++) {
    const data = await fetchPage(q, start, endExcl, page);
    nbPages = Math.max(1, data.nbPages ?? 1);
    for (const h of data.hits ?? []) {
      const hay = `${h.title ?? ""} ${h.url ?? ""}`;
      if (!hayContainsMention(hay, q)) continue;
      const id = h.objectID ?? `${h.author}-${h.created_at_i}`;
      stories.add(id);
      if (h.author) authors.add(h.author);
      if (!title && h.title) title = h.title;
    }
    if (!(data.hits ?? []).length) break;
  }

  return { authors: authors.size, stories: stories.size, title };
}

/** ISO-week HN stories as a channel. Does not rewrite builder counts. */
export async function applyHnMentions(
  seed: BumpSeed,
  weekId: string,
  log = console.log,
): Promise<BumpSeed> {
  const now = new Date().toISOString();
  for (const c of seed.clusters) {
    const q = mentionQuery(c);
    try {
      const hit = await countHnStories(q, weekId);
      const ch: ReceiptChannel = {
        channel: "hackernews",
        query: q,
        url: searchUrl(q, weekId),
        title: hit.title,
        hits: hit.authors,
        note: `Show HN only this ISO week. Title/url must contain mentionQuery. ${hit.stories} posts, ${hit.authors} unique authors. ESTIMATE. Not a builder census.`,
        fetchedAt: now,
      };
      upsertChannel(seed, c.slug, ch);
      log(
        `${c.slug.padEnd(28)} showhn ${hit.authors} authors · ${hit.stories} posts`,
      );
    } catch (e) {
      log(
        `${c.slug.padEnd(28)} hn skip · ${e instanceof Error ? e.message : e}`,
      );
    }
    await sleep(250);
  }
  return seed;
}
