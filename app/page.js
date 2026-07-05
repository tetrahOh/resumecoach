"use client";

import { useState } from "react";
import JobResumeForm from "@/components/JobResumeForm";
import PositioningSliders from "@/components/PositioningSliders";
import StrengthsChecklist from "@/components/StrengthsChecklist";
import PositioningReport from "@/components/PositioningReport";

const DEFAULT_WEIGHTS = {
  "Technical Skills": 50,
  Leadership: 50,
  Communication: 50,
  Achievements: 50,
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [recommendedWeights, setRecommendedWeights] = useState(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [strengths, setStrengths] = useState([]);

  const [report, setReport] = useState(null);
  const [finalResume, setFinalResume] = useState("");

  async function handleAnalyze({ jobDescription: jd, resume: cv }) {
    setLoading(true);
    setError(null);
    setJobDescription(jd);
    setResume(cv);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setRecommendedWeights(data.weights);
      setWeights(data.weights);
      setRecommendation(data.recommendation);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resume, weights, strengths }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setReport(data.report);
      setFinalResume(data.resume);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([finalResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-14 border-b border-line pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-brass mb-3">ResumeCoach</p>
        <h1 className="font-display text-4xl leading-tight text-ink max-w-2xl">
          Most resume tools ask what you've done. This one asks who you're trying to be.
        </h1>
      </header>

      {error && (
        <div className="mb-8 border border-rust/40 bg-rust/5 px-4 py-3 text-sm text-rust">
          {error}
        </div>
      )}

      {step === 1 && <JobResumeForm onAnalyze={handleAnalyze} isLoading={loading} />}

      {step === 2 && (
        <div className="space-y-12">
          <section>
            <p className="font-mono text-xs uppercase tracking-wide text-slate/70 mb-2">
              What this role values
            </p>
            <p className="text-ink/80 leading-relaxed max-w-2xl">{recommendation}</p>
          </section>

          <section>
            <p className="font-mono text-xs uppercase tracking-wide text-slate/70 mb-4">
              Adjust your positioning
            </p>
            <PositioningSliders weights={weights} onChange={setWeights} recommended={recommendedWeights} />
          </section>

          <section>
            <p className="font-mono text-xs uppercase tracking-wide text-slate/70 mb-4">
              How do you want to be remembered?
            </p>
            <StrengthsChecklist selected={strengths} onChange={setStrengths} />
          </section>

          <div className="flex justify-end border-t border-line pt-6">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-slate px-6 py-3 font-mono text-xs uppercase tracking-wide text-parchment transition hover:bg-ink disabled:opacity-40"
            >
              {loading ? "Writing your resume…" : "Generate positioned resume"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-10">
          <PositioningReport report={report} />

          <section>
            <p className="font-mono text-xs uppercase tracking-wide text-slate/70 mb-4">
              Your rewritten resume
            </p>
            <pre className="whitespace-pre-wrap border border-line bg-white/60 p-6 font-body text-sm leading-relaxed text-ink">
              {finalResume}
            </pre>
          </section>

          <div className="flex justify-between border-t border-line pt-6">
            <button
              onClick={() => setStep(2)}
              className="font-mono text-xs uppercase tracking-wide text-slate/70 underline underline-offset-4"
            >
              ← Back to positioning
            </button>
            <button
              onClick={handleDownload}
              className="bg-brass px-6 py-3 font-mono text-xs uppercase tracking-wide text-parchment transition hover:bg-ink"
            >
              Download as .txt
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
