"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const fallbackPositionOptions = ["Technical expert", "Problem solver", "Results driven", "Trusted operator", "People leader", "Fast learner"];

function Logo() {
  return <button onClick={() => location.reload()} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#18201d] text-lg text-white shadow-lg shadow-emerald-950/10">R</span><span><strong className="block font-display text-lg leading-none">ResumeCoach</strong><small className="text-[11px] text-ink/45">Your story, positioned well.</small></span></button>;
}

function Pill({ children, active, onClick }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-[#1f6650] bg-[#1f6650] text-white shadow-md shadow-emerald-900/10" : "border-black/10 bg-white/70 text-ink/65 hover:-translate-y-0.5 hover:border-[#1f6650]/40 hover:bg-white"}`}>{children}</button>;
}

function Loading({ copy }) {
  return <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center"><div className="relative mb-8 h-20 w-20"><span className="absolute inset-0 animate-ping rounded-full bg-[#98bfae]/25"/><span className="absolute inset-2 animate-pulse rounded-full bg-[#1f6650]"/><span className="absolute inset-0 grid place-items-center text-2xl text-white">✦</span></div><h2 className="font-display text-3xl">{copy}</h2><p className="mt-3 text-sm leading-6 text-ink/50">Reading for evidence, patterns and the story a recruiter needs to understand.</p></div>;
}

export default function CoachExperience() {
  const [stage, setStage] = useState("input");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answer, setAnswer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [positioning, setPositioning] = useState("Problem solver");
  const [documents, setDocuments] = useState(null);
  const [tab, setTab] = useState("resume");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [extracting, setExtracting] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewEditing, setReviewEditing] = useState(false);
  const [reviewInstruction, setReviewInstruction] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    const draft = localStorage.getItem("resumecoach_draft");
    if (draft) { try { const parsed = JSON.parse(draft); setResume(parsed.resume || ""); setJobDescription(parsed.jobDescription || ""); } catch {} }
  }, []);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    createClient().auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (!data.user) return;
      const response = await fetch("/api/profiles");
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Your career profiles could not be loaded.");
      if (Array.isArray(result)) setProfiles(result);
    }).catch(e => setError(e.message));
  }, []);
  useEffect(() => { localStorage.setItem("resumecoach_draft", JSON.stringify({ resume, jobDescription })); }, [resume, jobDescription]);
  useEffect(() => {
    if (!extracting) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [extracting]);

  async function callCoach(action, payload) {
    const response = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The coach could not respond just now.");
    return data;
  }

  async function uploadFile(file, target) {
    if (!file) return;
    setError(""); setExtracting(target);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const response = await fetch("/api/extract", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({data:btoa(binary),mediaType:file.type,fileName:file.name}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "That file could not be read.");
      if (target === "resume") setResume(result.text); else setJobDescription(result.text);
    } catch (e) { setError(e.message); } finally { setExtracting(""); }
  }

  function chooseProfile(id) { const selected=profiles.find(p=>p.id===id);setActiveProfileId(id);if(selected)setResume(selected.resume_text||""); }
  async function createProfile() {
    setProfileError(""); setProfileSaving(true);
    try {
      const response=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:profileName,targetRole:profileRole,resume})});
      const result=await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(result.error || "That profile could not be created.");
      setProfiles(current=>[result,...current]);setActiveProfileId(result.id);setProfileOpen(false);setProfileName("");setProfileRole("");setProfileNotice("Career profile created.");
    } catch (e) { setProfileError(e.message); } finally { setProfileSaving(false); }
  }
  async function updateProfile() {
    const selected=profiles.find(p=>p.id===activeProfileId);if(!selected)return;
    setError("");setProfileNotice("");setProfileSaving(true);
    try {
      const response=await fetch("/api/profiles",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected.id,name:selected.name,targetRole:selected.target_role,resume})});
      const result=await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(result.error || "That profile could not be updated.");
      setProfiles(current=>current.map(p=>p.id===result.id?result:p));setProfileNotice("Career profile updated.");
    } catch (e) { setError(e.message); } finally { setProfileSaving(false); }
  }

  function saveBlob(blob, name) { const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  async function downloadWord() { const {Document,Packer,Paragraph,TextRun}=await import("docx");const paragraphs=documents.resume.split("\n").map((line,index)=>new Paragraph({children:[new TextRun({text:line,bold:index<2||/^[A-Z][A-Z ]+$/.test(line)})],spacing:{after:line?100:40}}));const blob=await Packer.toBlob(new Document({sections:[{properties:{},children:paragraphs}]}));saveBlob(blob,"ResumeCoach-resume.docx"); }
  async function downloadPdf() { const {jsPDF}=await import("jspdf");const pdf=new jsPDF({unit:"pt",format:"a4"});const lines=pdf.splitTextToSize(documents.resume,495);let y=55;for(const line of lines){if(y>790){pdf.addPage();y=55}pdf.text(line,50,y);y+=15}pdf.save("ResumeCoach-resume.pdf"); }

  async function begin() {
    setError("");setAnswers([]);setAnswer("");setQuestionIndex(0);setConsultationLoading(false);setStage("analysing");
    try {
      const data = await callCoach("analyse", { resume, jobDescription });
      setAnalysis(data); setPositioning(data.recommendedPositioning || "Problem solver");
      setStage(data.questions?.length ? "conversation" : "strategy");
    } catch (e) { setError(e.message); setStage("input"); }
  }

  async function submitAnswer() {
    if (!answer.trim()||consultationLoading) return;
    const next = [...answers, { question: analysis.questions[questionIndex], answer: answer.trim() }];
    setAnswers(next);setAnswer("");setConsultationLoading(true);setError("");
    try {
      const result=await callCoach("followUp",{resume,jobDescription,analysis,answers:next});
      if(result.complete||!result.nextQuestion?.trim()||next.length>=8)setStage("strategy");
      else { setAnalysis(current=>({...current,questions:[...current.questions,result.nextQuestion.trim()]}));setQuestionIndex(questionIndex+1); }
    } catch(e) { setError(e.message);setAnswer(next[next.length-1].answer);setAnswers(next.slice(0,-1)); }
    finally { setConsultationLoading(false); }
  }

  async function generate() {
    setError(""); setStage("generating");
    try {
      const data = await callCoach("generate", { resume, jobDescription, analysis, answers, positioning });
      setDocuments(data);setTab("resume");setReviewIndex(0);setReviewEditing(false);setReviewInstruction("");setReviewMessage("");setStage("result");localStorage.setItem("resumecoach_latest", JSON.stringify(data));
      try {
        const response=await fetch("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId:activeProfileId||null,resume,jobDescription,analysis,answers,positioning,documents:data})});
        const result=await response.json().catch(() => ({}));
        if(!response.ok) throw new Error(result.error || "The generated documents could not be saved.");
      } catch (saveError) { setError(`Your documents were generated, but could not be saved: ${saveError.message}`); }
    } catch (e) { setError(e.message); setStage("strategy"); }
  }

  function advanceReview() {
    const sections=documents?.reviewSections||[];
    setReviewMessage("");setReviewEditing(false);setReviewInstruction("");
    if(reviewIndex<sections.length-1)setReviewIndex(reviewIndex+1);
    else setReviewMessage("Review complete — your resume is ready to download or edit further.");
  }

  async function reviseReviewSection() {
    const section=documents?.reviewSections?.[reviewIndex];
    if(!section||!reviewInstruction.trim())return;
    setReviewSaving(true);setReviewMessage("");setError("");
    try {
      const revised=await callCoach("reviseSection",{resume:documents.resume,jobDescription,positioning,section,instruction:reviewInstruction});
      const reviewSections=documents.reviewSections.map((item,index)=>index===reviewIndex?{...item,content:revised.content,rationale:revised.rationale}:item);
      const updatedResume=documents.resume.includes(section.content)?documents.resume.replace(section.content,revised.content):documents.resume;
      const updated={...documents,resume:updatedResume,reviewSections};
      setDocuments(updated);localStorage.setItem("resumecoach_latest",JSON.stringify(updated));setReviewInstruction("");setReviewEditing(false);setReviewMessage("Section updated. Review the change, then continue when it feels right.");
    } catch(e) { setError(e.message); } finally { setReviewSaving(false); }
  }

  const canBegin = resume.trim().length > 80 && jobDescription.trim().length > 80;
  const priorityEntries = analysis ? Object.entries(analysis.priorities || {}).sort((a,b) => b[1] - a[1]).slice(0,5) : [];
  const positioningOptions = analysis?.positioningOptions?.length ? analysis.positioningOptions : fallbackPositionOptions.map(label=>({label,reason:"A credible way to frame the evidence in your experience.",evidence:[]}));
  const selectedPositioning = positioningOptions.find(option=>option.label===positioning) || positioningOptions[0];
  const reviewSections = documents?.reviewSections || [];
  const reviewSection = reviewSections[reviewIndex];

  return <main className="min-h-screen bg-[#f4f2eb] text-ink">
    <header className="sticky top-0 z-20 border-b border-black/[.06] bg-[#f4f2eb]/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Logo/><div className="flex items-center gap-3 text-xs text-ink/45"><span className="hidden sm:inline">{user?.email||"Private by default"}</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/><span>Claude-powered</span>{user&&<button onClick={async()=>{await createClient().auth.signOut();location.href="/login"}} className="ml-2 underline underline-offset-4">Sign out</button>}</div></div></header>

    {error && <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
    {profileNotice && <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-emerald-900/10 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{profileNotice}</div>}

    {extracting&&<div className="fixed inset-0 z-[100] grid cursor-wait place-items-center bg-[#18201d]/70 p-5 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="file-reading-title" aria-describedby="file-reading-description"><div className="w-full max-w-md rounded-[30px] bg-[#f4f2eb] p-8 text-center shadow-2xl"><div className="relative mx-auto mb-6 h-16 w-16"><span className="absolute inset-0 animate-ping rounded-full bg-[#98bfae]/30"/><span className="absolute inset-2 animate-pulse rounded-full bg-[#1f6650]"/><span className="absolute inset-0 grid place-items-center text-xl text-white">✦</span></div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">File received</p><h2 id="file-reading-title" className="mt-2 font-display text-3xl">Claude is reading your {extracting==="resume"?"resume":"job description"}…</h2><p id="file-reading-description" className="mt-3 text-sm leading-6 text-ink/55">Extracting the text and checking the document. This usually takes a few moments.</p><div className="mt-7 h-2 overflow-hidden rounded-full bg-black/10" aria-label="Reading in progress"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#1f6650]"/></div><p className="mt-4 text-xs text-ink/40">Please keep this window open. You can continue when reading is complete.</p></div></div>}

    {profileOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-[#18201d]/35 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] bg-[#f4f2eb] p-7 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">New career profile</p><h2 className="mt-2 font-display text-3xl">Save this career direction.</h2><p className="mt-2 text-sm leading-6 text-ink/50">Keep separate source resumes for different roles without mixing their stories.</p><label className="mt-6 block text-xs text-ink/50">Profile name<input autoFocus disabled={profileSaving} value={profileName} onChange={e=>setProfileName(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650] disabled:opacity-50" placeholder="e.g. Cyber Security"/></label><label className="mt-4 block text-xs text-ink/50">Target role<input disabled={profileSaving} value={profileRole} onChange={e=>setProfileRole(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650] disabled:opacity-50" placeholder="e.g. GRC Analyst"/></label>{profileError&&<p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{profileError}</p>}<div className="mt-6 flex justify-end gap-2"><button disabled={profileSaving} onClick={()=>setProfileOpen(false)} className="rounded-full px-5 py-3 text-sm text-ink/50 disabled:opacity-40">Cancel</button><button disabled={!profileName.trim()||profileSaving} onClick={createProfile} className="rounded-full bg-[#1f6650] px-5 py-3 text-sm font-semibold text-white disabled:opacity-30">{profileSaving?"Creating…":"Create profile"}</button></div></div></div>}

    {stage === "input" && <div className="mx-auto max-w-6xl px-5 py-12 md:py-20">
      <div className="mb-12 max-w-3xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1f6650]/15 bg-[#dfece6] px-3 py-1.5 text-xs font-medium text-[#1f6650]">✦ A resume coach, not a template builder</span><h1 className="font-display text-5xl leading-[1.02] tracking-[-.035em] md:text-7xl">Bring the experience.<br/><em className="font-normal text-[#1f6650]">We’ll find the story.</em></h1><p className="mt-6 max-w-xl text-base leading-7 text-ink/55">Two things in. A clear strategy, stronger resume and tailored cover letter out. No twelve-step form. No buzzword bingo.</p></div>
      {user&&<div className="mb-5 flex flex-col justify-between gap-3 rounded-[22px] border border-black/[.07] bg-white/50 p-4 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#1f6650]">Career profile</p><p className="mt-1 text-sm text-ink/45">Switch career directions without repasting your resume.</p></div><div className="flex flex-wrap gap-2"><select disabled={profileSaving} value={activeProfileId} onChange={e=>chooseProfile(e.target.value)} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm disabled:opacity-50"><option value="">Unsaved profile</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}{p.target_role?` · ${p.target_role}`:""}</option>)}</select>{activeProfileId&&<button disabled={profileSaving} onClick={updateProfile} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-40">{profileSaving?"Updating…":"Update profile"}</button>}<button onClick={()=>{setProfileError("");setProfileNotice("");setProfileOpen(true)}} className="rounded-full bg-[#18201d] px-4 py-2.5 text-xs font-semibold text-white">+ New profile</button></div></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="group rounded-[28px] border border-black/[.07] bg-white/65 p-5 shadow-sm transition focus-within:-translate-y-1 focus-within:border-[#1f6650]/30 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-emerald-950/5"><span className="mb-3 flex items-center justify-between"><strong className="font-display text-xl">Your current resume</strong><small className="text-ink/35">Paste or upload</small></span><textarea value={resume} onChange={e=>setResume(e.target.value)} rows="13" className="w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-ink/25" placeholder="Paste your resume here. Don’t clean it up first—we need to see the real starting point."/><label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/15 px-4 py-3 text-xs text-ink/45 transition hover:border-[#1f6650] hover:text-[#1f6650]"><span>{extracting==="resume"?"Claude is reading your file…":"Upload PDF or image"}</span><span>↑</span><input disabled={!!extracting} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>uploadFile(e.target.files?.[0],"resume")}/></label></div>
        <div className="group rounded-[28px] border border-black/[.07] bg-[#18201d] p-5 text-white shadow-sm transition focus-within:-translate-y-1 focus-within:shadow-xl focus-within:shadow-emerald-950/15"><span className="mb-3 flex items-center justify-between"><strong className="font-display text-xl">The role you want</strong><small className="text-white/35">Paste or upload</small></span><textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value)} rows="13" className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/25" placeholder="Paste the job description. We’ll decode what the employer really values."/><label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/15 px-4 py-3 text-xs text-white/45 transition hover:border-[#98bfae] hover:text-[#98bfae]"><span>{extracting==="job"?"Claude is reading your file…":"Upload PDF or image"}</span><span>↑</span><input disabled={!!extracting} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>uploadFile(e.target.files?.[0],"job")}/></label></div>
      </div>
      <div className="mt-7 flex flex-col items-center justify-between gap-4 sm:flex-row"><p className="text-xs text-ink/40">Your draft stays in this browser. Generated content is grounded in what you provide.</p><button disabled={!canBegin} onClick={begin} className="group rounded-full bg-[#1f6650] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-900/15 transition hover:-translate-y-1 hover:bg-[#174f3f] disabled:translate-y-0 disabled:opacity-30">Find my strongest angle <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span></button></div>
    </div>}

    {stage === "analysing" && <Loading copy="Finding the signal in your experience…"/>}

    {stage === "conversation" && analysis && <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-ink/40">Adaptive evidence check · Question {answers.length+1}</span><span className="text-xs text-[#1f6650]">Claude stops as soon as it has enough evidence</span></div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#1f6650]"/></div>
      <section key={questionIndex} className="rounded-[30px] border border-black/[.07] bg-white/80 p-5 shadow-xl shadow-black/[.03] md:p-7">
        <div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#18201d] text-white">R</span><div className="min-w-0 flex-1"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1f6650]">ResumeCoach</p><h2 className="min-h-[84px] font-display text-3xl leading-tight">{analysis.questions[questionIndex]}</h2><p className="mt-3 text-sm leading-6 text-ink/45">Answer naturally. A sentence or two is enough—I’m looking for evidence, not polished copy.</p></div></div>
        <div className="mt-6 rounded-[22px] border border-black/[.08] bg-[#f4f2eb]/70 p-3 focus-within:border-[#1f6650]/40 focus-within:bg-white"><textarea key={`answer-${questionIndex}`} autoFocus disabled={consultationLoading} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitAnswer()}}} rows="3" className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none disabled:opacity-50" placeholder="Type your answer…"/><div className="flex items-center justify-between gap-3"><span className="text-[11px] text-ink/30">{consultationLoading?"Claude is checking whether another question is needed…":"Enter to continue · Shift + Enter for a new line"}</span><button onClick={submitAnswer} disabled={!answer.trim()||consultationLoading} className="shrink-0 rounded-full bg-[#1f6650] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#174f3f] disabled:opacity-30">{consultationLoading?"Reviewing…":"Continue →"}</button></div></div>
      </section>
      {answers.length>0&&<p className="mt-4 text-center text-xs text-[#1f6650]">✓ {answers.length} {answers.length===1?"insight":"insights"} captured</p>}
    </div>}

    {stage === "strategy" && analysis && <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]"><section><span className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">Your strongest positioning options</span><h1 className="mt-3 font-display text-5xl leading-tight">Choose how your story should lead.</h1><p className="mt-4 max-w-xl text-base leading-7 text-ink/50">Claude created these focus areas from your experience, evidence, follow-up answers and the role’s priorities. Choose the one you want recruiters to remember—or use the recommended focus.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{positioningOptions.map(option=><button type="button" key={option.label} onClick={()=>setPositioning(option.label)} className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 ${positioning===option.label?"border-[#1f6650] bg-[#dfece6] shadow-md shadow-emerald-900/5":"border-black/[.08] bg-white/70 hover:border-[#1f6650]/30"}`}><span className="flex items-start justify-between gap-2"><strong className="font-display text-xl">{option.label}</strong>{option.label===analysis.recommendedPositioning&&<small className="rounded-full bg-[#1f6650] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">Recommended</small>}</span><span className="mt-2 block text-xs leading-5 text-ink/50">{option.reason}</span></button>)}</div>{selectedPositioning&&<div className="mt-5 rounded-[22px] border border-[#1f6650]/10 bg-white/60 p-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#1f6650]">Why “{selectedPositioning.label}” fits</p><p className="mt-2 text-sm leading-6 text-ink/60">{selectedPositioning.reason}</p>{selectedPositioning.evidence?.length>0&&<div className="mt-3 flex flex-wrap gap-2">{selectedPositioning.evidence.map(item=><span key={item} className="rounded-full bg-[#dfece6] px-3 py-1.5 text-xs text-[#1f6650]">{item}</span>)}</div>}</div>}<div className="mt-8 rounded-[28px] bg-[#18201d] p-7 text-white shadow-2xl shadow-emerald-950/10"><p className="text-xs uppercase tracking-widest text-[#98bfae]">Your chosen lead</p><h2 className="mt-2 font-display text-4xl">{positioning}</h2><p className="mt-4 text-sm leading-6 text-white/55">{positioning===analysis.recommendedPositioning?analysis.strategyReason:`You chose ${positioning.toLowerCase()} as the main impression. The resume will prioritise evidence that supports this focus while staying truthful to your experience.`}</p>{positioning!==analysis.recommendedPositioning&&<button onClick={()=>setPositioning(analysis.recommendedPositioning)} className="mt-5 text-xs text-[#98bfae] underline underline-offset-4">Use ResumeCoach’s recommendation: {analysis.recommendedPositioning}</button>}<button onClick={generate} className="mt-7 block rounded-full bg-[#e5bc78] px-6 py-3.5 text-sm font-semibold text-[#18201d] transition hover:-translate-y-1">Write my application →</button></div></section>
      <aside className="space-y-4"><div className="rounded-[28px] border border-black/[.07] bg-white/65 p-6"><p className="text-xs uppercase tracking-widest text-ink/35">What the employer cares about</p><div className="mt-5 space-y-4">{priorityEntries.map(([key,value])=><div key={key}><div className="mb-1.5 flex justify-between text-sm"><span>{key}</span><strong>{value}%</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full rounded-full bg-[#1f6650]" style={{width:`${value}%`}}/></div></div>)}</div></div><div className="rounded-[28px] border border-black/[.07] bg-[#dfece6] p-6"><p className="text-xs uppercase tracking-widest text-[#1f6650]">Evidence already found</p><div className="mt-4 flex flex-wrap gap-2">{(analysis.evidence || []).map(x=><span key={x} className="rounded-full bg-white/70 px-3 py-1.5 text-xs">{x}</span>)}</div></div></aside></div>
    </div>}

    {stage === "generating" && <Loading copy="Writing it like a human who knows your value…"/>}

    {stage === "result" && documents && <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><span className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">Your application is ready</span><h1 className="mt-2 font-display text-5xl">Strong, specific, still you.</h1></div><button onClick={()=>{setStage("input");setDocuments(null)}} className="text-sm text-ink/45 underline underline-offset-4">Start another role</button></div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{[["resume","Resume"],["coverLetter","Cover letter"],["coachAdvice","Coach advice"]].map(([k,l])=><Pill key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</Pill>)}</div>
      {tab!=="coachAdvice"&&<div className="grid gap-5 lg:grid-cols-[1fr_260px]"><section className="rounded-[28px] border border-black/[.07] bg-white p-6 shadow-xl shadow-black/[.03] md:p-9"><textarea value={documents[tab]} onChange={e=>setDocuments({...documents,[tab]:e.target.value})} className="min-h-[650px] w-full resize-none bg-transparent font-body text-sm leading-7 outline-none"/></section><aside className="space-y-3"><div className="rounded-[24px] bg-[#18201d] p-5 text-white"><p className="text-xs uppercase tracking-widest text-[#98bfae]">Why it works</p><p className="mt-3 text-sm leading-6 text-white/60">The writing leads with {positioning.toLowerCase()}, mirrors the role’s language and keeps every claim grounded in your evidence.</p></div><button onClick={()=>navigator.clipboard.writeText(documents[tab])} className="w-full rounded-full border border-black/10 bg-white py-3 text-sm font-semibold transition hover:border-[#1f6650]">Copy to clipboard</button>{tab==="resume"&&<><button onClick={downloadWord} className="w-full rounded-full border border-[#1f6650] bg-white py-3 text-sm font-semibold text-[#1f6650]">Download Word</button><button onClick={downloadPdf} className="w-full rounded-full bg-[#1f6650] py-3 text-sm font-semibold text-white">Download PDF</button></>}<button onClick={()=>saveBlob(new Blob([documents[tab]],{type:"text/plain"}),`resumecoach-${tab}.txt`)} className="w-full py-2 text-xs text-ink/40 underline underline-offset-4">Download plain text</button></aside></div>}
      {tab==="coachAdvice"&&<div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="rounded-[28px] border border-black/[.07] bg-white p-6 shadow-xl shadow-black/[.03] md:p-9">
          {reviewSection?<><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[.16em] text-[#1f6650]">Section {reviewIndex+1} of {reviewSections.length}</span><span className="text-xs text-ink/35">{Math.round(((reviewIndex+1)/reviewSections.length)*100)}% reviewed</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full rounded-full bg-[#1f6650] transition-all duration-500" style={{width:`${((reviewIndex+1)/reviewSections.length)*100}%`}}/></div><h2 className="mt-7 font-display text-4xl">{reviewSection.title}</h2><div className="mt-5 rounded-[22px] bg-[#dfece6] p-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#1f6650]">Why I wrote it this way</p><p className="mt-3 text-sm leading-7 text-ink/70">{reviewSection.rationale}</p></div><div className="mt-5 rounded-[22px] border border-black/[.07] bg-[#f4f2eb]/60 p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/35">Resume section</p><pre className="whitespace-pre-wrap font-body text-sm leading-7 text-ink/75">{reviewSection.content}</pre></div>{reviewMessage&&<p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{reviewMessage}</p>}{reviewEditing?<div className="mt-5 rounded-[22px] border border-[#1f6650]/20 bg-white p-4"><label className="text-xs font-semibold text-[#1f6650]">What would you like changed?</label><textarea autoFocus value={reviewInstruction} onChange={e=>setReviewInstruction(e.target.value)} rows="4" className="mt-2 w-full resize-none rounded-2xl bg-[#f4f2eb] p-3 text-sm leading-6 outline-none" placeholder="e.g. Make this warmer, lead with leadership, shorten it, or emphasise a specific achievement…"/><div className="mt-3 flex justify-end gap-2"><button disabled={reviewSaving} onClick={()=>{setReviewEditing(false);setReviewInstruction("")}} className="rounded-full px-4 py-2 text-xs text-ink/45">Cancel</button><button disabled={!reviewInstruction.trim()||reviewSaving} onClick={reviseReviewSection} className="rounded-full bg-[#1f6650] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-30">{reviewSaving?"Rewriting this section…":"Update this section"}</button></div></div>:<div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={advanceReview} className="flex-1 rounded-full bg-[#1f6650] px-5 py-3 text-sm font-semibold text-white">{reviewIndex===reviewSections.length-1?"Looks good — finish review":"Looks good — next section →"}</button><button onClick={()=>{setReviewEditing(true);setReviewMessage("")}} className="flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink/65">I’d like a change</button></div>}</>:<div><h2 className="font-display text-3xl">Overall coach advice</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink/65">{documents.writersNotes}</p></div>}
        </section>
        <aside className="space-y-3"><div className="rounded-[24px] bg-[#18201d] p-5 text-white"><p className="text-xs uppercase tracking-widest text-[#98bfae]">Your review</p><p className="mt-3 text-sm leading-6 text-white/60">Work through one section at a time. Accept the coaching decision or ask for a precise change without rewriting the rest of your resume.</p></div>{reviewIndex>0&&<button onClick={()=>{setReviewIndex(reviewIndex-1);setReviewEditing(false);setReviewMessage("")}} className="w-full rounded-full border border-black/10 bg-white py-3 text-sm font-semibold">← Previous section</button>}<div className="rounded-[24px] border border-black/[.07] bg-white/60 p-5"><p className="text-xs uppercase tracking-widest text-ink/35">Overall advice</p><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-ink/55">{documents.writersNotes}</p></div></aside>
      </div>}
    </div>}
  </main>;
}
