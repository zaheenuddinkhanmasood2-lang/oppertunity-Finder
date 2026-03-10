import Link from "next/link";
import { createServerComponentClient } from "../lib/supabaseServer";
import { DiscoverNichesButton } from "./_components/DiscoverNichesButton";

type Niche = {
  id: string;
  name: string;
  trend_score: number | null;
  source: string | null;
  created_at: string;
};

export default async function Home() {
  const supabase = createServerComponentClient();

  const { data: niches, error } = await supabase
    .from("niches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // In a real app you might log this somewhere central
    console.error("Error loading niches", error);
  }

  const items: Niche[] = niches ?? [];

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-headline-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Niches
          </h2>
          <p className="text-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            High-level spaces where weak signals and opportunities emerge. Discover untapped potential in emerging markets.
          </p>
        </div>
        <DiscoverNichesButton />
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center" 
             style={{
               background: 'var(--md-sys-color-surface-container)',
               borderColor: 'var(--md-sys-color-outline)',
               color: 'var(--md-sys-color-on-surface-variant)'
             }}>
          <div className="max-w-md space-y-4">
            <div 
              className="flex items-center justify-center mx-auto"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                background: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface-variant)'
              }}
            >
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-title-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                No niches yet
              </p>
              <p className="text-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Once you start ingesting signals or adding research, new niches will show up here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((niche, index) => (
            <article
              key={niche.id}
              className="card-elevated"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="space-y-4">
                {/* Header with icon */}
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center justify-center icon-hover"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--md-sys-color-primary-container)',
                      color: 'var(--md-sys-color-on-primary-container)'
                    }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                  </div>
                  <div 
                    className="chip"
                    style={{
                      background: 'var(--md-sys-color-tertiary-container)',
                      color: 'var(--md-sys-color-on-tertiary-container)',
                      border: 'none'
                    }}
                  >
                    <div 
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'currentColor'
                      }}
                    ></div>
                    <span className="text-label-small">Active</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 
                    className="title-medium line-clamp-2"
                    style={{ 
                      color: 'var(--md-sys-color-on-surface)',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {niche.name}
                  </h3>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className="card"
                      style={{
                        background: 'var(--md-sys-color-surface-container-high)',
                        padding: '12px'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg 
                          className="w-4 h-4" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: 'var(--md-sys-color-primary)' }}
                        >
                          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                        <span className="text-label-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Trend Score
                        </span>
                      </div>
                      <p 
                        className="title-large"
                        style={{ color: 'var(--md-sys-color-primary)' }}
                      >
                        {typeof niche.trend_score === "number"
                          ? niche.trend_score.toFixed(2)
                          : "—"}
                      </p>
                    </div>
                    
                    <div 
                      className="card"
                      style={{
                        background: 'var(--md-sys-color-surface-container-high)',
                        padding: '12px'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg 
                          className="w-4 h-4" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: 'var(--md-sys-color-secondary)' }}
                        >
                          <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                        </svg>
                        <span className="text-label-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Keywords
                        </span>
                      </div>
                      <p 
                        className="title-large"
                        style={{ color: 'var(--md-sys-color-secondary)' }}
                      >
                        0
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div 
                className="flex items-center justify-between pt-4"
                style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center justify-center"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'var(--md-sys-color-tertiary-container)',
                      color: 'var(--md-sys-color-on-tertiary-container)'
                    }}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <p className="text-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {niche.source ?? "Unlabeled source"}
                  </p>
                </div>
                
                <Link
                  href={`/niches/${niche.id}`}
                  className="btn-filled state-layer"
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.1px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Explore
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
