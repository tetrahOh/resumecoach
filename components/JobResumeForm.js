"use client";

import { useState } from "react";

export default function JobResumeForm({ onAnalyze, isLoading }) {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!jobDescription.trim() || !resume.trim()) return;
    onAnalyze({ jobDescription, resume });
  }

  const canSubmit = jobDescription.trim().length > 20 && resume.trim().length > 20;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <div>
        <label htmlFor="job" className="block font-mono text-xs uppercase tracking-wide text-slate/70 mb-2">
          01 — Job description
        </label>
        <textarea
          id="job"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job posting here — the more detail, the sharper the read."
          rows={14}
          className="w-full resize-none rounded-none border border-line bg-white/60 p-4 font-body text-sm leading-relaxed text-ink placeholder:text-ink/40 focus:border-brass focus:bg-white"
        />
      </div>
      <div>
        <label htmlFor="resume" className="block font-mono text-xs uppercase tracking-wide text-slate/70 mb-2">
          02 — Your current resume
        </label>
        <textarea
          id="resume"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste your resume as plain text. Don't worry about formatting — we'll handle that later."
          rows={14}
          className="w-full resize-none rounded-none border border-line bg-white/60 p-4 font-body text-sm leading-relaxed text-ink placeholder:text-ink/40 focus:border-brass focus:bg-white"
        />
      </div>
      <div className="md:col-span-2 flex items-center justify-between border-t border-line pt-6">
        <p className="text-sm text-ink/60 max-w-md">
          Nothing is saved on our end until you choose to export. This first pass only figures out what the role actually values.
        </p>
        <button
          type="submit"
          disabled={!canSubmit || isLoading}
          className="shrink-0 bg-slate px-6 py-3 font-mono text-xs uppercase tracking-wide text-parchment transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Reading the role…" : "Analyse the role"}
        </button>
      </div>
    </form>
  );
}
