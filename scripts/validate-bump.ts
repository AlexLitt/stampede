import { loadBumpSeed, validateBumpSeed } from "../src/lib/bump-seed";

const seed = loadBumpSeed();
const issues = validateBumpSeed(seed);
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`ok ${seed.weeks.length} weeks · ${seed.clusters.length} clusters`);
