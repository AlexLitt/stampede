# Bump data pipeline

Date: 2026-08-18

## Job

Keep builder counts as estimates in `data/bump.json`. Derive ranks. Validate before seed. Never wipe `Submission`.

## Source of truth

`data/bump.json`:

- `weeks`: ISO week ids, oldest first
- `clusters`: slug, name, oneLine, lane, category, keywords; `receipt` required on `empty`
- `builders`: slug → int[] same length as `weeks`

No `ranks` key. Ranks are a view of builders.

## Ranking (per week, per lane)

Stampede: more builders → better rank (1 = most).
Empty: fewer builders → better rank (1 = emptiest).
Ties: previous week rank (lower first), then slug A–Z.
Week 0: builders, then slug.

`isBestHole` = empty lane rank 1 that week.

## Validate (`scripts/validate-bump.ts`)

Fail if week/cluster/builder lengths mismatch, missing keys, negative builders, empty cluster without receipt, unknown lanes.

## Seed (`prisma/seed.ts`)

- Run validate first
- Upsert clusters + unclassified
- Upsert weeks (published)
- Rewrite `ClusterWeek` only for seed week ids
- Fold Count-me submissions into builders, then write derived rank, lastRank, buildersThisWeek, buildersLastWeek, isBestHole. One identity per week. Do not write Count-me back into `bump.json`.
- Production build does not `db push` or seed. Turso (`TURSO_DATABASE_URL`) holds Count me.
- Do not delete submissions

## Chart

`getBumpData` unchanged: reads published weeks + ClusterWeek ranks.

## Weekly job (`npm run data:weekly`)

Monday 08:15 UTC via `.github/workflows/weekly.yml`, or local cron:

`15 8 * * 1 cd /path/to/VibeChart && npm run data:weekly`

What it does:

1. Append missing ISO weeks up to this week. Keep 8 weeks. New builder counts **copy last week** and stay ESTIMATE. After fetch, weekly **restores that snapshot**. GitHub/HN/PH never overwrite `builders`.
2. Refresh listing channels: **pinned `itunesTrackId`** uses iTunes Lookup. **pinned `playPackage`** is a Google Play listing URL (no public lookup API; not scraped). Empty without pins: store search URLs only. Reddit / G2 / Capterra / Trustpilot / Acquire.com are **search URLs only** (Acquire ToS forbids scrape; no public API).
3. If `TRUSTMRR_API_KEY` is set, pull TrustMRR and attach matches with score ≥ 20 as `TRUSTMRR` receipts. Named unmatched → `data/trustmrr-queue.json`. No auto-insert. Human writes `slug` + `oneLine` + receipt.
4. **Show HN only** (`tags=show_hn`) + GitHub repo search `created:` **or** `pushed:` this ISO week, no forks. Short `mentionQuery`. Title/url (HN) and name/tagline (PH) must contain the phrase. ESTIMATE chips. Do not overwrite builder counts.
5. Product Hunt GraphQL is a **Stampede chip only**. Same phrase gate as Show HN. Never a receipt. Never on Empty.
6. Flippa public `GET /v3/listings` (SaaS, recent). Match **mentionQuery phrase** only (not KEYWORD_MAP bait like agent/pdf). Channel ESTIMATE. Not a TrustMRR receipt.
7. YC directory via [yc-oss](https://github.com/yc-oss/api) public JSON. Same phrase gate on one-liners. ESTIMATE. Not a receipt.
8. If `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`: Google Ads search volume. Label ESTIMATE demand.
9. If `UPWORK_ACCESS_TOKEN`: official GraphQL job counts. Empty demand. Search URL until then.
10. Validate. Write `data/bump.json`. Seed unless `--skip-seed`.

Flags: `--dry` `--skip-fetch` `--skip-seed` `--skip-listings` `--skip-tmrr` `--skip-hn` `--skip-gh` `--skip-ph` `--skip-flippa` `--skip-yc` `--skip-keywords` `--skip-upwork`.

Does not invent MRR. Does not scrape G2/Capterra/Trustpilot/Upwork/Acquire/GetLatka HTML.
