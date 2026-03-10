import { createServerComponentClient } from "../../../lib/supabaseServer";
import { GenerateKeywordsButton } from "./GenerateKeywordsButton";
import { KeywordsTable } from "./KeywordsTable";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Keyword = {
  id: string;
  text: string;
  intent: string | null;
  opportunity_score: number | null;
  opportunity_label: string | null;
  word_count: number | null;
};

export default async function NicheDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = createServerComponentClient();

  const { data: niche, error } = await supabase
    .from("niches")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error loading niche", error);
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">
          Unable to load this niche
        </h2>
        <p className="text-sm text-zinc-400">
          There was a problem fetching details for this niche. Please go back
          and try again.
        </p>
      </section>
    );
  }

  if (!niche) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">
          Niche not found
        </h2>
        <p className="text-sm text-zinc-400">
          This niche may have been deleted or is unavailable.
        </p>
      </section>
    );
  }

  const { data: rawKeywords } = await supabase
    .from("keywords")
    .select("*")
    .eq("niche_id", id)
    .order("created_at", { ascending: false });

  const keywords = (rawKeywords ?? []) as Keyword[];

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400/80">
                Niche
              </p>
              <h2 className="text-3xl font-bold text-gradient sm:text-4xl">
                {niche.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 glass-light rounded-full">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm text-zinc-300">
                Source: <span className="font-medium">{niche.source ?? "Unlabeled"}</span>
              </span>
            </div>
            {niche.trend_score && (
              <div className="flex items-center gap-2 px-3 py-1.5 glass-light rounded-full">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-medium text-gradient">
                  Trend: {niche.trend_score.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
        <GenerateKeywordsButton nicheId={niche.id} />
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-zinc-100">
            Keywords ({keywords.length})
          </h3>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click any keyword to view detailed SERP analysis
          </div>
        </div>

        {keywords.length > 0 ? (
          <KeywordsTable keywords={keywords} />
        ) : (
          <div className="glass-light rounded-2xl border border-dashed border-zinc-700/50 px-6 py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400/20 to-purple-600/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-zinc-100">
                  No keywords yet
                </p>
                <p className="text-sm text-zinc-400">
                  Use "Generate Keywords" to seed this niche with opportunity-rich keywords.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

