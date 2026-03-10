"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type SerpResult = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  published_at: string | null;
};

type WeakSignals = {
  is_forum?: boolean;
  is_outdated?: boolean;
  is_thin?: boolean;
  is_low_authority?: boolean;
};

type KeywordData = {
  id: string;
  text: string;
  intent: string | null;
  opportunity_score: number | null;
  opportunity_label: string | null;
  weak_signals: WeakSignals | null;
  last_serp_fetch: string | null;
};

type SnapshotData = {
  id: string;
  results: SerpResult[];
  fetch_time: string;
};

type ModalState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; keyword: KeywordData; snapshot: SnapshotData | null };

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function OpportunityBadge({
  label,
  score,
}: {
  label: string | null;
  score: number | null;
}) {
  if (!label && score == null) return <span className="text-zinc-500">—</span>;

  const colorMap: Record<string, string> = {
    hot: "bg-red-500/20 text-red-300 border-red-500/60",
    good: "bg-amber-500/20 text-amber-200 border-amber-500/60",
    average: "bg-sky-500/15 text-sky-200 border-sky-500/50",
    competitive: "bg-zinc-800 text-zinc-300 border-zinc-600",
  };

  const color =
    label && colorMap[label]
      ? colorMap[label]
      : "bg-zinc-800 text-zinc-200 border-zinc-700";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {label ? label.toUpperCase() : "SCORED"}
      {score != null && (
        <span className="text-[10px] opacity-70">({score})</span>
      )}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string | null }) {
  if (!intent) return <span className="text-zinc-500">—</span>;

  const colorMap: Record<string, string> = {
    informational: "bg-sky-500/20 text-sky-200 border-sky-500/60",
    commercial: "bg-emerald-500/20 text-emerald-200 border-emerald-500/60",
    transactional: "bg-violet-500/20 text-violet-200 border-violet-500/60",
    navigational: "bg-zinc-700/60 text-zinc-100 border-zinc-500/80",
  };

  const color =
    colorMap[intent] ?? "bg-zinc-800 text-zinc-200 border-zinc-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${color}`}
    >
      {intent}
    </span>
  );
}

const SIGNAL_META: {
  key: keyof WeakSignals;
  label: string;
  description: string;
  points: number;
  icon: string;
}[] = [
  {
    key: "is_forum",
    label: "Forum Content",
    description: "Reddit / Quora / Medium rank here — demand exists but no dedicated resource",
    points: 30,
    icon: "💬",
  },
  {
    key: "is_outdated",
    label: "Outdated Content",
    description: "Top results are older than 2 years — ripe for a fresh take",
    points: 25,
    icon: "⏰",
  },
  {
    key: "is_thin",
    label: "Thin Content",
    description: "Snippet text is sparse — the existing pages lack depth",
    points: 20,
    icon: "📄",
  },
  {
    key: "is_low_authority",
    label: "Low-Authority Domains",
    description: "Weak TLDs (.xyz, .top) rank here — easy to outrank",
    points: 15,
    icon: "🏚️",
  },
];

/* ------------------------------------------------------------------ */
/*  Main Modal Component                                                */
/* ------------------------------------------------------------------ */

type Props = {
  keywordId: string;
  onClose: () => void;
};

export function KeywordDetailModal({ keywordId, onClose }: Props) {
  const [state, setState] = useState<ModalState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* ---------- fetch SERP data ---------------------------------------- */
  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/keywords/${keywordId}/serp`);
      if (!res.ok) throw new Error("Failed to load SERP data");
      const json = await res.json();
      setState({
        status: "success",
        keyword: json.keyword,
        snapshot: json.snapshot,
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [keywordId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- close on Escape / overlay click ------------------------ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  /* ---------- refresh SERP ------------------------------------------ */
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/fetch-serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const msg = json?.error ?? `Server error (${res.status})`;
        throw new Error(msg);
      }
      // Re-load the modal data after refresh
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "SERP refresh failed";
      console.error("SERP refresh error", message);
      setState({ status: "error", message });
    } finally {
      setRefreshing(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */

  const results: SerpResult[] =
    state.status === "success" && state.snapshot?.results
      ? state.snapshot.results.slice(0, 10)
      : [];

  const keyword = state.status === "success" ? state.keyword : null;
  const weakSignals: WeakSignals = keyword?.weak_signals ?? {};
  const activeSignals = SIGNAL_META.filter((s) => weakSignals[s.key]);

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* Panel */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl ring-1 ring-white/5">
        {/* ---- Header ---- */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
          <div className="min-w-0 space-y-1.5">
            {state.status === "success" ? (
              <>
                <h2 className="truncate text-base font-semibold text-zinc-50">
                  {keyword?.text}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <IntentBadge intent={keyword?.intent ?? null} />
                  <OpportunityBadge
                    label={keyword?.opportunity_label ?? null}
                    score={keyword?.opportunity_score ?? null}
                  />
                </div>
              </>
            ) : (
              <div className="h-5 w-48 animate-pulse rounded-md bg-zinc-800" />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Refresh SERP button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || state.status === "loading"}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? "Refreshing…" : "Refresh SERP"}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ---- Scrollable body ---- */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Loading state */}
          {state.status === "loading" && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-zinc-800/60"
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {state.status === "error" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm text-zinc-300">{state.message}</p>
              <button
                onClick={load}
                className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                Retry
              </button>
            </div>
          )}

          {/* Success state */}
          {state.status === "success" && (
            <>
              {/* Weak Signals */}
              {SIGNAL_META.some((s) => weakSignals[s.key] !== undefined) && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Opportunity Signals
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SIGNAL_META.map((signal) => {
                      const active = !!weakSignals[signal.key];
                      return (
                        <div
                          key={signal.key}
                          className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                            active
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : "border-zinc-800 bg-zinc-900/40 opacity-40"
                          }`}
                        >
                          <span className="mt-0.5 text-lg leading-none">
                            {signal.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-zinc-100">
                                {signal.label}
                              </p>
                              {active && (
                                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                                  +{signal.points} pts
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">
                              {signal.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SERP Results */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    SERP Results
                    {results.length > 0 && (
                      <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                        Top {results.length}
                      </span>
                    )}
                  </h3>
                  {state.snapshot?.fetch_time && (
                    <p className="text-[10px] text-zinc-600">
                      Snapshot:{" "}
                      {new Date(state.snapshot.fetch_time).toLocaleString()}
                    </p>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center">
                    <p className="text-sm text-zinc-400">
                      No SERP snapshot yet.
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Click &ldquo;Refresh SERP&rdquo; above to fetch results.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-2">
                    {results.map((result, index) => (
                      <li
                        key={index}
                        className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition hover:border-zinc-700"
                      >
                        {/* Position number */}
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-400">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* Title */}
                          <a
                            href={
                              result.url.startsWith("http")
                                ? result.url
                                : `https://www.google.com${result.url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-1 text-sm font-medium text-sky-400 hover:underline"
                          >
                            {result.title}
                          </a>

                          {/* Domain + date */}
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[11px] text-emerald-400">
                              {result.domain}
                            </span>
                            {result.published_at && (
                              <span className="text-[10px] text-zinc-600">
                                · {result.published_at}
                              </span>
                            )}
                          </div>

                          {/* Snippet */}
                          {result.snippet && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-400">
                              {result.snippet}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
