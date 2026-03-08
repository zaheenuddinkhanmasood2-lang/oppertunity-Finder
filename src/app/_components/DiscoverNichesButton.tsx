"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DiscoverNichesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/discover-niches", {
        method: "POST",
      });

      if (!response.ok) {
        setError("Failed to discover niches. Please try again.");
      } else {
        // Optionally inspect { new } from the response
        // const { new: newCount } = await response.json();
        router.refresh();
      }
    } catch (err) {
      console.error("Error calling discover-niches API", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500 px-4 py-1.5 text-xs font-medium text-emerald-950 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:border-emerald-700 disabled:bg-emerald-700"
      >
        {loading ? "Discovering niches…" : "Discover niches"}
      </button>
      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

