"use client";

const TRADEOFFS = {
  "Technical Skills": {
    gain: ["More technical terminology", "More project detail", "More certifications"],
    cost: "Less room for interpersonal framing",
  },
  Leadership: {
    gain: ["More mentoring examples", "More ownership language", "More strategic wording"],
    cost: "Less technical depth",
  },
  Communication: {
    gain: ["More collaboration examples", "More stakeholder outcomes", "Clearer narrative arc"],
    cost: "Less dense technical content",
  },
  Achievements: {
    gain: ["More measurable outcomes", "More numbers, less description"],
    cost: "Less context on how the work was done",
  },
};

export default function PositioningSliders({ weights, onChange, recommended }) {
  function handleSlide(key, value) {
    onChange({ ...weights, [key]: Number(value) });
  }

  return (
    <div className="space-y-8">
      {Object.entries(weights).map(([key, value]) => {
        const info = TRADEOFFS[key];
        return (
          <div key={key}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-display text-lg text-ink">{key}</span>
              <span className="font-mono text-sm text-brass">{value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => handleSlide(key, e.target.value)}
              className="w-full accent-brass"
            />
            {info && (
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                {info.gain.map((g) => (
                  <span key={g} className="text-moss">
                    + {g}
                  </span>
                ))}
                <span className="text-rust">− {info.cost}</span>
              </div>
            )}
            {recommended && recommended[key] !== undefined && recommended[key] !== value && (
              <button
                type="button"
                onClick={() => handleSlide(key, recommended[key])}
                className="mt-1 font-mono text-[11px] uppercase tracking-wide text-slate/60 underline decoration-line underline-offset-4 hover:text-slate"
              >
                Reset to recommended ({recommended[key]}%)
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
