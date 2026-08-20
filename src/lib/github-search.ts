import { upsertChannel, type BumpSeed, type ReceiptChannel } from "./bump-seed";
import { mentionQuery } from "./match";
import { isoWeekRange } from "./week";

const BASE = "https://api.github.com/search/repositories";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function weekDates(weekId: string): { from: string; to: string } {
  const { start, end } = isoWeekRange(weekId);
  return { from: ymd(start), to: ymd(end) };
}

function searchQuery(q: string, weekId: string): string {
  const { from, to } = weekDates(weekId);
  const phrase = `"${q}"`;
  return `${phrase} fork:false created:${from}..${to} OR ${phrase} fork:false pushed:${from}..${to}`;
}

type RepoSearch = {
  total_count?: number;
  incomplete_results?: boolean;
  items?: { full_name?: string; html_url?: string; description?: string | null }[];
};

export async function searchGithubRepos(
  q: string,
  weekId: string,
  token: string,
): Promise<{ total: number; title?: string; incomplete: boolean }> {
  const query = searchQuery(q, weekId);
  const url = `${BASE}?q=${encodeURIComponent(query)}&per_page=5&sort=stars&order=desc`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "StampedeWeekly/0.1",
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`GitHub ${res.status}`);
  }
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = (await res.json()) as RepoSearch;
  const top = data.items?.[0];
  return {
    total: data.total_count ?? 0,
    title: top?.full_name,
    incomplete: Boolean(data.incomplete_results),
  };
}

/** New public repos this ISO week matching the cluster query. Channel only. */
export async function applyGithubMentions(
  seed: BumpSeed,
  weekId: string,
  token: string,
  log = console.log,
): Promise<BumpSeed> {
  const now = new Date().toISOString();
  const { from, to } = weekDates(weekId);

  for (const c of seed.clusters) {
    const q = mentionQuery(c);
    const query = searchQuery(q, weekId);
    try {
      const hit = await searchGithubRepos(q, weekId, token);
      const ch: ReceiptChannel = {
        channel: "github",
        query: q,
        url: `https://github.com/search?q=${encodeURIComponent(query)}&type=repositories`,
        title: hit.title,
        hits: hit.total,
        note: `GitHub repo search. Created or pushed ${from}–${to}, no forks. ${hit.total} hits${hit.incomplete ? " (incomplete)" : ""}. ESTIMATE.`,
        fetchedAt: now,
      };
      upsertChannel(seed, c.slug, ch);
      log(`${c.slug.padEnd(28)} gh ${hit.total} repos`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`${c.slug.padEnd(28)} gh skip · ${msg}`);
      if (msg === "GitHub 401" || msg === "GitHub 403") {
        log("skip remaining GitHub searches");
        break;
      }
    }
    await sleep(2100);
  }
  return seed;
}
