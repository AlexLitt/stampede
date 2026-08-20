import { upsertChannel, type BumpSeed, type ReceiptChannel } from "./bump-seed";
import { mentionQuery } from "./match";

const ENDPOINT = "https://api.upwork.com/graphql";

const QUERY = `
query Jobs($marketPlaceJobFilter: MarketplaceJobPostingsSearchFilter, $searchType: MarketplaceJobPostingSearchType) {
  marketplaceJobPostingsSearch(
    marketPlaceJobFilter: $marketPlaceJobFilter
    searchType: $searchType
  ) {
    totalCount
  }
}
`;

export async function applyUpworkJobs(
  seed: BumpSeed,
  token: string,
  log = console.log,
): Promise<BumpSeed> {
  const now = new Date().toISOString();
  for (const c of seed.clusters) {
    const q = mentionQuery(c);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          searchType: "USER_JOBS_SEARCH",
          marketPlaceJobFilter: { titleExpression_eq: q },
        },
      }),
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Upwork ${res.status}`);
    }
    if (!res.ok) throw new Error(`Upwork ${res.status}`);
    const json = (await res.json()) as {
      errors?: { message?: string }[];
      data?: { marketplaceJobPostingsSearch?: { totalCount?: number } };
    };
    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message ?? "Upwork GraphQL error");
    }
    const hits = json.data?.marketplaceJobPostingsSearch?.totalCount ?? 0;
    const ch: ReceiptChannel = {
      channel: "upwork",
      query: q,
      url: `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(q)}`,
      hits,
      note: `Upwork official GraphQL job search. ${hits} postings. ESTIMATE demand. Empty receipt signal, not MRR.`,
      fetchedAt: now,
    };
    upsertChannel(seed, c.slug, ch);
    log(`${c.slug.padEnd(28)} upwork ${hits} jobs · ${q}`);
    await new Promise((r) => setTimeout(r, 250));
  }
  return seed;
}
