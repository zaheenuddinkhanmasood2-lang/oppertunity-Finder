"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  nicheId: string;
};

export function GenerateKeywordsButton({ nicheId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nicheId }),
      });

      if (!res.ok) {
        setError("Failed to generate keywords. Please try again.");
        return;
      }

      // Optionally read { inserted } from the response
      // const { inserted } = await res.json();

      router.refresh();
    } catch (err) {
      console.error("Error calling generate-keywords API", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full border border-sky-500/70 bg-sky-500 px-4 py-1.5 text-xs font-medium text-sky-950 shadow-sm transition hover:border-sky-400 hover:bg-sky-400 disabled:cursor-not-allowed disabled:border-sky-700 disabled:bg-sky-700"
      >
        {loading ? "Generating keywords…" : "Generate Keywords"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

