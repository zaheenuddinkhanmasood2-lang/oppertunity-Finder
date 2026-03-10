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
    if (!label && score == null) return (
      <span className="text-zinc-500 text-xs">—</span>
    );

    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border transition-all duration-300 badge-glow";

    let color = "bg-zinc-800/50 text-zinc-300 border-zinc-600/50";

    if (label === "hot") {
      color = "bg-red-500/20 text-red-300 border-red-500/60 glow-pink";
    } else if (label === "good") {
      color = "bg-amber-500/20 text-amber-200 border-amber-500/60 glow-amber";
    } else if (label === "average") {
      color = "bg-sky-500/15 text-sky-200 border-sky-500/50 glow-cyan";
    } else if (label === "competitive") {
      color = "bg-zinc-700/60 text-zinc-200 border-zinc-600/80";
    }

    return (
      <span className={`${base} ${color}`}>
        {label ? label.toUpperCase() : "SCORED"}{" "}
        {score != null && (
          <span className="ml-1 text-[10px] opacity-80">({score})</span>
        )}
      </span>
    );
  };

  const renderIntentBadge = (intent: string | null) => {
    if (!intent) return <span className="text-zinc-500 text-xs">—</span>;

    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border transition-all duration-300";

    let color = "bg-zinc-800/50 text-zinc-300 border-zinc-600/50";

    if (intent === "informational") {
      color = "bg-sky-500/20 text-sky-200 border-sky-500/60 glow-cyan";
    } else if (intent === "commercial") {
      color = "bg-emerald-500/20 text-emerald-200 border-emerald-500/60 glow-emerald";
    } else if (intent === "transactional") {
      color = "bg-violet-500/20 text-violet-200 border-violet-500/60 glow-purple";
    } else if (intent === "navigational") {
      color = "bg-zinc-700/60 text-zinc-100 border-zinc-500/80";
    }

    return <span className={`${base} ${color}`}>{intent}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
              Opportunity
            </span>
            <select
              className="h-10 rounded-xl border border-zinc-700/50 glass px-4 text-sm text-zinc-100 outline-none transition hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
              Intent
            </span>
            <select
              className="h-10 rounded-xl border border-zinc-700/50 glass px-4 text-sm text-zinc-100 outline-none transition hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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

          <div className="flex gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                Min Words
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="h-10 w-24 rounded-xl border border-zinc-700/50 glass px-4 text-sm text-zinc-100 outline-none transition hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                value={minWordCount}
                onChange={(e) => setMinWordCount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                Max Words
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="h-10 w-24 rounded-xl border border-zinc-700/50 glass px-4 text-sm text-zinc-100 outline-none transition hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
          className="btn-glass inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          disabled={filteredKeywords.length === 0}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'var(--md-sys-color-surface-container)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
          <thead style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Keyword
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Intent
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Opportunity
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Word Count
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            {filteredKeywords.map((keyword, index) => (
              <tr
                key={keyword.id}
                onClick={() => setSelectedKeywordId(keyword.id)}
                className="cursor-pointer transition-all duration-200 hover:bg-surface-container-high"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  color: 'var(--md-sys-color-on-surface)'
                }}
              >
                <td className="max-w-xs px-6 py-4 align-top">
                  <span className="text-zinc-100 font-medium line-clamp-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>{keyword.text}</span>
                </td>
                <td className="px-6 py-4 align-top">
                  {renderIntentBadge(keyword.intent)}
                </td>
                <td className="px-6 py-4 align-top">
                  {renderOpportunityBadge(
                    keyword.opportunity_label,
                    keyword.opportunity_score,
                  )}
                </td>
                <td className="px-6 py-4 align-top text-right">
                  <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {keyword.word_count ?? "—"}
                  </span>
                </td>
                <td
                  className="px-6 py-4 align-top text-right"
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

