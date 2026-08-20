---
name: Stampede
description: Weekly bump chart of vibe-coder clusters versus empty holes that already bill.
colors:
  paper: "#F4F1E8"
  paper-2: "#EBE6D9"
  ink: "#141413"
  mute: "#6E6C67"
  accent: "#6B1212"
  up: "#2E7A45"
  down: "#9A4540"
  cat-agents: "#2F6FED"
  cat-docs: "#C45C14"
  cat-content: "#C11A7A"
  cat-agency: "#1F7A4D"
  cat-consumer: "#7A3CFF"
  cat-local: "#6B1212"
  cat-money: "#0F7A8C"
typography:
  display:
    fontFamily: "Oswald, sans-serif"
    fontSize: "2.4rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  body:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  icon: "2px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    typography: "{typography.display}"
  button-seg-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "32px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
    typography: "{typography.body}"
---

## Overview

Stampede is a single-screen tool: cream newsprint, black rules, no cards. Oswald for ranks and cluster names. IBM Plex Mono for everything else. Square 16px category tiles carry the only chroma besides oxblood, wow green, and wow red. Header controls are 32px hairline boxes. The chart is a ranked list or a d3 bump. Click a row, a right drawer slides in.

## Colors

Paper `#F4F1E8` is the body. Ink `#141413` is type and rules. Mute `#6E6C67` is dek and why. Accent `#6B1212` is Empty, YOU, and first-place marks. Category colors are for icons and bump strokes only, never for large fills. Graph end-labels use darkened variants that meet 4.5:1 on paper. Wow up/down are `#2E7A45` / `#9A4540`. Grain overlay on body at 8% opacity.

## Typography

Two families, not three. Display = Oswald 700, tracking ≥ -0.04em, used on ranks, cluster names, Count me. Body = IBM Plex Mono with `tabular-nums` on every number that moves. Captions = 10–11px mono, uppercase, tracking 0.08–0.14em, labels only, never sentences. Headings get `text-wrap: balance` when we next touch them.

## Elevation

None. No shadows. Stacking is hairline borders and a 3px rule on the header and composer. Overlay is a 3px-ruled paper card on a 35% ink scrim. z-index: tooltip 20, sticky list header 10, overlay 60. Grain is texture, not depth.

## Components

Header segs invert fill when selected, `scale(0.96)` on press, 180ms `cubic-bezier(0.2, 0, 0, 1)`. Week control is chevron + menu + chevron. Category control is color tile + menu. List rows: 2px left rule on hover (oxblood on Empty), spark brighter, no translate. Overlay: 220ms fade, stagger Because/Do not/Tip after first paint. Toast: 2px slide + fade. Composer focus: 3px inset bottom rule, no glow. Count me is inverted ink on paper.

## Do's and Don'ts

Do keep square corners, black rules, ESTIMATE labels, and two grammars (Skip vs Empty because).
Do isolate a bump line on hover; dim others to 0.25.
Don't add cards, shadows, rounded app chrome, or a KPI strip of four hero metrics.
Don't use side-stripes thicker than 2px as the main accent (the 6px first/YOU bar is a known debt).
Don't put Oswald on small UI labels. Don't animate layout properties. Don't roast.
Don't invent verified MRR. Don't drop `prefers-reduced-motion`.
