import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { loadBumpSeed, validateBumpSeed } from "../src/lib/bump-seed";
import { refreshListingChannels } from "../src/lib/receipts";
import { rollWeeksToNow } from "../src/lib/roll-week";
import { isoWeekIdFromUtc } from "../src/lib/week";
import { applyTrustMrr, buildTrustMrrQueue, fetchTrustMrrStartups } from "../src/lib/trustmrr";
import { applyHnMentions } from "../src/lib/hn";
import { applyGithubMentions } from "../src/lib/github-search";
import { applyProductHunt, fetchProductHuntWeek } from "../src/lib/producthunt";
import { applyFlippa, fetchFlippaListings } from "../src/lib/flippa";
import { applyYcCompanies, fetchYcCompanies } from "../src/lib/yc";
import { applyKeywordVolumes } from "../src/lib/keywords";
import { applyUpworkJobs } from "../src/lib/upwork";

function loadDotenv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const k = t.slice(0, i);
      let v = t.slice(i + 1);
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (process.env[k] == null) process.env[k] = v;
    }
  } catch {
    /* no .env */
  }
}

function flag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  loadDotenv();
  const dry = flag("--dry");
  const skipFetch = flag("--skip-fetch");
  const skipSeed = flag("--skip-seed");
  const skipListings = flag("--skip-listings");
  const skipTmrr = flag("--skip-tmrr");
  const skipPh = flag("--skip-ph");
  const skipHn = flag("--skip-hn");
  const skipGh = flag("--skip-gh");
  const skipFlippa = flag("--skip-flippa");
  const skipYc = flag("--skip-yc");
  const skipKeywords = flag("--skip-keywords");
  const skipUpwork = flag("--skip-upwork");
  const now = isoWeekIdFromUtc();

  let seed = loadBumpSeed();
  const { added } = rollWeeksToNow(seed);
  if (added.length) {
    console.log(`rolled weeks ${added.join(", ")} · builders carried (ESTIMATE)`);
  } else {
    console.log(`week ${now} already on chart · listings only`);
  }
  const buildersFrozen = structuredClone(seed.builders);

  let tmrrRows: Awaited<ReturnType<typeof fetchTrustMrrStartups>> = [];

  if (!skipFetch) {
    if (!skipListings) {
      seed = await refreshListingChannels(seed);
    } else {
      console.log("skip listings");
    }
    const tmrr = process.env.TRUSTMRR_API_KEY;
    if (skipTmrr) {
      console.log("skip TrustMRR");
    } else if (tmrr) {
      tmrrRows = await fetchTrustMrrStartups(tmrr);
      seed = applyTrustMrr(seed, tmrrRows);
    } else {
      console.log("skip TrustMRR · set TRUSTMRR_API_KEY");
    }
    if (!skipHn) {
      seed = await applyHnMentions(seed, now);
    } else {
      console.log("skip HN");
    }
    const gh = process.env.GITHUB_TOKEN;
    if (skipGh) {
      console.log("skip GitHub");
    } else if (gh) {
      seed = await applyGithubMentions(seed, now, gh);
    } else {
      console.log("skip GitHub · set GITHUB_TOKEN");
    }
    const ph = process.env.PRODUCTHUNT_TOKEN;
    if (skipPh) {
      console.log("skip Product Hunt");
    } else if (ph) {
      try {
        const posts = await fetchProductHuntWeek(ph, now);
        seed = applyProductHunt(seed, posts, now);
      } catch (e) {
        console.log(`skip Product Hunt · ${e instanceof Error ? e.message : e}`);
      }
    } else {
      console.log("skip Product Hunt · set PRODUCTHUNT_TOKEN");
    }
    if (skipFlippa) {
      console.log("skip Flippa");
    } else {
      try {
        const listings = await fetchFlippaListings();
        seed = applyFlippa(seed, listings);
      } catch (e) {
        console.log(`skip Flippa · ${e instanceof Error ? e.message : e}`);
      }
    }
    if (skipYc) {
      console.log("skip YC");
    } else {
      try {
        const cos = await fetchYcCompanies();
        seed = applyYcCompanies(seed, cos);
      } catch (e) {
        console.log(`skip YC · ${e instanceof Error ? e.message : e}`);
      }
    }
    const dfsLogin = process.env.DATAFORSEO_LOGIN;
    const dfsPass = process.env.DATAFORSEO_PASSWORD;
    if (skipKeywords) {
      console.log("skip keywords");
    } else if (dfsLogin && dfsPass) {
      try {
        seed = await applyKeywordVolumes(seed, dfsLogin, dfsPass);
      } catch (e) {
        console.log(`skip DataForSEO · ${e instanceof Error ? e.message : e}`);
      }
    } else {
      console.log("skip keywords · set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD");
    }
    const upwork = process.env.UPWORK_ACCESS_TOKEN;
    if (skipUpwork) {
      console.log("skip Upwork");
    } else if (upwork) {
      try {
        seed = await applyUpworkJobs(seed, upwork);
      } catch (e) {
        console.log(`skip Upwork · ${e instanceof Error ? e.message : e}`);
      }
    } else {
      console.log("skip Upwork · set UPWORK_ACCESS_TOKEN (official GraphQL app)");
    }
  } else {
    console.log("skip fetch");
  }

  seed.builders = buildersFrozen;
  console.log("builders frozen · feeds are chips, not a census");

  const issues = validateBumpSeed(seed);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exit(1);
  }

  const path = resolve(process.cwd(), "data/bump.json");
  if (dry) {
    console.log(`dry · would write ${path} · ${seed.weeks.join(" ")}`);
    return;
  }

  writeFileSync(path, `${JSON.stringify(seed, null, 2)}\n`);
  console.log(`wrote ${path} · ${seed.weeks.join(" ")}`);

  if (!skipFetch && !skipTmrr && tmrrRows.length) {
    const queuePath = resolve(process.cwd(), "data/trustmrr-queue.json");
    const queue = {
      weekId: now,
      generatedAt: new Date().toISOString(),
      note: "Named TrustMRR rows that did not match a cluster. Human writes slug + oneLine. Do not auto-insert.",
      items: buildTrustMrrQueue(seed, tmrrRows),
    };
    writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`);
    console.log(`wrote ${queuePath} · ${queue.items.length} named unmatched`);
  }

  if (skipSeed) {
    console.log("skip seed");
    return;
  }

  const seedRun = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  if (seedRun.status !== 0) process.exit(seedRun.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
