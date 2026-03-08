export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        <span>Loading opportunities…</span>
      </div>
    </div>
  );
}

