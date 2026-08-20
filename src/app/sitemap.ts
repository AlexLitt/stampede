import type { MetadataRoute } from "next";
import { getBumpData } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import { isoWeekRange } from "@/lib/week";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { weeks } = await getBumpData();
  const latest = weeks[weeks.length - 1];
  const lastModified = latest ? isoWeekRange(latest).end : new Date();
  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/info"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
