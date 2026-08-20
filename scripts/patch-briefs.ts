import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BRIEFS } from "../src/lib/briefs";

type Row = {
  slug: string;
  name: string;
  oneLine: string;
  lane: string;
  category: string;
  keywords: string;
  [k: string]: unknown;
};

const path = resolve(process.cwd(), "data/bump.json");
const seed = JSON.parse(readFileSync(path, "utf8")) as {
  clusters: Row[];
  [k: string]: unknown;
};
const missing: string[] = [];
seed.clusters = seed.clusters.map((c) => {
  const b = BRIEFS[c.slug];
  if (!b) {
    missing.push(c.slug);
    return c;
  }
  const { slug, name, oneLine, lane, category, keywords, ...rest } = c;
  return {
    slug,
    name,
    oneLine,
    because: b.because,
    doNot: b.doNot,
    tip: b.tip,
    lane,
    category,
    keywords,
    ...rest,
  };
});
if (missing.length) {
  console.error(`no brief for ${missing.join(", ")}`);
  process.exit(1);
}
const extra = Object.keys(BRIEFS).filter(
  (slug) => !seed.clusters.some((c) => c.slug === slug),
);
if (extra.length) {
  console.error(`brief for missing cluster ${extra.join(", ")}`);
  process.exit(1);
}
writeFileSync(path, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`patched ${seed.clusters.length} briefs`);
