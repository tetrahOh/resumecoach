"use client";

export default function PositioningReport({ report }) {
  if (!report) return null;

  return (
    <div className="border border-line bg-white/60 p-6">
      <p className="font-mono text-xs uppercase tracking-wide text-slate/70 mb-4">
        Your resume strategy
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-ink/50 mb-1">Primary impression</p>
          <p className="font-display text-xl text-ink">{report.primary}</p>
        </div>
        <div>
          <p className="text-xs text-ink/50 mb-1">Secondary impression</p>
          <p className="font-display text-xl text-ink">{report.secondary}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-ink/50 mb-1">Supporting strengths</p>
          <ul className="text-sm text-moss">
            {report.supporting?.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs text-ink/50 mb-1">Reduced emphasis</p>
          <ul className="text-sm text-rust">
            {report.reduced?.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {report.rationale && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="text-xs text-ink/50 mb-1">Why</p>
          <p className="text-sm text-ink/80 leading-relaxed">{report.rationale}</p>
        </div>
      )}
    </div>
  );
}
