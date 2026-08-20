import type { BumpSeries } from "./queries";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, siteOrigin } from "./site";
import { isoWeekRange } from "./week";

export function stampedeJsonLd(weeks: string[], series: BumpSeries[]) {
  const origin = siteOrigin();
  const latest = weeks[weeks.length - 1] ?? null;
  const first = weeks[0] ?? null;
  const modified = latest
    ? isoWeekRange(latest).end.toISOString()
    : new Date().toISOString();
  const stampede = series.filter((s) => s.lane === "stampede");

  const organization = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: SITE_NAME,
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/apple-icon"),
    },
    description: SITE_DESCRIPTION,
  };

  const website = {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": `${origin}/#organization` },
  };

  const app = {
    "@type": "WebApplication",
    "@id": `${origin}/#app`,
    name: SITE_NAME,
    url: origin,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    inLanguage: "en",
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: { "@id": `${origin}/#organization` },
  };

  const dataset = latest
    ? {
        "@type": "Dataset",
        "@id": `${origin}/#dataset`,
        name: "Stampede weekly vibe-coder cluster ranks",
        description:
          "Weekly builder counts and ranks for vibe-coded product clusters. Builder counts and receipts are estimates, not verified MRR.",
        url: origin,
        creator: { "@id": `${origin}/#organization` },
        isAccessibleForFree: true,
        inLanguage: "en",
        dateModified: modified,
        temporalCoverage: first && latest ? `${first}/${latest}` : latest,
        variableMeasured: ["rank", "builders"],
      }
    : null;

  const itemList =
    latest && stampede.length
      ? {
          "@type": "ItemList",
          "@id": `${origin}/#herd`,
          name: `Stampede herd ${latest}`,
          description:
            "Clusters with the most builders this week. Skip the crowd.",
          url: origin,
          numberOfItems: stampede.length,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: stampede.map((s, i) => {
            const pt =
              s.points.find((p) => p.weekId === latest) ??
              s.points[s.points.length - 1];
            return {
              "@type": "ListItem",
              position: pt?.rank ?? i + 1,
              name: s.name,
              description: s.oneLine,
            };
          }),
        }
      : null;

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, app, dataset, itemList].filter(Boolean),
  };
}
