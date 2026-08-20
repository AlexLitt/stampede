import assert from "node:assert/strict";
import {
  CATEGORY_LABEL_COLOR,
  PAPER,
  WOW_DOWN,
} from "../src/components/CategoryIcon";

function lin(c: number) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function lum(hex: string) {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: string, bg: string) {
  const a = lum(fg);
  const b = lum(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

assert.ok(contrast(WOW_DOWN, PAPER) >= 4.5, `wow-down ${WOW_DOWN}`);
for (const [id, color] of Object.entries(CATEGORY_LABEL_COLOR)) {
  assert.ok(
    contrast(color, PAPER) >= 4.5,
    `${id} ${color} ${contrast(color, PAPER).toFixed(2)}`,
  );
}

console.log("ok contrast");
