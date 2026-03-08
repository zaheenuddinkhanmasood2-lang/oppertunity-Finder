"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  keywordId: string;
};

export function FetchSerpButton({ keywordId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fetch-serp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keywordId }),
      });

      if (!res.ok) {
        setError("Failed to fetch SERP. Please try again.");
        return;
      }

      // On success, refresh the page so any weak_signals changes are visible
      router.refresh();
    } catch (err) {
      console.error("Error calling fetch-serp API", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
      >
        {loading ? "Fetching…" : "Fetch SERP"}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}


