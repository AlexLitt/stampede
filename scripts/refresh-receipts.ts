import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadBumpSeed, validateBumpSeed } from "../src/lib/bump-seed";
import { refreshListingChannels } from "../src/lib/receipts";

async function main() {
  let seed = loadBumpSeed();
  seed = await refreshListingChannels(seed);
  const issues = validateBumpSeed(seed);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exit(1);
  }
  writeFileSync(
    resolve(process.cwd(), "data/bump.json"),
    `${JSON.stringify(seed, null, 2)}\n`,
  );
  console.log("wrote data/bump.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
