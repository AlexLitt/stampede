import {
  hayContainsMention,
  matchCluster,
  mentionQuery,
  UNCLASSIFIED,
  type MatchableCluster,
} from "../src/lib/match";
import { applyProductHunt } from "../src/lib/producthunt";
import type { BumpSeed } from "../src/lib/bump-seed";
import seedJson from "../data/bump.json";

const clusters = seedJson.clusters as MatchableCluster[];

const cases: [string, string][] = [
  ["ai resume builder", "ai-resume"],
  ["ai resume builder for students", "ai-resume"],
  ["curtain visualizer from a photo", "room-curtain-visualizer"],
  ["room photo of curtains", "room-curtain-visualizer"],
  ["chat with pdf", "chat-with-pdf"],
  ["landing page builder from a prompt", "landing-page-ai"],
  ["vet recall sms for a clinic", "vet-recall-sms"],
  ["auto shop reminder for oil change", "auto-shop-sms"],
  ["solo landlord twelve units", "property-manager-solo"],
  ["asdf qwerty", UNCLASSIFIED],
];

let failed = 0;
for (const [text, want] of cases) {
  const got = matchCluster(text, clusters);
  if (got !== want) {
    console.error(`FAIL "${text}" → ${got} (want ${want})`);
    failed++;
  } else {
    console.log(`ok  "${text}" → ${got}`);
  }
}

const wrapper = clusters.find((c) => c.slug === "chatgpt-wrapper");
if (!wrapper) {
  console.error("FAIL missing chatgpt-wrapper");
  failed++;
} else {
  const q = mentionQuery(wrapper);
  if (q !== "chatgpt wrapper") {
    console.error(`FAIL mentionQuery chatgpt-wrapper → ${q}`);
    failed++;
  }
  if (hayContainsMention("BlinkBot an AI agent for sales", q)) {
    console.error("FAIL PH bait: BlinkBot matched chatgpt wrapper");
    failed++;
  } else {
    console.log("ok  PH bait BlinkBot skipped");
  }
}

const phSeed = {
  weeks: ["2026-W34"],
  clusters: [
    {
      slug: "chatgpt-wrapper",
      name: "ChatGPT wrapper / agent",
      oneLine: "x",
      because: "x",
      doNot: "x",
      tip: "x",
      lane: "stampede" as const,
      category: "agents",
      keywords: "gpt, wrapper",
      channels: [],
    },
  ],
  builders: { "chatgpt-wrapper": [1] },
} satisfies BumpSeed;

applyProductHunt(
  phSeed,
  [
    {
      id: "1",
      name: "BlinkBot",
      tagline: "An AI agent for your inbox",
      url: "https://example.com/blink",
      votesCount: 99,
    },
  ],
  "2026-W34",
  () => {},
);
const ph = phSeed.clusters[0].channels?.find((c) => c.channel === "producthunt");
if (ph?.hits) {
  console.error(`FAIL PH BlinkBot hits ${ph.hits}`);
  failed++;
} else {
  console.log("ok  PH BlinkBot not a chatgpt-wrapper chip");
}

if (failed) process.exit(1);
console.log("match tests passed");
