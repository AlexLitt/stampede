import assert from "node:assert/strict";
import {
  billThisWay,
  copyLine,
  emptyResearchPrompt,
  pickLaneLead,
  receiptDek,
  shownReceiptSource,
} from "../src/lib/copy-line";

const origin = "https://stampede.example";

{
  const line = copyLine(
    {
      slug: "chatgpt-wrapper",
      name: "ChatGPT wrapper / agent",
      oneLine: "Another chat box with a system prompt and an API key.",
      lane: "stampede",
      rank: 1,
      builders: 2864,
      weekId: "2026-W34",
      receiptMrrUsd: null,
      receiptLabel: null,
    },
    origin,
  );
  assert.equal(
    line,
    "SKIP · #1 ChatGPT wrapper / agent · Another chat box with a system prompt and an API key. · 2,864 builders · 2026-W34 · https://stampede.example/?w=2026-W34&c=chatgpt-wrapper",
  );
  assert.equal(line.includes("MRR"), false);
}

{
  const line = copyLine(
    {
      slug: "room-curtain-visualizer",
      name: "Room / curtain visualizer",
      oneLine: "Photo of a window. Fabric on the rod. People pay for this.",
      lane: "empty",
      rank: 1,
      builders: 8,
      weekId: "2026-W34",
      receiptMrrUsd: 720,
      receiptLabel: "ESTIMATE",
    },
    origin,
  );
  assert.equal(
    line,
    "STEAL · #1 Room / curtain visualizer · Photo of a window. Fabric on the rod. People pay for this. · 8 builders · ESTIMATE $720/mo · 2026-W34 · https://stampede.example/?w=2026-W34&c=room-curtain-visualizer",
  );
  assert.match(line, /ESTIMATE/);
  assert.equal(line.includes("verified"), false);
}

{
  const line = copyLine(
    {
      slug: "thin-hole",
      name: "Thin hole",
      oneLine: "Already bills.",
      lane: "empty",
      rank: 1,
      builders: 3,
      weekId: "2026-W34",
      receiptMrrUsd: null,
      receiptLabel: "ESTIMATE",
    },
    origin,
  );
  assert.equal(
    line,
    "STEAL · #1 Thin hole · Already bills. · 3 builders · ESTIMATE · 2026-W34 · https://stampede.example/?w=2026-W34&c=thin-hole",
  );
}

{
  const series = [
    {
      slug: "herd",
      lane: "stampede" as const,
      points: [{ rank: 2 }, { rank: 1 }],
    },
    {
      slug: "crowd",
      lane: "stampede" as const,
      points: [{ rank: 1 }, { rank: 2 }],
    },
    {
      slug: "hole",
      lane: "empty" as const,
      points: [{ rank: 1 }, { rank: 1 }],
    },
  ];
  assert.equal(pickLaneLead(series, 1, "stampede")?.slug, "herd");
  assert.equal(pickLaneLead(series, 0, "stampede")?.slug, "crowd");
  assert.equal(pickLaneLead(series, 1, "empty")?.slug, "hole");
  assert.equal(pickLaneLead([], 0, "stampede"), null);
}

{
  assert.equal(
    billThisWay("Farm / plant SOP wiki"),
    "Bill this way on Farm / plant SOP wiki.",
  );
  assert.equal(shownReceiptSource("Industry vendor page"), null);
  assert.equal(shownReceiptSource("Industry vendor rate card"), null);
  assert.equal(shownReceiptSource("Vendor site"), null);
  assert.equal(shownReceiptSource("App Store listing"), "App Store listing");
  assert.equal(
    receiptDek({
      name: "Farm / plant SOP wiki",
      leak: "Sold at Ag trade shows.",
      tip: "Farmers do not want a chat box.",
      subs: null,
    }),
    "Sold at Ag trade shows.",
  );
  assert.equal(
    receiptDek({
      name: "Farm / plant SOP wiki",
      leak: "https://apps.apple.com/x",
      tip: "x",
      subs: null,
    }),
    "Bill this way on Farm / plant SOP wiki.",
  );
  assert.equal(
    receiptDek({
      name: "Room / curtain visualizer",
      leak: "",
      tip: "",
      subs: 1200,
    }),
    "About 1,200 pay this way.",
  );
}

{
  const prompt = emptyResearchPrompt(
    {
      slug: "farm-sop-wiki",
      name: "Farm / plant SOP wiki",
      oneLine: "Spray charts and harvest notes. Not a chat box.",
      because: "Plants do not want a chat box.",
      doNot: "This is not chat-with-PDF.",
      tip: "Sold at Ag trade shows.",
      weekId: "2026-W34",
      receiptMrrUsd: null,
      receiptSource: "Industry vendor page",
      receiptLeak: "Sold at Ag trade shows.",
      evidence: [{ title: "Vendor", url: "https://example.com/farm" }],
    },
    origin,
  );
  assert.match(prompt, /business I could ship/);
  assert.match(prompt, /^# Research this hole/m);
  assert.match(prompt, /ESTIMATE/);
  assert.equal(prompt.includes("verified MRR"), true);
  assert.match(prompt, /What's working now/);
  assert.match(prompt, /What kind of business I can do/);
  assert.match(prompt, /Permalink: https:\/\/stampede\.example\/\?w=2026-W34&c=farm-sop-wiki/);
  assert.match(prompt, /Vendor: https:\/\/example.com\/farm/);
  assert.equal(prompt.includes("Industry vendor page"), false);
  assert.equal(prompt.includes("Stampede voice"), false);
}

console.log("ok copy-line");
