import Link from "next/link";
import { createServerComponentClient } from "../lib/supabaseServer";
import { DiscoverNichesButton } from "./_components/DiscoverNichesButton";

type Niche = {
  id: string;
  name: string;
  trend_score: number | null;
  source: string | null;
  created_at: string;
};

export default async function Home() {
  const supabase = createServerComponentClient();

  const { data: niches, error } = await supabase
    .from("niches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // In a real app you might log this somewhere central
    console.error("Error loading niches", error);
  }

  const items: Niche[] = niches ?? [];

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Niches
          </h2>
          <p className="text-sm text-zinc-400">
            High-level spaces where weak signals and opportunities emerge.
          </p>
        </div>
        <DiscoverNichesButton />
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
          <div className="max-w-md space-y-2">
            <p className="text-base font-medium text-zinc-100">
              No niches yet
            </p>
            <p className="text-sm text-zinc-400">
              Once you start ingesting signals or adding research, new niches
              will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((niche) => (
            <article
              key={niche.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm ring-1 ring-zinc-900/40 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div className="space-y-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-zinc-50">
                  {niche.name}
                </h3>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <dt className="font-medium text-zinc-300">Trend score</dt>
                    <dd>
                      {typeof niche.trend_score === "number"
                        ? niche.trend_score.toFixed(2)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1">
                    <dt className="font-medium text-zinc-300">
                      Keywords
                    </dt>
                    <dd>0</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  {niche.source ?? "Unlabeled source"}
                </p>
                <Link
                  href={`/niches/${niche.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900 transition hover:border-zinc-500 hover:bg-white"
                >
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
