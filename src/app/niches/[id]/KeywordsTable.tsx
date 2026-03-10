"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FetchSerpButton } from "./FetchSerpButton";
import { KeywordDetailModal } from "./KeywordDetailModal";

type Keyword = {
  id: string;
  text: string;
  intent: string | null;
  opportunity_score: number | null;
  opportunity_label: string | null;
  word_count: number | null;
};

type Props = {
  keywords: Keyword[];
};

const OPPORTUNITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "hot", label: "Hot" },
  { value: "good", label: "Good" },
  { value: "average", label: "Average" },
  { value: "competitive", label: "Competitive" },
] as const;

const INTENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "informational", label: "Informational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
  { value: "navigational", label: "Navigational" },
] as const;

export function KeywordsTable({ keywords }: Props) {
  const [opportunityFilter, setOpportunityFilter] =
    useState<(typeof OPPORTUNITY_OPTIONS)[number]["value"]>("all");
  const [intentFilter, setIntentFilter] =
    useState<(typeof INTENT_OPTIONS)[number]["value"]>("all");
  const [minWordCount, setMinWordCount] = useState<string>("");
  const [maxWordCount, setMaxWordCount] = useState<string>("");
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);

  const filteredKeywords = useMemo(() => {
    const min = minWordCount === "" ? undefined : Number(minWordCount);
    const max = maxWordCount === "" ? undefined : Number(maxWordCount);

    return keywords.filter((k) => {
      if (
        opportunityFilter !== "all" &&
        (k.opportunity_label ?? undefined) !== opportunityFilter
      ) {
        return false;
      }

      if (
        intentFilter !== "all" &&
        (k.intent ?? undefined) !== intentFilter
      ) {
        return false;
      }

      if (min !== undefined || max !== undefined) {
        const wc = k.word_count ?? 0;
        if (min !== undefined && wc < min) return false;
        if (max !== undefined && wc > max) return false;
      }

      return true;
    });
  }, [keywords, opportunityFilter, intentFilter, minWordCount, maxWordCount]);

  const handleExportCsv = () => {
    if (filteredKeywords.length === 0) return;

    const header = [
      "Keyword",
      "Intent",
      "Opportunity Score",
      "Opportunity Label",
      "Word Count",
    ];

    const rows = filteredKeywords.map((k) => [
      k.text,
      k.intent ?? "",
      k.opportunity_score != null ? String(k.opportunity_score) : "",
      k.opportunity_label ?? "",
      k.word_count != null ? String(k.word_count) : "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = cell.replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "keywords.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderOpportunityBadge = (
    label: string | null,
    score: number | null,
  ) => {
    if (!label && score == null) return "—";

    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

    let color = "bg-zinc-800 text-zinc-200 border border-zinc-700";

    if (label === "hot") {
      color = "bg-red-500/20 text-red-300 border border-red-500/60";
    } else if (label === "good") {
      color = "bg-amber-500/20 text-amber-200 border border-amber-500/60";
    } else if (label === "average") {
      color = "bg-sky-500/15 text-sky-200 border border-sky-500/50";
    } else if (label === "competitive") {
      color = "bg-zinc-800 text-zinc-300 border border-zinc-600";
    }

    return (
      <span className={`${base} ${color}`}>
        {label ? label.toUpperCase() : "SCORED"}{" "}
        {score != null && (
          <span className="ml-1 text-[10px] text-zinc-300/80">({score})</span>
        )}
      </span>
    );
  };

  const renderIntentBadge = (intent: string | null) => {
    if (!intent) return <span className="text-xs text-zinc-500">—</span>;

    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

    let color = "bg-zinc-800 text-zinc-200 border border-zinc-700";

    if (intent === "informational") {
      color = "bg-sky-500/20 text-sky-200 border border-sky-500/60";
    } else if (intent === "commercial") {
      color = "bg-emerald-500/20 text-emerald-200 border border-emerald-500/60";
    } else if (intent === "transactional") {
      color = "bg-violet-500/20 text-violet-200 border border-violet-500/60";
    } else if (intent === "navigational") {
      color = "bg-zinc-700/60 text-zinc-100 border border-zinc-500/80";
    }

    return <span className={`${base} ${color}`}>{intent}</span>;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Opportunity
            </span>
            <select
              className="h-8 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 shadow-sm outline-none transition hover:border-zinc-500 focus:border-sky-500"
              value={opportunityFilter}
              aria-label="Filter by opportunity"
              onChange={(e) =>
                setOpportunityFilter(
                  e.target.value as (typeof OPPORTUNITY_OPTIONS)[number]["value"],
                )
              }
            >
              {OPPORTUNITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Intent
            </span>
            <select
              className="h-8 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 shadow-sm outline-none transition hover:border-zinc-500 focus:border-sky-500"
              value={intentFilter}
              aria-label="Filter by intent"
              onChange={(e) =>
                setIntentFilter(
                  e.target.value as (typeof INTENT_OPTIONS)[number]["value"],
                )
              }
            >
              {INTENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Min Words
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="h-8 w-20 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 shadow-sm outline-none transition hover:border-zinc-500 focus:border-sky-500"
                value={minWordCount}
                onChange={(e) => setMinWordCount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Max Words
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="h-8 w-20 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 shadow-sm outline-none transition hover:border-zinc-500 focus:border-sky-500"
                value={maxWordCount}
                onChange={(e) => setMaxWordCount(e.target.value)}
                placeholder="∞"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-700 px-3 text-xs font-medium text-zinc-100 shadow-sm transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={filteredKeywords.length === 0}
        >
          Export CSV
        </button>
      </div>

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
            {filteredKeywords.map((keyword) => (
              <tr
                key={keyword.id}
                onClick={() => setSelectedKeywordId(keyword.id)}
                className="cursor-pointer transition hover:bg-zinc-800/50"
              >
                <td className="max-w-xs px-4 py-2 align-top text-zinc-100">
                  <span className="line-clamp-2">{keyword.text}</span>
                </td>
                <td className="px-4 py-2 align-top text-xs text-zinc-400">
                  {renderIntentBadge(keyword.intent)}
                </td>
                <td className="px-4 py-2 align-top text-xs text-zinc-400">
                  {renderOpportunityBadge(
                    keyword.opportunity_label,
                    keyword.opportunity_score,
                  )}
                </td>
                <td className="px-4 py-2 align-top text-right text-xs text-zinc-300">
                  {keyword.word_count ?? "—"}
                </td>
                <td
                  className="px-4 py-2 align-top text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FetchSerpButton keywordId={keyword.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Keyword detail modal — rendered into document.body via portal */}
      {selectedKeywordId &&
        typeof document !== "undefined" &&
        createPortal(
          <KeywordDetailModal
            keywordId={selectedKeywordId}
            onClose={() => setSelectedKeywordId(null)}
          />,
          document.body,
        )}
    </div>
  );
}

