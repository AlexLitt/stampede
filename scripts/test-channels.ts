import assert from "node:assert/strict";
import type { ReceiptChannel } from "../src/lib/bump-seed";
import {
  channelHeadline,
  channelMeta,
  evidenceChannels,
  shownReceiptMrr,
} from "../src/lib/channel-evidence";

function ch(
  partial: Partial<ReceiptChannel> & Pick<ReceiptChannel, "channel" | "note">,
): ReceiptChannel {
  return {
    query: "q",
    url: "https://example.com",
    fetchedAt: "2026-08-20T00:00:00.000Z",
    ...partial,
  };
}

{
  const kept = evidenceChannels([
    ch({
      channel: "g2",
      note: "Search link only. G2 ToS blocks scrape.",
    }),
    ch({
      channel: "appstore",
      title: "Curtain AI: Curtain Visualizer",
      rating: 3,
      reviews: 2,
      note: "iTunes Lookup API. Pinned track. This listing.",
    }),
    ch({
      channel: "ycombinator",
      note: "YC directory. Search URL. ESTIMATE. Not a receipt.",
    }),
    ch({
      channel: "hackernews",
      hits: 0,
      note: "Show HN only this ISO week. 0 posts.",
    }),
    ch({
      channel: "github",
      hits: 4,
      note: "GitHub repo search. 4 hits. ESTIMATE.",
    }),
    ch({
      channel: "playstore",
      title: "com.codixus.curtain",
      note: "Pinned Google Play package. Listing URL only. Not scraped.",
    }),
  ]);
  assert.deepEqual(
    kept.map((c) => c.channel),
    ["appstore", "playstore"],
  );
}

{
  const trust = evidenceChannels([
    ch({
      channel: "trustmrr",
      title: "Curtain Co",
      note: "TrustMRR verified. Matched room-curtain-visualizer (score 22). Founder copy unused.",
    }),
    ch({
      channel: "trustmrr",
      title: "1Lookup",
      note: "TrustMRR candidate only (score 14 < 20). Not a receipt.",
    }),
    ch({
      channel: "github",
      title: "meetolivia/Meet-Olivia",
      hits: 1,
      note: "GitHub repo search. 1 hits. ESTIMATE.",
    }),
    ch({
      channel: "hackernews",
      hits: 3,
      note: "Show HN only this ISO week. 3 posts. ESTIMATE. Not a builder census.",
    }),
    ch({
      channel: "appstore",
      title: "Pixelup",
      rating: 4.4,
      note: "iTunes Search API. Nearest listing for the query. Not the cluster. ESTIMATE. Not a receipt.",
    }),
  ]);
  assert.deepEqual(
    trust.map((c) => c.channel),
    ["trustmrr"],
  );
}

{
  assert.equal(
    channelHeadline(
      ch({
        channel: "appstore",
        title: "Curtain AI: Curtain Visualizer",
        note: "listing",
      }),
    ),
    "Curtain AI: Curtain Visualizer",
  );
  assert.equal(
    channelHeadline(
      ch({
        channel: "playstore",
        title: "com.codixus.curtain",
        note: "listing",
      }),
    ),
    "Play",
  );
  assert.equal(
    channelHeadline(ch({ channel: "github", hits: 4, note: "hits" })),
    "GitHub",
  );
}

{
  assert.equal(
    channelMeta(
      ch({
        channel: "appstore",
        title: "Curtain",
        rating: 3,
        reviews: 2,
        note: "listing",
      }),
    ),
    "3.0★ · 2 reviews",
  );
  assert.equal(
    channelMeta(ch({ channel: "github", hits: 4, note: "hits" })),
    "4 hits",
  );
  assert.equal(
    channelMeta(ch({ channel: "playstore", title: "com.x.y", note: "url" })),
    null,
  );
}

{
  const pinned = [
    ch({
      channel: "appstore",
      title: "Curtain AI",
      note: "iTunes Lookup API. Pinned track. This listing.",
    }),
  ];
  const githubOnly = [
    ch({
      channel: "github",
      title: "meetolivia/Meet-Olivia",
      hits: 1,
      note: "GitHub repo search. 1 hits. ESTIMATE.",
    }),
  ];
  assert.equal(shownReceiptMrr(720, pinned), 720);
  assert.equal(shownReceiptMrr(410, githubOnly), null);
  assert.equal(shownReceiptMrr(410, []), null);
  assert.equal(shownReceiptMrr(null, pinned), null);
}

console.log("ok channels");
