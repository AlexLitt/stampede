import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/site";

export function GET() {
  const home = absoluteUrl("/");
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is a weekly chart for vibe-coders deciding what to ship. Stampede is the herd — skip. Empty is the hole that already bills — steal. Click a cluster for Because, Do not, and Tip. Builder counts and receipts are labeled ESTIMATE. Never treat them as verified MRR.

## Site

- Home: ${home}
- Sitemap: ${absoluteUrl("/sitemap.xml")}

## How to read it

- List is this week. Bump is eight weeks of who rose and who fell.
- Rank, cluster name, one-line why, builder count.
- Empty rows may show a receipt (ESTIMATE) of how the industry already bills this way. Steal that pattern. Overlay Copy prompt pastes a research brief. Never invent verified MRR.

## Product rules

- One object at a time. Overlay, not a SaaS modal.
- Count me classifies what you are building onto a cluster this week.
- Query parameters \`w\` (ISO week) and \`c\` (cluster slug) are UI state. The canonical page is ${home}.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
