import assert from "node:assert/strict";
import {
  IP_NEW_PER_WEEK,
  countSecret,
  decideCountMe,
  extrasFromSubmissions,
  foldCounts,
} from "../src/lib/count-me";

{
  const builders = {
    herd: [10, 12],
    hole: [2, 2],
  };
  const folded = foldCounts(
    builders,
    ["2026-W33", "2026-W34"],
    [
      { weekId: "2026-W34", clusterSlug: "herd", n: 3 },
      { weekId: "2026-W33", clusterSlug: "hole", n: 1 },
      { weekId: "2026-W99", clusterSlug: "herd", n: 9 },
      { weekId: "2026-W34", clusterSlug: "ghost", n: 4 },
    ],
  );
  assert.deepEqual(folded.herd, [10, 15]);
  assert.deepEqual(folded.hole, [3, 2]);
  assert.equal("ghost" in folded, false);
  assert.deepEqual(builders.herd, [10, 12]);
}

{
  const extras = extrasFromSubmissions([
    { weekId: "2026-W34", clusterSlug: "herd", whoHash: "a" },
    { weekId: "2026-W34", clusterSlug: "herd", whoHash: "a" },
    { weekId: "2026-W34", clusterSlug: "herd", whoHash: "b" },
    { weekId: "2026-W34", clusterSlug: "hole", whoHash: "c" },
    { weekId: "2026-W34", clusterSlug: "herd", whoHash: null },
    { weekId: "2026-W34", clusterSlug: "herd", whoHash: null },
    { weekId: "2026-W34", clusterSlug: null, whoHash: "d" },
    { weekId: "2026-W34", clusterSlug: "unclassified", whoHash: "e" },
  ]);
  const by = Object.fromEntries(
    extras.map((e) => [`${e.weekId}:${e.clusterSlug}`, e.n]),
  );
  assert.equal(by["2026-W34:herd"], 4);
  assert.equal(by["2026-W34:hole"], 1);
  assert.equal(by["2026-W34:unclassified"], undefined);
}

{
  assert.deepEqual(
    decideCountMe({
      targetSlug: "herd",
      existing: null,
      identitiesOnIp: 0,
    }),
    { ok: true, action: "insert" },
  );
  assert.deepEqual(
    decideCountMe({
      targetSlug: "herd",
      existing: { clusterSlug: "herd" },
      identitiesOnIp: 9,
    }),
    { ok: true, action: "noop" },
  );
  assert.deepEqual(
    decideCountMe({
      targetSlug: "hole",
      existing: { clusterSlug: "herd" },
      identitiesOnIp: 9,
    }),
    { ok: true, action: "move" },
  );
  const blocked = decideCountMe({
    targetSlug: "herd",
    existing: null,
    identitiesOnIp: IP_NEW_PER_WEEK,
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.match(blocked.error, /network/i);
  }
}

{
  const prevNode = process.env.NODE_ENV;
  const prevSecret = process.env.COUNT_SECRET;
  const prevVercel = process.env.VERCEL_ENV;
  process.env.NODE_ENV = "production";
  delete process.env.COUNT_SECRET;
  delete process.env.VERCEL_ENV;
  assert.throws(() => countSecret(), /COUNT_SECRET/);
  process.env.COUNT_SECRET = "change-me-in-prod";
  assert.throws(() => countSecret(), /COUNT_SECRET/);
  process.env.COUNT_SECRET = "prod-count-secret-ok";
  assert.equal(countSecret(), "prod-count-secret-ok");
  process.env.NODE_ENV = prevNode;
  if (prevSecret == null) delete process.env.COUNT_SECRET;
  else process.env.COUNT_SECRET = prevSecret;
  if (prevVercel == null) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = prevVercel;
}

console.log("ok count-me");
