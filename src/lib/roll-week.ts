import type { BumpSeed } from "./bump-seed";
import { isoWeekIdFromUtc, nextIsoWeekId } from "./week";

const WINDOW = 8;

export function rollWeeksToNow(
  seed: BumpSeed,
  now = new Date(),
): { seed: BumpSeed; added: string[] } {
  const current = isoWeekIdFromUtc(now);
  const added: string[] = [];
  let last = seed.weeks[seed.weeks.length - 1];
  if (!last) {
    seed.weeks = [current];
    for (const c of seed.clusters) {
      seed.builders[c.slug] = [0];
    }
    return { seed, added: [current] };
  }

  let guard = 0;
  while (last < current && guard < 8) {
    const next = nextIsoWeekId(last);
    seed.weeks.push(next);
    for (const c of seed.clusters) {
      const series = seed.builders[c.slug] ?? [];
      const prev = series[series.length - 1] ?? 0;
      series.push(prev);
      seed.builders[c.slug] = series;
    }
    added.push(next);
    last = next;
    guard += 1;
  }

  while (seed.weeks.length > WINDOW) {
    seed.weeks.shift();
    for (const c of seed.clusters) {
      const series = seed.builders[c.slug];
      if (series?.length) series.shift();
    }
  }

  return { seed, added };
}
