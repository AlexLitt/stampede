export const SITE_NAME = "Stampede";
export const SITE_TITLE = "Stampede — weekly rank of what vibe-coders ship";
export const SITE_DESCRIPTION =
  "Weekly rank of what vibe-coders are shipping versus empty holes that already bill. Stampede — skip. Empty — steal. Counts and receipts are ESTIMATE.";

export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return originFromHost(prod);
  const preview = process.env.VERCEL_URL?.trim();
  if (preview) return originFromHost(preview);
  return "http://localhost:3000";
}

function originFromHost(host: string): string {
  const h = host.replace(/\/$/, "");
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  return `https://${h}`;
}

export function absoluteUrl(path = "/"): string {
  const origin = siteOrigin();
  if (path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
