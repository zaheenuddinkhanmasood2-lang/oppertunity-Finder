import { createServerComponentClient } from "../../../lib/supabaseServer";
import { GenerateKeywordsButton } from "./GenerateKeywordsButton";
import { KeywordsTable } from "./KeywordsTable";

type PageProps = {
  params: {
    id: string;
  };
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
  const { id } = params;

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
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Niche
          </p>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {niche.name}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Source:{" "}
            <span className="font-medium text-zinc-300">
              {niche.source ?? "Unlabeled"}
            </span>
          </p>
        </div>
        <GenerateKeywordsButton nicheId={niche.id} />
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-100">
            Keywords ({keywords.length})
          </h3>
        </div>

        {keywords.length > 0 ? (
          <KeywordsTable keywords={keywords} />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-400">
            No keywords yet. Use &quot;Generate Keywords&quot; to seed this
            niche.
          </div>
        )}
      </section>
    </section>
  );
}

