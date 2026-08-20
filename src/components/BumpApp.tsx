"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import * as d3 from "d3";
import { submitBuild } from "@/app/actions";
import type { BumpSeries } from "@/lib/queries";
import {
  copyLine,
  emptyResearchPrompt,
  receiptDek,
  shownReceiptSource,
} from "@/lib/copy-line";
import { siteOrigin } from "@/lib/site";
import { BRIEFS } from "@/lib/briefs";
import {
  CATEGORIES,
  categoryBlurb,
  type CategoryId,
  weekSelectLabel,
  weekTick,
} from "@/lib/week";
import { CategoryIcon, categoryColor, categoryLabelColor } from "@/components/CategoryIcon";
import { StampedeMark } from "@/components/StampedeMark";
import {
  channelHeadline,
  channelMeta,
  evidenceChannels,
} from "@/lib/channel-evidence";

const INK = "#141413";
const OX = "#6B1212";
const STORE = "stampede.userSlug";
const HINT = "stampede.graphHint";
const GRAPH_CAP = 15;

function readStore(): string | null {
  try {
    return window.localStorage.getItem(STORE);
  } catch {
    return null;
  }
}

function writeStore(slug: string) {
  try {
    window.localStorage.setItem(STORE, slug);
  } catch {
    /* private mode */
  }
}

type LaneFilter = "stampede" | "empty";
type ViewMode = "list" | "bump";

function overlayCopy(s: BumpSeries) {
  const b = BRIEFS[s.slug];
  return {
    because: s.because.trim() || b?.because || "",
    doNot: s.doNot.trim() || b?.doNot || "",
    tip: s.tip.trim() || b?.tip || "",
  };
}

function emptyPromptText(s: BumpSeries, weekId: string) {
  return emptyResearchPrompt(
    {
      slug: s.slug,
      name: s.name,
      oneLine: s.oneLine,
      because: s.because,
      doNot: s.doNot,
      tip: s.tip,
      weekId,
      receiptMrrUsd: s.receiptMrrUsd,
      receiptSource: s.receiptSource,
      receiptLeak: s.receiptLeak,
      evidence: evidenceChannels(s.channels).map((ch) => ({
        title: channelHeadline(ch),
        url: ch.url,
      })),
    },
    siteOrigin(),
  );
}

function bindTabTrap(root: HTMLElement) {
  function onKey(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const items = [
      ...root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
  root.addEventListener("keydown", onKey);
  return () => root.removeEventListener("keydown", onKey);
}

function lerp(a: number, b: number, f: number) {
  return a + (b - a) * f;
}

function atT(s: BumpSeries, t: number) {
  const n = s.points.length;
  const i0 = Math.max(0, Math.min(n - 1, Math.floor(t)));
  const i1 = Math.min(n - 1, i0 + 1);
  const f = Math.min(1, Math.max(0, t - i0));
  const p0 = s.points[i0];
  const p1 = s.points[i1];
  return {
    rank: lerp(p0.rank, p1.rank, f),
    builders: Math.round(lerp(p0.builders, p1.builders, f)),
    rank0: p0.rank,
    lastRank: i0 > 0 ? s.points[i0 - 1].rank : p0.rank,
    lastBuilders: i0 > 0 ? s.points[i0 - 1].builders : p0.builders,
  };
}

function trail(s: BumpSeries, t: number, weekIds: string[]) {
  const byWeek = new Map(s.points.map((p) => [p.weekId, p]));
  const last = Math.min(Math.floor(t), Math.max(0, weekIds.length - 1));
  const pts: { x: number; rank: number }[] = [];
  for (let i = 0; i <= last; i++) {
    const p = byWeek.get(weekIds[i] ?? "");
    if (p) pts.push({ x: i, rank: p.rank });
  }
  if (t > last && last < weekIds.length - 1) {
    const a = byWeek.get(weekIds[last] ?? "");
    const b = byWeek.get(weekIds[last + 1] ?? "");
    if (a && b) {
      pts.push({
        x: t,
        rank: lerp(a.rank, b.rank, t - last),
      });
    }
  }
  return pts;
}

function deltaText(now: number, prev: number) {
  const d = prev - now;
  if (d > 0.15) return `up ${Math.round(d)}`;
  if (d < -0.15) return `down ${Math.round(-d)}`;
  return "stuck";
}

function buildersWow(now: number, prev: number) {
  const d = now - prev;
  if (d === 0) return { text: "flat", tone: "flat" as const };
  const sign = d > 0 ? "+" : "";
  return {
    text: `${sign}${d.toLocaleString("en-US")}`,
    tone: d > 0 ? ("up" as const) : ("down" as const),
  };
}

function writeClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => copyViaTextarea(text),
    );
  }
  return Promise.resolve(copyViaTextarea(text));
}

function copyViaTextarea(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function Wow({ now, prev }: { now: number; prev: number }) {
  const { text, tone } = buildersWow(now, prev);
  const cls =
    tone === "up" ? "wow-up" : tone === "down" ? "wow-down" : "text-mute";
  return <span className={cls}>{text}</span>;
}

function moveBadge(
  rank: number,
  lastRank: number,
  weekIndex: number,
): "NEW" | "RISING" | "COOLING" | null {
  if (weekIndex === 0) return "NEW";
  const gain = lastRank - rank;
  if (gain >= 3) return "RISING";
  if (gain <= -3) return "COOLING";
  return null;
}

export function BumpApp({
  weeks,
  series,
}: {
  weeks: string[];
  series: BumpSeries[];
}) {
  const [size, setSize] = useState({ w: 960, h: 520 });
  const chartRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(Math.max(0, weeks.length - 1));
  const [lane, setLane] = useState<LaneFilter>("stampede");
  const [view, setView] = useState<ViewMode>("list");
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const countMeBtnRef = useRef<HTMLButtonElement>(null);
  const buildInputRef = useRef<HTMLInputElement>(null);
  const briefCardRef = useRef<HTMLDivElement>(null);
  const buildFormRef = useRef<HTMLFormElement>(null);
  const openerRef = useRef<{ focus(): void } | null>(null);
  const hadOverlay = useRef(false);
  const hadBuild = useRef(false);
  const [category, setCategory] = useState<CategoryId>("all");
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; slug: string } | null>(
    null,
  );
  const [open, setOpen] = useState<string | null>(null);
  const [buildOpen, setBuildOpen] = useState(false);
  const [buildIn, setBuildIn] = useState(false);
  const [panelSlug, setPanelSlug] = useState<string | null>(null);
  const [panelIn, setPanelIn] = useState(false);
  const [allowStagger, setAllowStagger] = useState(false);
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [toastOn, setToastOn] = useState(false);
  const [pending, start] = useTransition();
  const [booted, setBooted] = useState(false);
  const [graphHint, setGraphHint] = useState(false);
  const [graphIn, setGraphIn] = useState(false);
  const [graphDrawn, setGraphDrawn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    const w = params.get("w");
    if (w) {
      const i = weeks.indexOf(w);
      if (i >= 0) setT(i);
    }
    const hit = c ? series.find((s) => s.slug === c) : null;
    if (hit) {
      setOpen(hit.slug);
      setLane(hit.lane);
    }
    const saved = readStore();
    if (saved && series.some((s) => s.slug === saved)) setUserSlug(saved);
    if (!sessionStorage.getItem(HINT)) setGraphHint(true);
    setBooted(true);
  }, [weeks, series]);

  useEffect(() => {
    if (!booted) return;
    const id = window.setTimeout(() => setAllowStagger(true), 450);
    return () => window.clearTimeout(id);
  }, [booted]);

  useEffect(() => {
    if (open) {
      setPanelSlug(open);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPanelIn(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setPanelIn(false);
  }, [open]);

  function ping(msg: string | null) {
    if (!msg) {
      setToastOn(false);
      return;
    }
    setToastText(msg);
    setToastOn(false);
    requestAnimationFrame(() => setToastOn(true));
  }

  useEffect(() => {
    if (!booted) return;
    const url = new URL(window.location.href);
    const weekId = weeks[Math.round(t)] ?? weeks[weeks.length - 1];
    if (weekId) url.searchParams.set("w", weekId);
    if (open) url.searchParams.set("c", open);
    else url.searchParams.delete("c");
    const next = `${url.pathname}${url.search}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [booted, open, t, weeks]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (buildOpen) {
        e.preventDefault();
        setBuildOpen(false);
        return;
      }
      if (!open) return;
      e.preventDefault();
      setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, buildOpen]);

  useEffect(() => {
    if (open) {
      hadOverlay.current = true;
      return;
    }
    if (!hadOverlay.current) return;
    hadOverlay.current = false;
    const node = openerRef.current;
    openerRef.current = null;
    window.requestAnimationFrame(() => {
      node?.focus?.();
    });
  }, [open]);

  useEffect(() => {
    if (buildOpen) {
      hadBuild.current = true;
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setBuildIn(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setBuildIn(false);
    if (!hadBuild.current) return;
    hadBuild.current = false;
    window.requestAnimationFrame(() => countMeBtnRef.current?.focus());
  }, [buildOpen]);

  useEffect(() => {
    if (!buildIn) return;
    buildInputRef.current?.focus();
  }, [buildIn]);

  useEffect(() => {
    if (!panelIn) return;
    closeBtnRef.current?.focus();
  }, [panelIn]);

  useEffect(() => {
    if (!panelIn) return;
    const root = briefCardRef.current;
    if (!root) return;
    return bindTabTrap(root);
  }, [panelIn]);

  useEffect(() => {
    if (!buildIn) return;
    const root = buildFormRef.current;
    if (!root) return;
    return bindTabTrap(root);
  }, [buildIn]);

  useEffect(() => {
    if (!open && !buildOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, buildOpen]);

  function openCluster(slug: string, from?: EventTarget | null) {
    if (from instanceof HTMLElement || from instanceof SVGElement) {
      openerRef.current = from;
    } else {
      openerRef.current =
        document.querySelector<HTMLElement>(`[data-cluster="${slug}"]`) ??
        null;
    }
    setBuildOpen(false);
    setOpen(slug);
  }

  useEffect(() => {
    let ro: ResizeObserver | null = null;
    let raf = 0;
    const apply = (el: HTMLDivElement) => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      const w = Math.floor(r.width);
      const h = Math.floor(r.height);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    raf = requestAnimationFrame(() => {
      const el = chartRef.current;
      if (!el) return;
      apply(el);
      ro = new ResizeObserver(() => apply(el));
      ro.observe(el);
    });
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (view !== "bump") {
      setGraphIn(false);
      setGraphDrawn(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setGraphIn(true);
      setGraphDrawn(true);
      return;
    }
    setGraphIn(false);
    setGraphDrawn(false);
    const start = requestAnimationFrame(() => {
      requestAnimationFrame(() => setGraphIn(true));
    });
    const done = window.setTimeout(
      () => setGraphDrawn(true),
      900 + (GRAPH_CAP - 1) * 40 + 80,
    );
    return () => {
      cancelAnimationFrame(start);
      window.clearTimeout(done);
    };
  }, [view, lane, category]);

  const visible = useMemo(() => {
    return series
      .filter((s) => s.lane === lane)
      .filter((s) => category === "all" || s.category === category)
      .sort((a, b) => atT(a, Math.round(t)).rank0 - atT(b, Math.round(t)).rank0);
  }, [series, lane, category, t]);

  const graphRows = visible.slice(0, GRAPH_CAP);

  const weekIndex = Math.round(t);
  const emptyLane = lane === "empty";
  const laneTitle = emptyLane ? "EMPTY" : "HERD";
  const laneDek =
    category === "all"
      ? emptyLane
        ? "Fewest builders first. Already paid."
        : "Most builders first. The crowd."
      : `${CATEGORIES.find((c) => c.id === category)?.label} · ${categoryBlurb(category)}`;
  const maxRank = Math.max(
    1,
    ...graphRows.map((s) => d3.max(s.points, (p) => p.rank) ?? 1),
  );

  const margin = { top: 28, right: 236, bottom: 36, left: 40 };
  const x = d3
    .scaleLinear()
    .domain([0, Math.max(weeks.length - 1, 1)])
    .range([margin.left, size.w - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([1, maxRank])
    .range([margin.top, size.h - margin.bottom]);
  const lineGen = d3
    .line<{ x: number; rank: number }>()
    .x((d) => x(d.x))
    .y((d) => y(d.rank))
    .curve(d3.curveBumpX);

  function opacityFor(slug: string) {
    if (!hover) return 1;
    return slug === hover || slug === userSlug ? 1 : 0.22;
  }

  function colorFor(s: BumpSeries) {
    if (s.slug === userSlug) return OX;
    return categoryColor(s.category);
  }

  const endLabels = (() => {
    const raw = graphRows.flatMap((s) => {
      const pts = trail(s, t, weeks);
      const end = pts[pts.length - 1];
      if (!end) return [];
      return [
        {
          slug: s.slug,
          name: `${s.name}${s.slug === userSlug ? " · YOU" : ""}`,
          x: x(end.x) + 10,
          y: y(end.rank),
          color: s.slug === userSlug ? OX : categoryLabelColor(s.category),
        },
      ];
    });
    const sorted = [...raw].sort((a, b) => a.y - b.y);
    const gap = 13;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].y - sorted[i - 1].y < gap) {
        sorted[i] = { ...sorted[i], y: sorted[i - 1].y + gap };
      }
    }
    return sorted;
  })();

  function dismissGraphHint() {
    if (!graphHint) return;
    setGraphHint(false);
    sessionStorage.setItem(HINT, "1");
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    dismissGraphHint();
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    const px = ((e.clientX - rect.left) / rect.width) * size.w;
    const py = ((e.clientY - rect.top) / rect.height) * size.h;
    const xi = Math.max(0, Math.min(t, x.invert(px)));
    let best: { slug: string; dist: number } | null = null;
    for (const s of graphRows) {
      const v = atT(s, Math.min(xi, t));
      const dist = Math.abs(y(v.rank) - py);
      if (!best || dist < best.dist) best = { slug: s.slug, dist };
    }
    if (best && best.dist < 28) {
      setHover(best.slug);
      setTip({ x: e.clientX, y: e.clientY, slug: best.slug });
    } else {
      setHover(null);
      setTip(null);
    }
  }

  const selected = series.find((s) => s.slug === panelSlug) ?? null;
  const brief = selected ? overlayCopy(selected) : null;
  const evidence = selected ? evidenceChannels(selected.channels) : [];
  const sourceLabel = selected
    ? shownReceiptSource(selected.receiptSource)
    : null;
  const tipSeries = series.find((s) => s.slug === tip?.slug);
  const weekId = weeks[weekIndex] ?? weeks[weeks.length - 1] ?? "";

  function copyPick(s: BumpSeries) {
    const pt = s.points[weekIndex] ?? s.points[s.points.length - 1];
    if (!pt) return;
    const line = copyLine(
      {
        slug: s.slug,
        name: s.name,
        oneLine: s.oneLine,
        lane: s.lane,
        rank: pt.rank,
        builders: pt.builders,
        weekId,
        receiptMrrUsd: s.receiptMrrUsd,
        receiptLabel: s.receiptLabel,
      },
      window.location.origin,
    );
    void writeClipboard(line).then((ok) =>
      ping(
        ok
          ? s.lane === "empty"
            ? "Copied steal"
            : "Copied skip"
          : "Copy failed",
      ),
    );
  }

  function copyEmptyPrompt(s: BumpSeries) {
    void writeClipboard(emptyPromptText(s, weekId)).then((ok) =>
      ping(ok ? "Copied prompt" : "Copy failed"),
    );
  }

  function submit(fd: FormData) {
    ping(null);
    start(async () => {
      const res = await submitBuild(fd);
      if (!res.ok) {
        ping(res.error);
        return;
      }
      writeStore(res.slug);
      setUserSlug(res.slug);
      setBuildOpen(false);
      openCluster(res.slug);
      const hit = series.find((s) => s.slug === res.slug);
      if (hit) setLane(hit.lane);
      ping(`You're in #${res.rank} · ${res.builders} builders`);
    });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        {...(open || buildOpen ? { inert: true, "aria-hidden": true } : {})}
      >
      <header className="border-b border-ink/25">
        <div className="mx-auto w-full max-w-[80rem] px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
          <div className="mx-auto flex max-w-[46rem] flex-col items-center text-center">
            <div className="inline-flex items-center gap-3">
              <Link
                href="/"
                className="press inline-flex min-h-10 items-center gap-2 text-ink no-underline"
                aria-label="Stampede home"
                onClick={(e) => {
                  if (
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey ||
                    e.button !== 0
                  ) {
                    return;
                  }
                  e.preventDefault();
                  setOpen(null);
                  setBuildOpen(false);
                  setLane("stampede");
                  setCategory("all");
                  setView("list");
                  setHover(null);
                  setTip(null);
                  setT(Math.max(0, weeks.length - 1));
                }}
              >
                <StampedeMark />
                <h1 className="rank text-[1.5rem] leading-none tracking-tight">
                  Stampede
                </h1>
              </Link>
              <Link
                href="/info"
                className="press mono inline-flex min-h-10 items-center text-[11px] uppercase tracking-[0.14em] text-mute underline decoration-1 underline-offset-4"
              >
                Info
              </Link>
            </div>
            <p className="masthead-dek mono mt-3.5 max-w-[42rem] text-pretty text-mute">
              Weekly rank of what vibe-coders are shipping versus empty holes
              that already bill. Stampede — skip. Empty — steal. Counts and
              receipts are ESTIMATE.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[80rem] flex-1 flex-col overflow-hidden px-4 sm:px-6 lg:px-10">
      <div className="shrink-0 border-b border-ink bg-paper px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-2">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <h2
              id="lane-title"
              className="rank text-[1.35rem] leading-none md:text-[1.6rem]"
            >
              {laneTitle}
            </h2>
            <p className="dek mono min-w-0 text-mute">{laneDek}</p>
          </div>
          <FilterBar
            view={view}
            lane={lane}
            weekIndex={weekIndex}
            weeks={weeks}
            category={category}
            t={t}
            onView={setView}
            onLane={setLane}
            onWeek={setT}
            onCategory={setCategory}
          />
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          className={`view-pane view-pane-bump ${view === "bump" ? "on" : ""}`}
          {...(view !== "bump" ? { inert: true, "aria-hidden": true } : {})}
        >
          <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
            <p className="mono flex shrink-0 items-start gap-2 border-b border-ink px-4 py-2 text-[12px] leading-4 text-mute">
              <span className="mt-px shrink-0 text-ink">
                <CategoryIcon id={category} />
              </span>
              <span className="min-w-0 text-pretty">
                {visible.length > GRAPH_CAP ? (
                  <>
                    Top {GRAPH_CAP} of {visible.length}.{" "}
                    <button
                      type="button"
                      className="press text-ink underline decoration-1 underline-offset-2"
                      onClick={() => setView("list")}
                    >
                      List for the rest
                    </button>
                  </>
                ) : (
                  categoryBlurb(category)
                )}
              </span>
            </p>
            <div ref={chartRef} className="relative min-h-0 flex-1 overflow-hidden">
            {graphHint && graphRows.length > 0 ? (
              <p className="graph-hint mono text-[11px] text-mute">
                Hover a line. Click for the {emptyLane ? "hole" : "herd"}.
              </p>
            ) : null}
            {visible.length === 0 ? (
              <div className="absolute inset-0 z-10 flex items-center px-4">
                <p className="mono text-[12px] text-mute">
                  Nothing in this category this week.{" "}
                  <button
                    type="button"
                    className="press underline decoration-1 underline-offset-2"
                    onClick={() => setCategory("all")}
                  >
                    Back to All
                  </button>
                </p>
              </div>
            ) : null}
            <svg
              viewBox={`0 0 ${size.w} ${size.h}`}
              preserveAspectRatio="none"
              className="absolute inset-0 block h-full w-full"
              onMouseMove={onMove}
              onPointerDown={dismissGraphHint}
              onMouseLeave={() => {
                const ae = document.activeElement;
                if (ae instanceof SVGElement && ae.closest(".graph-path")) {
                  return;
                }
                setHover(null);
                setTip(null);
              }}
              role="img"
              aria-label="Bump chart"
            >
              {d3.range(1, maxRank + 1).map((r) => (
                <g key={r}>
                  <line
                    x1={margin.left}
                    x2={size.w - margin.right}
                    y1={y(r)}
                    y2={y(r)}
                    stroke={INK}
                    strokeOpacity={0.12}
                  />
                  <text
                    x={margin.left - 8}
                    y={y(r)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill={INK}
                    fontSize={11}
                    fontFamily="var(--font-mono), monospace"
                  >
                    {r}
                  </text>
                </g>
              ))}
              {weeks.map((id, i) => {
                const tick = weekTick(id);
                return (
                  <text
                    key={id}
                    x={x(i)}
                    y={size.h - 10}
                    textAnchor="middle"
                    fill={INK}
                    fontSize={10}
                    fontFamily="var(--font-mono), monospace"
                    opacity={0.7}
                  >
                    W{tick.week}
                  </text>
                );
              })}
              {graphRows.map((s, i) => {
                const pts = trail(s, t, weeks);
                const d = lineGen(pts);
                if (!d) return null;
                const heavy = s.lane === "stampede" || s.slug === userSlug;
                const stroke = colorFor(s);
                const now = atT(s, t);
                const dashed =
                  graphDrawn && s.lane === "empty" && s.slug !== userSlug;
                return (
                  <g
                    key={s.slug}
                    className="graph-path"
                    role="button"
                    tabIndex={0}
                    focusable="true"
                    aria-label={`${s.name}, rank ${Math.round(now.rank)}`}
                    style={{
                      cursor: "pointer",
                      opacity: opacityFor(s.slug),
                    }}
                    onClick={(e) => openCluster(s.slug, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      openCluster(s.slug, e.currentTarget);
                    }}
                    onFocus={() => setHover(s.slug)}
                    onBlur={() =>
                      setHover((h) => (h === s.slug ? null : h))
                    }
                  >
                    <path d={d} fill="none" stroke="transparent" strokeWidth={18} />
                    <path
                      className={[
                        "graph-stroke",
                        graphDrawn
                          ? "is-drawn"
                          : graphIn
                            ? "graph-draw"
                            : "",
                        dashed ? "is-empty" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      d={d}
                      fill="none"
                      pathLength={1}
                      stroke={stroke}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeWidth: hover === s.slug ? 2.2 : heavy ? 1.8 : 1.4,
                        animationDelay: `${i * 40}ms`,
                      }}
                    />
                    <circle
                      className={graphDrawn ? "graph-end on" : "graph-end"}
                      cx={x(t)}
                      cy={y(now.rank)}
                      r={hover === s.slug ? 4 : 2.6}
                      fill={stroke}
                    />
                  </g>
                );
              })}
              <g className={graphDrawn ? "graph-end on" : "graph-end"}>
              <line
                x1={x(t)}
                x2={x(t)}
                y1={margin.top}
                y2={size.h - margin.bottom}
                stroke={INK}
                strokeOpacity={0.35}
              />
              {endLabels.map((lab) => (
                <text
                  key={lab.slug}
                  x={lab.x}
                  y={lab.y}
                  className="graph-label"
                  dominantBaseline="middle"
                  fill={lab.color}
                  fontSize={12}
                  fontFamily="var(--font-display), sans-serif"
                  fontWeight={700}
                  opacity={opacityFor(lab.slug)}
                  style={{ pointerEvents: "none" }}
                >
                  {lab.name}
                </text>
              ))}
              </g>
            </svg>
            {tip && tipSeries ? (
              <div
                className="pointer-events-none fixed z-20 border border-ink bg-paper px-3 py-2 font-[family-name:var(--font-mono)] text-[11px] leading-4"
                style={{ left: tip.x + 12, top: tip.y + 12 }}
              >
                <p className="name text-[15px] tracking-tight">
                  {tipSeries.name}
                  {tipSeries.slug === userSlug ? " · YOU" : ""}
                </p>
                <p className="mt-1 tabular">
                  {atT(tipSeries, t).builders.toLocaleString("en-US")} builders ·{" "}
                  <Wow
                    now={atT(tipSeries, t).builders}
                    prev={atT(tipSeries, t).lastBuilders}
                  />{" "}
                  · {deltaText(atT(tipSeries, t).rank0, atT(tipSeries, t).lastRank)}
                </p>
              </div>
            ) : null}
            </div>
          </div>
        </div>
        <div
          className={`view-pane view-pane-list ink-scroll ${view === "list" ? "on" : ""}`}
          {...(view !== "list" ? { inert: true, "aria-hidden": true } : {})}
        >
          <RankList
            rows={visible}
            weekIndex={weekIndex}
            lane={lane}
            category={category}
            userSlug={userSlug}
            onOpen={openCluster}
            onAll={() => setCategory("all")}
          />
        </div>
      </div>

      {toastText ? (
        <p
          className={`toast mono border-t border-ink px-4 py-2 text-[12px] ${toastOn ? "on" : ""}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          onTransitionEnd={(e) => {
            if (e.propertyName === "opacity" && !toastOn) setToastText(null);
          }}
        >
          {toastText}
        </p>
      ) : null}

      </main>
      <button
        ref={countMeBtnRef}
        type="button"
        className="press absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex h-10 items-center bg-ink px-4 font-[family-name:var(--font-display)] text-[1.15rem] uppercase leading-none tracking-tight text-paper"
        onClick={() => {
          setOpen(null);
          setBuildOpen(true);
        }}
      >
        Count me
      </button>
      </div>
      {selected ? (
        <div
          className={`brief-scrim fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 ${panelIn ? "open" : ""}`}
          onClick={() => setOpen(null)}
          onTransitionEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.propertyName !== "opacity") return;
            if (!panelIn) setPanelSlug(null);
          }}
        >
          <div
            ref={briefCardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="brief-title"
            className={`brief-card ink-scroll max-h-[min(56rem,92dvh)] w-full overflow-auto border-[3px] border-ink bg-paper ${
              selected.lane === "empty"
                ? "max-w-[min(52rem,calc(100vw-2rem))]"
                : "max-w-[32rem]"
            } ${allowStagger && panelIn ? "is-stagger" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink px-5 py-3">
              <p className="mono flex min-w-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-mute">
                <span className="text-ink">
                  <CategoryIcon id={selected.category} />
                </span>
                {selected.lane === "empty" ? "EMPTY" : "STAMPEDE"} ·{" "}
                {CATEGORIES.find((c) => c.id === selected.category)?.label ??
                  selected.category}
                {(() => {
                  const badge = moveBadge(
                    atT(selected, t).rank0,
                    atT(selected, t).lastRank,
                    weekIndex,
                  );
                  return badge ? ` · ${badge}` : "";
                })()}
              </p>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  className="press flex h-10 min-w-10 items-center justify-center px-3 mono text-[11px] uppercase"
                  onClick={() => copyPick(selected)}
                >
                  Copy
                </button>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="press flex h-10 min-w-10 items-center justify-center px-3 mono text-[11px] uppercase"
                  onClick={() => setOpen(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="px-5 py-5">
              <p className="rank text-[1.15rem] leading-none text-mute">
                #{Math.round(atT(selected, t).rank)}
              </p>
              <div className="ds ds-1 mt-2">
                <h2
                  id="brief-title"
                  className="name text-[1.9rem] tracking-tight"
                >
                  {selected.name}
                  {selected.slug === userSlug ? (
                    <span className="you ml-2 align-middle">YOU</span>
                  ) : null}
                </h2>
              </div>
              {brief?.because ? (
                <div className="ds ds-2 mt-5">
                  <p className="mono text-[10px] uppercase tracking-[0.14em] text-mute">
                    Because
                  </p>
                  <p className="mono mt-1.5 text-[13px] leading-5 text-pretty">
                    {brief.because}
                  </p>
                </div>
              ) : null}
              {brief?.doNot ? (
                <div className="ds ds-3 mt-5">
                  <p className="mono text-[10px] uppercase tracking-[0.14em] text-mute">
                    Do not
                  </p>
                  <p className="mono mt-1.5 text-[13px] leading-5 text-pretty">
                    {brief.doNot}
                  </p>
                </div>
              ) : null}
              {brief?.tip ? (
                <div className="ds ds-4 mt-5">
                  <p className="mono text-[10px] uppercase tracking-[0.14em] text-mute">
                    Tip
                  </p>
                  <p className="mono mt-1.5 text-[13px] leading-5 text-pretty">
                    {brief.tip}
                  </p>
                </div>
              ) : null}
              {selected.lane === "empty" ? (
                <div className="ds ds-5 mt-5">
                  <p className="mono text-[10px] uppercase tracking-[0.14em] text-mute">
                    Receipt (ESTIMATE)
                  </p>
                  {selected.receiptMrrUsd != null ? (
                    <p className="rank mt-2 text-[1.8rem] leading-none tabular text-accent">
                      ${selected.receiptMrrUsd.toLocaleString("en-US")}
                      <span className="mono ml-1 text-[13px] font-normal tracking-normal">
                        /mo
                      </span>
                    </p>
                  ) : null}
                  {selected.receiptRating != null ||
                  selected.receiptReviews != null ? (
                    <p className="mono mt-2 text-[13px] leading-5 tabular">
                      {[
                        selected.receiptRating != null
                          ? `${selected.receiptRating.toFixed(1)}★`
                          : null,
                        selected.receiptReviews != null
                          ? `${selected.receiptReviews.toLocaleString("en-US")} ${
                              selected.receiptReviews === 1
                                ? "review"
                                : "reviews"
                            }`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                  {sourceLabel ? (
                    <p className="mono mt-2 text-[13px] leading-5 text-pretty text-mute">
                      {sourceLabel}
                    </p>
                  ) : null}
                  <p className="mono mt-2 text-[13px] leading-5 text-pretty">
                    {receiptDek({
                      name: selected.name,
                      leak: selected.receiptLeak,
                      tip: brief?.tip ?? "",
                      subs: selected.receiptSubs,
                    })}
                  </p>
                  {evidence.length > 0 ? (
                    <ul className="mt-4">
                      {evidence.map((ch) => {
                        const meta = channelMeta(ch);
                        return (
                          <li key={`${ch.channel}-${ch.url}`} className="channel-chip">
                            <a
                              href={ch.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="press min-h-10 min-w-0 truncate text-[13px] underline decoration-1 underline-offset-2"
                            >
                              {channelHeadline(ch)}
                            </a>
                            {meta ? (
                              <span className="mono shrink-0 text-[11px] tabular text-mute">
                                {meta}
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              {selected.lane === "empty" ? (
                <div className="ds ds-6 mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="mono text-[10px] uppercase tracking-[0.14em] text-mute">
                      The prompt
                    </p>
                    <button
                      type="button"
                      className="press mono flex h-10 min-w-10 items-center px-3 text-[11px] uppercase"
                      onClick={() => copyEmptyPrompt(selected)}
                    >
                      Copy prompt
                    </button>
                  </div>
                  <pre className="prompt-slab mt-3">{emptyPromptText(selected, weekId)}</pre>
                  <p className="prompt-comment mt-3">
                    <span className="prompt-dollar">$</span> paste in your
                    agent. Research this hole. You press enter.
                  </p>
                </div>
              ) : null}
            </div>
            {selected.slug === userSlug ? (
              <p className="mono border-t-[3px] border-ink px-5 py-3 text-[12px] text-mute">
                {"You're counted in this cluster."}
              </p>
            ) : (
              <button
                type="button"
                disabled={pending}
                className="press w-full border-t-[3px] border-ink bg-ink py-4 font-[family-name:var(--font-display)] text-[1.3rem] uppercase text-paper disabled:opacity-50"
                onClick={() => {
                  const fd = new FormData();
                  fd.set("clusterSlug", selected.slug);
                  submit(fd);
                }}
              >
                {"I'm building this"}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {buildOpen ? (
        <div
          className={`brief-scrim fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 ${buildIn ? "open" : ""}`}
          onClick={() => setBuildOpen(false)}
        >
          <form
            ref={buildFormRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="build-title"
            action="#"
            className="brief-card w-full max-w-[32rem] border-[3px] border-ink bg-paper"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              submit(new FormData(e.currentTarget));
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink px-5 py-3">
              <p className="mono text-[10px] uppercase tracking-[0.14em] text-mute">
                Count me
              </p>
              <button
                type="button"
                className="press flex h-10 min-w-10 items-center justify-center px-3 mono text-[11px] uppercase"
                onClick={() => setBuildOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="px-5 py-5">
              <h2
                id="build-title"
                className="name text-[1.9rem] tracking-tight"
              >
                What are you building?
              </h2>
              <p className="mono mt-2 text-[13px] leading-5 text-pretty text-mute">
                One sentence. We land you on a cluster this week.
              </p>
              <input
                ref={buildInputRef}
                id="build-input"
                name="rawText"
                required
                maxLength={240}
                placeholder="I'm building..."
                aria-labelledby="build-title"
                className="composer-input mt-4 w-full bg-transparent py-3 text-[15px] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="press w-full border-t-[3px] border-ink bg-ink py-4 font-[family-name:var(--font-display)] text-[1.3rem] uppercase text-paper disabled:opacity-50"
            >
              Count me
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function HdrMenu({
  value,
  options,
  onChange,
  ariaLabel,
  leading,
  uppercase,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  ariaLabel: string;
  leading?: ReactNode;
  uppercase?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const menuClass = `flex items-center gap-1.5 whitespace-nowrap px-2.5 text-[11px] tracking-[0.08em] ${uppercase ? "uppercase" : ""}`;

  return (
    <div
      ref={wrap}
      className="relative grid h-full w-full"
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.stopPropagation();
        e.preventDefault();
        setOpen(false);
      }}
    >
      {options.map((o) => (
        <span
          key={`sizer-${o.value}`}
          aria-hidden
          className={`invisible col-start-1 row-start-1 ${menuClass}`}
        >
          {leading ? <span className="size-4 shrink-0" /> : null}
          <span className="mono">{o.label}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" className="shrink-0" />
        </span>
      ))}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`press col-start-1 row-start-1 flex h-full ${menuClass}`}
      >
        {leading}
        <span className="mono">{current}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden
          className="shrink-0"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {open ? (
        <ul role="listbox" className="hdr-menu ink-scroll">
          {options.map((o) => (
            <li key={o.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`press mono text-[11px] tracking-[0.08em] ${uppercase ? "uppercase" : ""} ${o.value === value ? "on" : ""}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FilterBar({
  view,
  lane,
  weekIndex,
  weeks,
  category,
  t,
  onView,
  onLane,
  onWeek,
  onCategory,
}: {
  view: ViewMode;
  lane: LaneFilter;
  weekIndex: number;
  weeks: string[];
  category: CategoryId;
  t: number;
  onView: (v: ViewMode) => void;
  onLane: (v: LaneFilter) => void;
  onWeek: (v: number) => void;
  onCategory: (v: CategoryId) => void;
}) {
  return (
    <nav
      aria-label="Chart filters"
      className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:items-center"
    >
      <div className="hdr-ctrl flex min-w-0 w-full border border-ink md:w-auto md:shrink-0">
        {(
          [
            { k: "list" as const, label: "List" },
            { k: "bump" as const, label: "Bump" },
          ] as const
        ).map(({ k, label }) => (
          <button
            key={k}
            type="button"
            data-view={k}
            aria-label={label}
            onClick={() => {
              onView(k);
              if (k === "list") onWeek(Math.round(t));
            }}
            className={`press seg flex min-w-0 flex-1 items-center justify-center gap-1 px-2.5 ${view === k ? "on" : ""}`}
          >
            {k === "list" ? <IconList /> : <IconBump />}
            <span className="mono text-[10px] uppercase tracking-[0.08em]">
              {label}
            </span>
          </button>
        ))}
      </div>
      <div className="hdr-ctrl mono flex min-w-0 w-full border border-ink text-[11px] uppercase tracking-[0.08em] md:w-auto md:shrink-0">
        {(["stampede", "empty"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onLane(k)}
            className={`press seg min-w-0 flex-1 px-3 ${lane === k ? "on" : ""}`}
          >
            {k === "empty" ? "Empty" : "Stampede"}
          </button>
        ))}
      </div>
      <div className="hdr-ctrl col-span-2 flex min-w-0 w-full border border-ink md:col-auto md:w-auto md:shrink-0">
        <button
          type="button"
          className="press flex w-10 shrink-0 items-center justify-center disabled:opacity-30"
          aria-label="Previous week"
          disabled={weekIndex <= 0}
          onClick={() => onWeek(Math.max(0, weekIndex - 1))}
        >
          <IconChevron dir="prev" />
        </button>
        <div className="hdr-split h-full min-w-0 flex-1">
          <HdrMenu
            value={String(weekIndex)}
            options={weeks.map((id, i) => ({
              value: String(i),
              label: weekSelectLabel(id),
            }))}
            onChange={(v) => onWeek(Number(v))}
            ariaLabel="Week"
          />
        </div>
        <button
          type="button"
          className="press flex w-10 shrink-0 items-center justify-center disabled:opacity-30"
          aria-label="Next week"
          disabled={weekIndex >= weeks.length - 1}
          onClick={() => onWeek(Math.min(weeks.length - 1, weekIndex + 1))}
        >
          <IconChevron dir="next" />
        </button>
      </div>
      <div className="hdr-ctrl col-span-2 flex min-w-0 w-full border border-ink md:col-auto md:w-auto md:shrink-0">
        <HdrMenu
          value={category}
          options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          onChange={(v) => onCategory(v as CategoryId)}
          ariaLabel="Category"
          leading={<CategoryIcon id={category} />}
          uppercase
        />
      </div>
    </nav>
  );
}

function RankList({
  rows,
  weekIndex,
  lane,
  category,
  userSlug,
  onOpen,
  onAll,
}: {
  rows: BumpSeries[];
  weekIndex: number;
  lane: LaneFilter;
  category: CategoryId;
  userSlug: string | null;
  onOpen: (slug: string, from?: EventTarget | null) => void;
  onAll: () => void;
}) {
  const empty = lane === "empty";
  return (
    <section aria-labelledby="lane-title">
      <div className="sticky top-0 z-20 bg-paper">
        <div className="grid grid-cols-[2.8rem_minmax(0,1fr)_auto] gap-3 border-b border-ink px-4 py-2 lg:grid-cols-[2.8rem_minmax(9rem,0.9fr)_minmax(12rem,1.2fr)_7.5rem_6.5rem]">
          <span className="mono text-[10px] uppercase tracking-[0.12em] text-mute">Rank</span>
          <span className="mono text-[10px] uppercase tracking-[0.12em] text-mute">Cluster</span>
          <span className="mono hidden text-[10px] uppercase tracking-[0.12em] text-mute lg:block">
            Why
          </span>
          <span className="mono hidden text-[10px] uppercase tracking-[0.12em] text-mute lg:block">
            8 weeks
          </span>
          <span className="mono text-right text-[10px] uppercase tracking-[0.12em] text-mute">
            Builders
          </span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mono px-4 py-8 text-[12px] text-mute">
          Nothing in this category this week.{" "}
          <button
            type="button"
            className="press underline decoration-1 underline-offset-2"
            onClick={onAll}
          >
            Back to All
          </button>
        </p>
      ) : null}
      <ol key={`${lane}-${category}-${weekIndex}`} className="list-crossfade">
        {rows.map((s) => {
          const pt = s.points[weekIndex] ?? s.points[s.points.length - 1];
          const prev = weekIndex > 0 ? s.points[weekIndex - 1] : pt;
          const first = pt.rank === 1;
          const mine = s.slug === userSlug;
          const badge = moveBadge(pt.rank, prev.rank, weekIndex);
          const why = s.oneLine;
          return (
            <li
              key={s.slug}
              className={`rank-row relative border-b border-ink ${empty ? "rank-row-empty" : ""}`}
            >
              <button
                type="button"
                data-cluster={s.slug}
                onClick={(e) => onOpen(s.slug, e.currentTarget)}
                className="grid w-full cursor-pointer items-center gap-3 px-4 py-3 text-left grid-cols-[2.8rem_minmax(0,1fr)_auto] lg:grid-cols-[2.8rem_minmax(9rem,0.9fr)_minmax(12rem,1.2fr)_7.5rem_6.5rem]"
              >
                <span className="rank pt-0.5 text-[2rem] leading-[0.95] md:text-[2.4rem]">
                  {pt.rank}
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 items-start gap-2">
                    <span className="mt-1.5 shrink-0 text-ink">
                      <CategoryIcon id={s.category} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="name text-[1.15rem] tracking-tight md:text-[1.4rem]">
                          {s.name}
                        </span>
                        {mine ? <span className="you">YOU</span> : null}
                      </span>
                      {badge ? (
                        <span className="mono mt-1 block text-[10px] uppercase tracking-[0.12em] text-accent">
                          {badge}
                        </span>
                      ) : null}
                      <span className="mono mt-1.5 block text-[11px] leading-4 text-mute lg:hidden">
                        {why}
                      </span>
                    </span>
                  </span>
                </span>
                <span className="mono hidden min-w-0 text-[13px] leading-5 text-mute lg:block">
                  {why}
                </span>
                <span className="hidden lg:block">
                  <Spark
                    builders={s.points.map((p) => p.builders)}
                    compact
                  />
                </span>
                <span className="mono shrink-0 pt-0.5 text-right text-[12px] leading-4 tabular">
                  <span className="block text-[14px]">
                    {pt.builders.toLocaleString("en-US")}
                  </span>
                  <span className="block">
                    <Wow now={pt.builders} prev={prev.builders} />
                  </span>
                  {empty && first ? (
                    <span className="mono mt-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                      BEST HOLE
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 4h10M3 8h10M3 12h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconChevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={dir === "prev" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </svg>
  );
}

function IconBump() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1 12 L4 4 L8 9 L12 3 L15 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="square"
      />
    </svg>
  );
}

function Spark({
  builders,
  compact,
}: {
  builders: number[];
  compact?: boolean;
}) {
  const w = compact ? 128 : 300;
  const h = compact ? 28 : 48;
  const max = Math.max(1, d3.max(builders) ?? 1);
  const min = d3.min(builders) ?? 0;
  const x = d3
    .scaleLinear()
    .domain([0, Math.max(builders.length - 1, 1)])
    .range([1, w - 1]);
  const y = d3
    .scaleLinear()
    .domain(compact ? [min * 0.98, max * 1.02 || 1] : [0, max])
    .range([h - 3, 3]);
  const d = d3
    .line<number>()
    .x((_, i) => x(i))
    .y((v) => y(v))
    .curve(d3.curveMonotoneX)(builders);
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      className={compact ? "spark block" : "mt-1"}
      aria-hidden={compact}
    >
      <path
        className="spark-line"
        d={d ?? ""}
        fill="none"
        stroke={INK}
        strokeWidth={compact ? 1.2 : 1.4}
      />
    </svg>
  );
}
