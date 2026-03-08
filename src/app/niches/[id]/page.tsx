import { notFound } from "next/navigation";
import { createServerComponentClient } from "../../../lib/supabaseServer";
import { GenerateKeywordsButton } from "./GenerateKeywordsButton";
import { FetchSerpButton } from "./FetchSerpButton";

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
  }

  if (!niche) {
    notFound();
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
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-900/80">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Keyword
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Intent
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Opportunity
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Word Count
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {keywords.map((keyword) => (
                  <tr key={keyword.id}>
                    <td className="max-w-xs px-4 py-2 align-top text-zinc-100">
                      <span className="line-clamp-2">{keyword.text}</span>
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-zinc-400">
                      {/* Placeholder for future intent classification */}
                      {keyword.intent ?? "—"}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-zinc-400">
                      {/* Placeholder for future opportunity scoring */}
                      {keyword.opportunity_label ??
                        (keyword.opportunity_score != null
                          ? keyword.opportunity_score
                          : "—")}
                    </td>
                    <td className="px-4 py-2 align-top text-right text-xs text-zinc-300">
                      {keyword.word_count ?? "—"}
                    </td>
                    <td className="px-4 py-2 align-top text-right">
                      <FetchSerpButton keywordId={keyword.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

