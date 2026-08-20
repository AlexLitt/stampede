import { BumpApp } from "@/components/BumpApp";
import { stampedeJsonLd } from "@/lib/jsonld";
import { getBumpData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { weeks, series } = await getBumpData();
  const jsonLd = stampedeJsonLd(weeks, series);
  if (!weeks.length) {
    return (
      <main className="px-6 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <h1 className="rank text-[1.5rem]">Stampede</h1>
        <p className="mono mt-3">Seed the chart. npx tsx prisma/seed.ts</p>
      </main>
    );
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <BumpApp weeks={weeks} series={series} />
    </>
  );
}
