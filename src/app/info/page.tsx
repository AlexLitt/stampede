import type { Metadata } from "next";
import Link from "next/link";
import { StampedeMark } from "@/components/StampedeMark";

export const metadata: Metadata = {
  title: "Info",
  description:
    "Why Stampede exists. A weekly chart for solo founders watching the herd and the holes that already bill. Ping alex@veritylab.co.",
  alternates: { canonical: "/info" },
};

export default function InfoPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-ink/25">
        <div className="mx-auto w-full max-w-[80rem] px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
          <div className="mx-auto flex max-w-[40rem] flex-col items-center text-center">
            <div className="inline-flex items-center gap-3">
              <Link
                href="/"
                className="press inline-flex min-h-10 items-center gap-2 text-ink no-underline"
                aria-label="Stampede home"
              >
                <StampedeMark />
                <p className="rank text-[1.5rem] leading-none tracking-tight">
                  Stampede
                </p>
              </Link>
              <span className="mono inline-flex min-h-10 items-center text-[11px] uppercase tracking-[0.14em] text-ink">
                Info
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[40rem] px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="name text-[2.1rem] tracking-tight">Hi.</h1>
        <div className="mono mt-8 space-y-5 text-[15px] leading-6 text-pretty">
          <p>
            I made this page so solo founders can see what vibe-coders are
            shipping this week — and what already bills like a real business.
          </p>
          <p>
            I scrape public sources. I look for industries the crowd has
            overwhelmed, and for thin holes that still take money. Stampede is
            skip. Empty is steal. Counts and receipts are ESTIMATE.
          </p>
          <p>I update the chart every week.</p>
          <p>
            Questions or a hole I missed:{" "}
            <a
              href="mailto:alex@veritylab.co"
              className="underline decoration-1 underline-offset-2"
            >
              alex@veritylab.co
            </a>
          </p>
        </div>
        <p className="mono mt-12 text-[11px] uppercase tracking-[0.14em]">
          <Link
            href="/"
            className="press inline-flex min-h-10 items-center underline decoration-1 underline-offset-4"
          >
            Back to the chart
          </Link>
        </p>
      </main>
    </div>
  );
}
