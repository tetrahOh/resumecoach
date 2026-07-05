"use client";

const OPTIONS = [
  "Highly technical",
  "Great communicator",
  "Strong leader",
  "Fast learner",
  "Reliable",
  "Organised",
  "Customer focused",
  "Strategic thinker",
  "Innovative",
  "Problem solver",
  "Adaptable",
  "Detail oriented",
  "Commercially minded",
  "Collaborative",
];

export default function StrengthsChecklist({ selected, onChange }) {
  function toggle(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else if (selected.length < 4) {
      onChange([...selected, option]);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink/60 mb-4">
        Pick up to four. This is what you want a recruiter thinking within the first ten seconds.
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={!active && selected.length >= 4}
              className={`border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-slate bg-slate text-parchment"
                  : "border-line bg-white/50 text-ink/80 hover:border-slate/50"
              } disabled:cursor-not-allowed disabled:opacity-30`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
