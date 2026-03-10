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
        // Try to get the real error message from the API
        const json = await res.json().catch(() => null);
        const msg = json?.error ?? `Server error (${res.status})`;
        setError(msg);
        return;
      }

      // On success, refresh the page so any weak_signals changes are visible
      router.refresh();
    } catch (err) {
      console.error("Error calling fetch-serp API", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-outlined state-layer"
        style={{
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.1px'
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching…
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Fetch SERP
          </>
        )}
      </button>
      {error && (
        <div 
          className="flex items-center gap-2 p-2 rounded-lg max-w-xs"
          style={{
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)'
          }}
        >
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-label-small line-clamp-2">{error}</p>
        </div>
      )}
    </div>
  );
}


