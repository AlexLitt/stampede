import assert from "node:assert/strict";
import { copyLine, pickLaneLead } from "../src/lib/copy-line";

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

console.log("ok copy-line");
