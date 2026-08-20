import assert from "node:assert/strict";
import { rankLane, rankWeeks } from "../src/lib/rank";

{
  const r = rankLane(
    ["a", "b", "c"],
    { a: 10, b: 30, c: 20 },
    {},
    "stampede",
  );
  assert.deepEqual(r, { b: 1, c: 2, a: 3 });
}

{
  const r = rankLane(
    ["a", "b", "c"],
    { a: 10, b: 30, c: 20 },
    {},
    "empty",
  );
  assert.deepEqual(r, { a: 1, c: 2, b: 3 });
}

{
  const r = rankLane(
    ["a", "b"],
    { a: 5, b: 5 },
    { a: 2, b: 1 },
    "stampede",
  );
  assert.deepEqual(r, { b: 1, a: 2 });
}

{
  const ranks = rankWeeks(
    [
      { slug: "hot", lane: "stampede" },
      { slug: "mid", lane: "stampede" },
      { slug: "thin", lane: "empty" },
      { slug: "thinner", lane: "empty" },
    ],
    ["2026-W01", "2026-W02"],
    {
      hot: [100, 80],
      mid: [50, 90],
      thin: [8, 8],
      thinner: [3, 9],
    },
  );
  assert.deepEqual(ranks.hot, [1, 2]);
  assert.deepEqual(ranks.mid, [2, 1]);
  assert.deepEqual(ranks.thinner, [1, 2]);
  assert.deepEqual(ranks.thin, [2, 1]);
}

console.log("ok rank");
