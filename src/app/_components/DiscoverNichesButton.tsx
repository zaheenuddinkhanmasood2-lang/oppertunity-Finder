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
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-filled state-layer"
        style={{
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.1px'
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Discovering niches…
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Discover Niches
          </>
        )}
      </button>
      {error && (
        <div 
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)'
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-body-small">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

