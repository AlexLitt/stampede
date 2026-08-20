const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Monday–Sunday for an ISO week id like 2026-W34. */
export function isoWeekRange(weekId: string): { start: Date; end: Date } {
  const [ys, ws] = weekId.split("-W");
  const y = Number(ys);
  const w = Number(ws);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dow + 1 + (w - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday, end: sunday };
}

export function formatDay(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function weekHeadline(weekId: string): string {
  const { start, end } = isoWeekRange(weekId);
  const [year, num] = weekId.split("-W");
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const span = sameMonth
    ? `${start.getUTCDate()}–${end.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${year}`
    : `${formatDay(start)}–${formatDay(end)} ${year}`;
  return `WEEK ${num} · ${span}`;
}

export function weekSelectLabel(weekId: string): string {
  const { start, end } = isoWeekRange(weekId);
  const num = weekId.split("-W")[1];
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const span = sameMonth
    ? `${start.getUTCDate()}–${end.getUTCDate()} ${MONTHS[start.getUTCMonth()]}`
    : `${formatDay(start)}–${formatDay(end)}`;
  return `W${num} · ${span}`;
}

export function isoWeekIdFromUtc(d: Date = new Date()): string {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function nextIsoWeekId(weekId: string): string {
  const { end } = isoWeekRange(weekId);
  const n = new Date(end);
  n.setUTCDate(end.getUTCDate() + 1);
  return isoWeekIdFromUtc(n);
}

export function weekTick(weekId: string): { week: string; date: string } {
  const { start } = isoWeekRange(weekId);
  return {
    week: weekId.split("-W")[1] ?? weekId,
    date: formatDay(start),
  };
}

export const CATEGORIES = [
  {
    id: "all",
    label: "All",
    blurb: "Weekly rank of vibe-coder clusters. Stampede is the herd. Empty is the hole that already bills.",
  },
  {
    id: "agents",
    label: "Agents",
    blurb: "A chat box, a system prompt, an API key. They call it an agent.",
  },
  {
    id: "docs",
    label: "Docs",
    blurb: "Paste a file, get a summary, ship the landing page. The PDF did not consent.",
  },
  {
    id: "content",
    label: "Content",
    blurb: "Hooks, carousels, thumbnails. LinkedIn already liked this post for you.",
  },
  {
    id: "agency",
    label: "Agency",
    blurb: "A portal the client will open once. Files, comments, an invoice that chases them.",
  },
  {
    id: "consumer",
    label: "Consumer",
    blurb: "Better selfies and other sins people pay for while claiming they don't.",
  },
  {
    id: "local",
    label: "Local / trade",
    blurb: "Dentists, drapes, funerals, vets, bays, twelve doors. Ugly software. Actual money. Not on Twitter.",
  },
  {
    id: "money",
    label: "Money tools",
    blurb: "A dashboard that counts dollars on one channel. Someone already bills for the ugly version.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryBlurb(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.blurb ?? CATEGORIES[0].blurb;
}
