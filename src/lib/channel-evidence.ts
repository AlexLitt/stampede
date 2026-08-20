import type { ReceiptChannel } from "./bump-seed";

export const CHANNEL_LABEL: Record<ReceiptChannel["channel"], string> = {
  g2: "G2",
  reddit: "Reddit",
  trustpilot: "Trustpilot",
  appstore: "App Store",
  upwork: "Upwork",
  capterra: "Capterra",
  trustmrr: "TrustMRR",
  hackernews: "HN",
  github: "GitHub",
  producthunt: "Product Hunt",
  playstore: "Play",
  flippa: "Flippa",
  ycombinator: "YC",
  keywords: "Keywords",
  acquire: "Acquire",
};

const BILLING = new Set(["appstore", "playstore", "trustmrr"]);

export function evidenceChannels(channels: ReceiptChannel[]): ReceiptChannel[] {
  return channels.filter(isEvidence);
}

function isEvidence(ch: ReceiptChannel): boolean {
  if (!BILLING.has(ch.channel)) return false;
  if (/search link only/i.test(ch.note)) return false;
  if (/not a receipt/i.test(ch.note)) return false;
  return true;
}

export function shownReceiptMrr(
  mrrUsd: number | null,
  channels: ReceiptChannel[],
): number | null {
  if (mrrUsd == null) return null;
  if (evidenceChannels(channels).length < 1) return null;
  return mrrUsd;
}

export function channelHeadline(ch: ReceiptChannel): string {
  const label = CHANNEL_LABEL[ch.channel];
  const title = ch.title?.trim();
  if (!title) return label;
  if (title.includes(".") && !title.includes(" ")) return label;
  return title;
}

export function channelMeta(ch: ReceiptChannel): string | null {
  const bits: string[] = [];
  if (ch.rating != null) bits.push(`${ch.rating.toFixed(1)}★`);
  if (ch.reviews != null) {
    bits.push(
      `${ch.reviews.toLocaleString("en-US")} ${ch.reviews === 1 ? "review" : "reviews"}`,
    );
  }
  if (ch.hits != null && ch.hits > 0) {
    bits.push(
      `${ch.hits.toLocaleString("en-US")} ${ch.hits === 1 ? "hit" : "hits"}`,
    );
  }
  return bits.length ? bits.join(" · ") : null;
}
