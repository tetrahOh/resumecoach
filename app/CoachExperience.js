"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseResumeText, findTemplate, RESUME_TEMPLATES } from "@/lib/resume-templates";
import ResumeTemplatePreview from "@/components/ResumeTemplatePreview";

const fallbackPositionOptions = ["Technical expert", "Problem solver", "Results driven", "Trusted operator", "People leader", "Fast learner"];

function Logo() {
  return <button onClick={() => location.reload()} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#18201d] text-lg text-white shadow-lg shadow-emerald-950/10">R</span><span><strong className="block font-display text-lg leading-none">ResumeCoach</strong><small className="text-[11px] text-ink/45">Your story, positioned well.</small></span></button>;
}

function Pill({ children, active, onClick }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-[#1f6650] bg-[#1f6650] text-white shadow-md shadow-emerald-900/10" : "border-black/10 bg-white/70 text-ink/65 hover:-translate-y-0.5 hover:border-[#1f6650]/40 hover:bg-white"}`}>{children}</button>;
}

function percentClamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function ScoreBars({ title, entries, tone = "green", selected }) {
  const fill = tone === "gold" ? "bg-[#c9963e]" : "bg-[#1f6650]";
  return <div className="rounded-[24px] border border-black/[.07] bg-white/65 p-5">
    <p className="text-xs uppercase tracking-widest text-ink/35">{title}</p>
    <div className="mt-4 space-y-3">{entries.map(([key,value]) => {
      const score = percentClamp(value);
      const active = selected && key === selected;
      return <div key={key} className={active ? "-m-2 rounded-2xl bg-[#f4f2eb] p-2" : ""}>
        <div className="mb-1 flex justify-between text-xs"><span className={active ? "font-semibold text-[#1f6650]" : ""}>{key}</span><strong>{score}%</strong></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/[.06]"><div className={`h-full rounded-full ${fill}`} style={{width:`${score}%`}}/></div>
      </div>;
    })}</div>
  </div>;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [managedProfileId, setManagedProfileId] = useState("");
  const [managedProfileName, setManagedProfileName] = useState("");
  const [managedProfileRole, setManagedProfileRole] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewEditing, setReviewEditing] = useState(false);
  const [reviewInstruction, setReviewInstruction] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewStatuses, setReviewStatuses] = useState({});
  const [recommendationChoices, setRecommendationChoices] = useState({});
  const [listeningField, setListeningField] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({ fullName:"", phone:"" });
  const [profileHistory, setProfileHistory] = useState([]);
  const [resumeView, setResumeView] = useState("edit");

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
      const accountResponse = await fetch("/api/account");
      const account = await accountResponse.json().catch(() => ({}));
      if (accountResponse.ok) setPersonalDetails({ fullName:account.full_name||"", phone:account.phone||"" });
    }).catch(e => setError(e.message));
  }, []);
  useEffect(() => { localStorage.setItem("resumecoach_draft", JSON.stringify({ resume, jobDescription })); }, [resume, jobDescription]);
  useEffect(() => {
    if (!activeProfileId) return;
    const timer=setTimeout(async()=>{
      const savedStage=["analysing","generating"].includes(stage)?"input":stage;
      const workspaceData={analysis,answers,questionIndex,positioning,documents,recommendationChoices,reviewStatuses,stage:savedStage};
      try {
        const response=await fetch("/api/profiles",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:activeProfileId,resume,jobDescription,workspaceData})});
        const result=await response.json().catch(()=>({}));
        if(response.ok)setProfiles(current=>current.map(profile=>profile.id===result.id?result:profile));
      } catch {}
    },900);
    return()=>clearTimeout(timer);
  },[activeProfileId,resume,jobDescription,analysis,answers,questionIndex,positioning,documents,recommendationChoices,reviewStatuses,stage]);
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

  function startVoiceInput(field, setValue) {
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){setError("Voice input isn’t supported by this browser. You can still type your response.");return}
    const recognition=new Recognition();
    recognition.lang="en-AU";recognition.interimResults=false;recognition.continuous=false;
    recognition.onstart=()=>{setError("");setListeningField(field)};
    recognition.onresult=event=>{const transcript=event.results?.[0]?.[0]?.transcript?.trim();if(transcript)setValue(current=>`${current}${current.trim()?" ":""}${transcript}`)};
    recognition.onerror=()=>setError("Voice input stopped before a response was captured. Please try again or type your response.");
    recognition.onend=()=>setListeningField("");
    recognition.start();
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

  function profileWorkspaceData() {
    const savedStage=["analysing","generating"].includes(stage)?"input":stage;
    return {analysis,answers,questionIndex,positioning,documents,recommendationChoices,reviewStatuses,stage:savedStage};
  }

  async function persistActiveProfile() {
    if(!activeProfileId)return;
    const response=await fetch("/api/profiles",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:activeProfileId,resume,jobDescription,workspaceData:profileWorkspaceData()})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||"Your profile session could not be saved.");
    setProfiles(current=>current.map(profile=>profile.id===result.id?result:profile));
    return result;
  }

  async function loadProfileHistory(profileId) {
    if(!profileId){setProfileHistory([]);return}
    const response=await fetch(`/api/documents?profileId=${encodeURIComponent(profileId)}`);
    const result=await response.json().catch(()=>[]);
    if(response.ok)setProfileHistory(Array.isArray(result)?result:[]);
  }

  function openHistoryItem(item) {
    const saved=item.documents&&Object.keys(item.documents).length?item.documents:{resume:item.generated_resume||"",coverLetter:item.cover_letter||"",writersNotes:item.writers_notes||"",reviewSections:[]};
    setDocuments(saved);setAnalysis(item.analysis||null);setAnswers(item.follow_up_answers||[]);setPositioning(item.positioning||"Problem solver");setTab("resume");setStage("result");setMenuOpen(false);
  }

  async function chooseProfile(id) {
    if(id===activeProfileId)return;
    setProfileSaving(true);setError("");setProfileNotice("");
    let freshProfiles=profiles;
    try {
      await persistActiveProfile();
      const response=await fetch("/api/profiles");
      const result=await response.json().catch(()=>[]);
      if(!response.ok)throw new Error(result.error||"Your profiles could not be loaded.");
      freshProfiles=Array.isArray(result)?result:[];
      setProfiles(freshProfiles);
    } catch(e) { setError(e.message);setProfileSaving(false); return; }
    const selected=freshProfiles.find(p=>p.id===id);
    const workspace=selected?.workspace_data||{};
    setActiveProfileId(id);setResume(selected?.resume_text||"");setJobDescription(selected?.job_description||"");setAnalysis(workspace.analysis||null);setAnswers(workspace.answers||[]);setAnswer("");setQuestionIndex(workspace.questionIndex||0);setPositioning(workspace.positioning||"Problem solver");setDocuments(workspace.documents||null);setRecommendationChoices(workspace.recommendationChoices||{});setReviewStatuses(workspace.reviewStatuses||{});setStage(workspace.stage||"input");
    try { await loadProfileHistory(id); } finally { setProfileSaving(false); }
  }
  async function createProfile() {
    if(profiles.length>=3){setProfileError("You can create up to three career profiles.");return}
    setProfileError(""); setProfileSaving(true);
    try {
      const response=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:profileName,targetRole:profileRole,resume,jobDescription,workspaceData:{}})});
      const result=await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(result.error || "That profile could not be created.");
      setProfiles(current=>[result,...current]);setActiveProfileId(result.id);setProfileOpen(false);setProfileName("");setProfileRole("");setProfileNotice("Career profile created.");
    } catch (e) { setProfileError(e.message); } finally { setProfileSaving(false); }
  }
  async function updateProfile() {
    const selected=profiles.find(p=>p.id===activeProfileId);if(!selected)return;
    setError("");setProfileNotice("");setProfileSaving(true);
    try {
      const response=await fetch("/api/profiles",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected.id,name:selected.name,targetRole:selected.target_role,resume,jobDescription})});
      const result=await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(result.error || "That profile could not be updated.");
      setProfiles(current=>current.map(p=>p.id===result.id?result:p));setProfileNotice("Career profile updated.");
    } catch (e) { setError(e.message); } finally { setProfileSaving(false); }
  }

  function editManagedProfile(id) {
    const selected=profiles.find(profile=>profile.id===id);
    setManagedProfileId(id);setManagedProfileName(selected?.name||"");setManagedProfileRole(selected?.target_role||"");setProfileError("");
    loadProfileHistory(id);
  }

  function openProfileManager() {
    const id=activeProfileId||profiles[0]?.id||"";
    editManagedProfile(id);setMenuOpen(true);setProfileNotice("");
  }

  async function useManagedProfile() {
    await chooseProfile(managedProfileId);setMenuOpen(false);
  }

  async function saveManagedProfile() {
    const selected=profiles.find(profile=>profile.id===managedProfileId);
    if(!selected||!managedProfileName.trim())return;
    setProfileSaving(true);setProfileError("");
    try {
      const response=await fetch("/api/profiles",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected.id,name:managedProfileName.trim(),targetRole:managedProfileRole.trim()})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"Your profile details could not be updated.");
      setProfiles(current=>current.map(profile=>profile.id===result.id?result:profile));setProfileNotice("Profile details updated.");
    } catch(e) { setProfileError(e.message); } finally { setProfileSaving(false); }
  }

  async function savePersonalDetails() {
    setAccountSaving(true);setProfileError("");setProfileNotice("");
    try {
      const response=await fetch("/api/account",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(personalDetails)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"Your personal details could not be saved.");
      setPersonalDetails({fullName:result.full_name||"",phone:result.phone||""});
      setProfileNotice("Personal details saved and ready for future applications.");setAccountOpen(false);
    } catch(e) { setProfileError(e.message); } finally { setAccountSaving(false); }
  }

  function saveBlob(blob, name) { const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); }

  async function downloadWord() {
    const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");
    const template = findTemplate(documents.template);
    const { name, tagline, sections } = parseResumeText(documents.resume);
    const align = template.docx.align === "CENTER" ? AlignmentType.CENTER : AlignmentType.LEFT;
    const children = [new Paragraph({ alignment: align, spacing: { after: 60 }, children: [new TextRun({ text: name, bold: true, size: 32, font: template.docx.font, color: template.docx.nameColor })] })];
    if (tagline) children.push(new Paragraph({ alignment: align, spacing: { after: 220 }, children: [new TextRun({ text: tagline, size: 22, font: template.docx.font, color: template.docx.headingColor })] }));
    for (const section of sections) {
      if (section.title) children.push(new Paragraph({ spacing: { before: 220, after: 90 }, children: [new TextRun({ text: section.title, bold: true, size: 20, font: template.docx.font, color: template.docx.headingColor })] }));
      for (const line of section.lines) {
        children.push(line
          ? new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: line, size: 20, font: template.docx.font })] })
          : new Paragraph({ text: "", spacing: { after: 40 } }));
      }
    }
    const blob = await Packer.toBlob(new Document({ sections: [{ properties: {}, children }] }));
    saveBlob(blob, "ResumeCoach-resume.docx");
  }

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const template = findTemplate(documents.template);
    const t = template.pdf;
    const { name, tagline, sections } = parseResumeText(documents.resume);
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 50, pageWidth = 495, centerX = marginX + pageWidth / 2;
    let y = 60;
    pdf.setFont(t.font, "bold"); pdf.setFontSize(20); pdf.setTextColor(...t.nameColor);
    pdf.text(name, t.align === "center" ? centerX : marginX, y, t.align === "center" ? { align: "center" } : undefined);
    y += 20;
    if (tagline) {
      pdf.setFont(t.font, "normal"); pdf.setFontSize(11); pdf.setTextColor(90, 90, 90);
      pdf.text(tagline, t.align === "center" ? centerX : marginX, y, t.align === "center" ? { align: "center" } : undefined);
      y += 24;
    } else y += 12;
    for (const section of sections) {
      if (y > 760) { pdf.addPage(); y = 55; }
      if (section.title) {
        pdf.setFont(t.font, "bold"); pdf.setFontSize(11); pdf.setTextColor(...t.headingColor);
        pdf.text(section.title, marginX, y);
        if (t.rule) { pdf.setDrawColor(...t.headingColor); pdf.line(marginX, y + 4, marginX + pageWidth, y + 4); }
        y += 18;
      }
      pdf.setFont(t.font, "normal"); pdf.setFontSize(10); pdf.setTextColor(30, 30, 30);
      for (const line of section.lines) {
        if (!line) { y += 8; continue; }
        for (const wrapped of pdf.splitTextToSize(line, pageWidth)) {
          if (y > 780) { pdf.addPage(); y = 55; }
          pdf.text(wrapped, marginX, y);
          y += 14;
        }
      }
      y += 8;
    }
    pdf.save("ResumeCoach-resume.pdf");
  }

  async function begin() {
    setError("");setAnswers([]);setAnswer("");setQuestionIndex(0);setConsultationLoading(false);setStage("analysing");
    try {
      const data = await callCoach("analyse", { resume, jobDescription, personalDetails });
      setAnalysis(data);setPositioning(data.recommendedPositioning||"Problem solver");setRecommendationChoices({});
      setStage(data.questions?.length ? "conversation" : "strategy");
    } catch (e) { setError(e.message); setStage("input"); }
  }

  async function submitAnswer() {
    if (!answer.trim()||consultationLoading) return;
    const submittedAnswer=answer.trim();
    const next = [...answers, { question: analysis.questions[questionIndex], answer: submittedAnswer }];
    setAnswers(next);setConsultationLoading(true);setError("");
    try {
      const result=await callCoach("followUp",{resume,jobDescription,analysis,answers:next});
      if(result.complete||!result.nextQuestion?.trim()||next.length>=8)setStage("strategy");
      else { setAnswer("");setAnalysis(current=>({...current,questions:[...current.questions,result.nextQuestion.trim()]}));setQuestionIndex(questionIndex+1); }
    } catch(e) { setError(e.message);setAnswer(submittedAnswer);setAnswers(next.slice(0,-1)); }
    finally { setConsultationLoading(false); }
  }

  async function generate() {
    setError(""); setStage("generating");
    try {
      const recommendations=analysis?.recommendations||[];
      const acceptedRecommendations=recommendations.filter((_,index)=>recommendationChoices[index]===true);
      const declinedRecommendations=recommendations.filter((_,index)=>recommendationChoices[index]===false);
      const data = await callCoach("generate", { resume, jobDescription, analysis, answers, positioning, personalDetails, acceptedRecommendations, declinedRecommendations });
      setDocuments(data);setTab("coachAdvice");setReviewIndex(0);setReviewEditing(false);setReviewInstruction("");setReviewMessage("");setReviewStatuses({});setStage("result");localStorage.setItem("resumecoach_latest", JSON.stringify(data));
      if(activeProfileId){const historyResponse=await fetch("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId:activeProfileId,resume,jobDescription,analysis,answers,positioning,documents:data})});const historyItem=await historyResponse.json().catch(()=>null);if(historyResponse.ok&&historyItem)setProfileHistory(current=>[historyItem,...current]);}
      try {
        const response=await fetch("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId:activeProfileId||null,resume,jobDescription,analysis,answers,positioning,documents:data})});
        const result=await response.json().catch(() => ({}));
        if(!response.ok) throw new Error(result.error || "The generated documents could not be saved.");
      } catch (saveError) { setError(`Your documents were generated, but could not be saved: ${saveError.message}`); }
    } catch (e) { setError(e.message); setStage("strategy"); }
  }

  function reviseInputs() {
    setError("");setDocuments(null);setTab("coachAdvice");setStage("input");
  }

  function reviseFollowUps() {
    setError("");setDocuments(null);setAnswers([]);setAnswer("");setQuestionIndex(0);setConsultationLoading(false);setTab("coachAdvice");setStage(analysis?.questions?.length?"conversation":"strategy");
  }

  function reviseStrategy() {
    setError("");setDocuments(null);setTab("coachAdvice");setStage("strategy");
  }

  function advanceReview() {
    const sections=documents?.reviewSections||[];
    setReviewMessage("");setReviewEditing(false);setReviewInstruction("");
    setReviewStatuses(current=>({...current,[reviewIndex]:current[reviewIndex]||"kept"}));
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
      setDocuments(updated);localStorage.setItem("resumecoach_latest",JSON.stringify(updated));setReviewStatuses(current=>({...current,[reviewIndex]:"updated"}));setReviewInstruction("");setReviewEditing(false);setReviewMessage("Section updated. Review the change, then continue when it feels right.");
    } catch(e) { setError(e.message); } finally { setReviewSaving(false); }
  }

  const canBegin = resume.trim().length > 80 && jobDescription.trim().length > 80;
  const priorityEntries = analysis ? Object.entries(analysis.priorities || {}).sort((a,b) => b[1] - a[1]).slice(0,5) : [];
  const positioningOptions = analysis?.positioningOptions?.length ? analysis.positioningOptions : fallbackPositionOptions.map((label,index)=>({label,reason:"A credible way to frame the evidence in your experience.",evidence:[],resumeScore:Math.max(35,76-index*8),roleScore:Math.max(35,72-index*7)}));
  const selectedPositioning = positioningOptions.find(option=>option.label===positioning) || positioningOptions[0];
  const resumeProofEntries = positioningOptions.map(option=>[option.label, option.resumeScore]).sort((a,b)=>percentClamp(b[1])-percentClamp(a[1]));
  const recommendations = analysis?.recommendations || [];
  const reviewSections = documents?.reviewSections || [];
  const reviewSection = reviewSections[reviewIndex];

  return <main className="min-h-screen bg-[#f4f2eb] text-ink">
    <header className="sticky top-0 z-20 border-b border-black/[.06] bg-[#f4f2eb]/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Logo/><button type="button" onClick={()=>setAccountOpen(true)} aria-label="Open my profile menu" className="flex items-center gap-3 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-left shadow-sm transition hover:border-[#1f6650]/35 hover:bg-white"><span className="hidden text-xs text-ink/45 sm:inline">{user?.email||"Private by default"}</span><span className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 rounded-full bg-[#18201d]"><span className="h-0.5 w-4 rounded-full bg-white"/><span className="h-0.5 w-4 rounded-full bg-white"/><span className="h-0.5 w-4 rounded-full bg-white"/></span></button></div></header>

    {accountOpen&&<div className="fixed inset-0 z-[80] flex justify-end bg-[#18201d]/35 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)setAccountOpen(false)}}><aside className="h-full w-full max-w-md overflow-y-auto bg-[#f4f2eb] p-6 shadow-2xl md:p-8" role="dialog" aria-modal="true" aria-label="Your profile"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">Your workspace</p><h2 className="mt-2 font-display text-4xl">My profile</h2><p className="mt-2 text-sm leading-6 text-ink/50">Keep your essential contact details ready and manage separate career directions.</p></div><button onClick={()=>setAccountOpen(false)} aria-label="Close menu" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-lg">×</button></div><div className="mt-7 rounded-[24px] border border-black/[.07] bg-white/70 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#18201d] font-display text-xl text-white">{(personalDetails.fullName||user?.email||"Y").charAt(0).toUpperCase()}</span><div><p className="font-semibold">My profile</p><p className="text-xs text-ink/40">Used in your resumes and cover letters</p></div></div><div className="mt-5 grid gap-4"><label className="text-xs text-ink/50">Full name<input value={personalDetails.fullName} disabled={accountSaving} onChange={e=>setPersonalDetails({...personalDetails,fullName:e.target.value})} autoComplete="name" className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650]"/></label><label className="text-xs text-ink/50">Email<input value={user?.email||""} disabled className="mt-1.5 w-full rounded-2xl border border-black/10 bg-black/[.03] px-4 py-3 text-sm text-ink/45"/></label><label className="text-xs text-ink/50">Mobile<input value={personalDetails.phone} disabled={accountSaving} onChange={e=>setPersonalDetails({...personalDetails,phone:e.target.value})} inputMode="tel" autoComplete="tel" className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650]"/></label></div>{profileError&&<p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{profileError}</p>}<button disabled={accountSaving} onClick={savePersonalDetails} className="mt-5 w-full rounded-full bg-[#1f6650] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{accountSaving?"Saving…":"Save personal details"}</button></div><button onClick={()=>{setAccountOpen(false);openProfileManager()}} className="mt-5 flex w-full items-center justify-between rounded-[22px] border border-black/[.07] bg-white/60 p-5 text-left"><span><strong className="block font-display text-xl">Career profiles</strong><small className="mt-1 block text-ink/45">{profiles.length} separate {profiles.length===1?"direction":"directions"}</small></span><span className="text-xl text-[#1f6650]">→</span></button><p className="mt-3 px-2 text-xs leading-5 text-ink/40">Each career profile has its own source resume and application workflow. Switching profiles starts a clean workspace.</p><button onClick={async()=>{await createClient().auth.signOut();location.href="/login"}} className="mt-7 w-full text-center text-xs text-ink/40 underline underline-offset-4">Sign out</button></aside></div>}

    {menuOpen&&<div className="fixed inset-0 z-[80] flex justify-end bg-[#18201d]/35 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)setMenuOpen(false)}}><aside className="h-full w-full max-w-md overflow-y-auto bg-[#f4f2eb] p-6 shadow-2xl md:p-8" role="dialog" aria-modal="true" aria-label="Career profiles"><div className="flex items-start justify-between gap-4"><div><button type="button" onClick={()=>{setMenuOpen(false);setAccountOpen(true)}} className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink/55 transition hover:border-[#1f6650]/35 hover:text-[#1f6650]">Back to My profile</button><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">Your workspace</p><h2 className="mt-2 font-display text-4xl">Career profiles</h2><p className="mt-2 text-sm leading-6 text-ink/50">Keep a different story ready for each career direction.</p></div><button onClick={()=>setMenuOpen(false)} aria-label="Close profile menu" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-lg">×</button></div><div className="mt-7 space-y-2">{profiles.map(profile=><button key={profile.id} onClick={()=>editManagedProfile(profile.id)} className={`w-full rounded-[20px] border p-4 text-left transition ${managedProfileId===profile.id?"border-[#1f6650] bg-[#dfece6]":"border-black/[.07] bg-white/60 hover:border-[#1f6650]/30"}`}><span className="flex items-center justify-between gap-3"><strong className="font-display text-xl">{profile.name}</strong>{activeProfileId===profile.id&&<small className="rounded-full bg-[#1f6650] px-2 py-1 text-[9px] uppercase tracking-wider text-white">In use</small>}</span><span className="mt-1 block text-xs text-ink/45">{profile.target_role||"No target role yet"}</span></button>)}{!profiles.length&&<div className="rounded-[20px] border border-dashed border-black/10 p-5 text-sm text-ink/45">You haven’t saved a career profile yet.</div>}</div>{managedProfileId&&<div className="mt-6 rounded-[24px] border border-black/[.07] bg-white/70 p-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#1f6650]">Edit profile details</p><label className="mt-4 block text-xs text-ink/50">Profile name<input value={managedProfileName} disabled={profileSaving} onChange={e=>setManagedProfileName(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650]"/></label><label className="mt-4 block text-xs text-ink/50">Target role<input value={managedProfileRole} disabled={profileSaving} onChange={e=>setManagedProfileRole(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650]"/></label>{profileError&&<p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{profileError}</p>}{profileNotice&&<p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{profileNotice}</p>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><button disabled={profileSaving} onClick={useManagedProfile} className="flex-1 rounded-full border border-[#1f6650] bg-white px-4 py-3 text-sm font-semibold text-[#1f6650]">Use this profile</button><button disabled={profileSaving||!managedProfileName.trim()} onClick={saveManagedProfile} className="flex-1 rounded-full bg-[#1f6650] px-4 py-3 text-sm font-semibold text-white disabled:opacity-30">{profileSaving?"Saving…":"Save details"}</button></div></div>}<button onClick={()=>{setMenuOpen(false);setProfileError("");setProfileOpen(true)}} className="mt-6 w-full rounded-full bg-[#18201d] px-5 py-3.5 text-sm font-semibold text-white">+ Create another profile</button><button onClick={async()=>{await createClient().auth.signOut();location.href="/login"}} className="mt-5 w-full text-center text-xs text-ink/40 underline underline-offset-4">Sign out</button></aside></div>}

    {error && <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
    {profileNotice && <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-emerald-900/10 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{profileNotice}</div>}

    {stage==="input"&&activeProfileId&&<section className="mx-auto mt-5 max-w-6xl px-5"><div className="rounded-[24px] border border-black/[.07] bg-white/55 p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1f6650]">This profile’s history</p><h2 className="mt-1 font-display text-2xl">Saved applications</h2></div><span className="text-xs text-ink/40">{profileHistory.length} saved</span></div>{profileHistory.length?<div className="mt-4 grid gap-2 md:grid-cols-3">{profileHistory.slice(0,6).map(item=><button key={item.id} onClick={()=>openHistoryItem(item)} className="rounded-[18px] border border-black/[.07] bg-white p-4 text-left transition hover:border-[#1f6650]/35"><strong className="block text-sm">{item.job_title||"Untitled application"}</strong><span className="mt-1 block text-xs text-ink/45">{item.company||"Saved draft"} · {new Date(item.created_at).toLocaleDateString("en-AU")}</span></button>)}</div>:<p className="mt-3 text-sm text-ink/45">Generated resumes and cover letters for this profile will appear here automatically.</p>}</div></section>}

    {extracting&&<div className="fixed inset-0 z-[100] grid cursor-wait place-items-center bg-[#18201d]/70 p-5 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="file-reading-title" aria-describedby="file-reading-description"><div className="w-full max-w-md rounded-[30px] bg-[#f4f2eb] p-8 text-center shadow-2xl"><div className="relative mx-auto mb-6 h-16 w-16"><span className="absolute inset-0 animate-ping rounded-full bg-[#98bfae]/30"/><span className="absolute inset-2 animate-pulse rounded-full bg-[#1f6650]"/><span className="absolute inset-0 grid place-items-center text-xl text-white">✦</span></div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">File received</p><h2 id="file-reading-title" className="mt-2 font-display text-3xl">Reading your {extracting==="resume"?"resume":"job description"}…</h2><p id="file-reading-description" className="mt-3 text-sm leading-6 text-ink/55">Extracting the text and checking the document. This usually takes a few moments.</p><div className="mt-7 h-2 overflow-hidden rounded-full bg-black/10" aria-label="Reading in progress"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#1f6650]"/></div><p className="mt-4 text-xs text-ink/40">Please keep this window open. You can continue when reading is complete.</p></div></div>}

    {profileOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-[#18201d]/35 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] bg-[#f4f2eb] p-7 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">New career profile</p><h2 className="mt-2 font-display text-3xl">Save this career direction.</h2><p className="mt-2 text-sm leading-6 text-ink/50">Keep separate source resumes for different roles without mixing your stories.</p><label className="mt-6 block text-xs text-ink/50">Profile name<input autoFocus disabled={profileSaving} value={profileName} onChange={e=>setProfileName(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650] disabled:opacity-50" placeholder="e.g. Cyber Security"/></label><label className="mt-4 block text-xs text-ink/50">Target role<input disabled={profileSaving} value={profileRole} onChange={e=>setProfileRole(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6650] disabled:opacity-50" placeholder="e.g. GRC Analyst"/></label>{profileError&&<p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{profileError}</p>}<div className="mt-6 flex justify-end gap-2"><button disabled={profileSaving} onClick={()=>setProfileOpen(false)} className="rounded-full px-5 py-3 text-sm text-ink/50 disabled:opacity-40">Cancel</button><button disabled={!profileName.trim()||profileSaving} onClick={createProfile} className="rounded-full bg-[#1f6650] px-5 py-3 text-sm font-semibold text-white disabled:opacity-30">{profileSaving?"Creating…":"Create profile"}</button></div></div></div>}

    {stage === "input" && <div className="mx-auto max-w-6xl px-5 py-12 md:py-20">
      <div className="mb-12 max-w-3xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1f6650]/15 bg-[#dfece6] px-3 py-1.5 text-xs font-medium text-[#1f6650]">✦ A resume coach, not a template builder</span><h1 className="font-display text-5xl leading-[1.02] tracking-[-.035em] md:text-7xl">Turn your experience into<br/><em className="font-normal text-[#1f6650]">a stronger application.</em></h1><p className="mt-6 max-w-xl text-base leading-7 text-ink/55">Add your resume and the role you want. We’ll tailor your strategy, resume and cover letter to what the employer values.</p></div>
      {user&&<div className="mb-5 flex flex-col justify-between gap-3 rounded-[22px] border border-black/[.07] bg-white/50 p-4 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#1f6650]">Career profile</p><p className="mt-1 text-sm text-ink/45">Everything saves automatically to the selected profile.</p></div><div className="flex flex-wrap gap-2"><select disabled={profileSaving} value={activeProfileId} onChange={e=>chooseProfile(e.target.value)} className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm disabled:opacity-50 sm:min-w-64"><option value="">Choose a profile</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}{p.target_role?` · ${p.target_role}`:""}</option>)}</select>{activeProfileId&&<button disabled={profileSaving} onClick={openProfileManager} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-40">Edit profile</button>}<button disabled={profiles.length>=3} onClick={()=>{setProfileError("");setProfileNotice("");setProfileOpen(true)}} className="rounded-full bg-[#18201d] px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">{profiles.length>=3?"3 profile limit":"+ New profile"}</button></div></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="group rounded-[28px] border border-black/[.07] bg-white/65 p-5 shadow-sm transition focus-within:-translate-y-1 focus-within:border-[#1f6650]/30 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-emerald-950/5"><span className="mb-3 flex items-center justify-between"><strong className="font-display text-xl">Your current resume</strong><small className="text-ink/35">Paste or upload</small></span><textarea value={resume} onChange={e=>setResume(e.target.value)} rows="13" className="w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-ink/25" placeholder="Paste your resume here. Don’t clean it up first—we need to see the real starting point."/><label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/15 px-4 py-3 text-xs text-ink/45 transition hover:border-[#1f6650] hover:text-[#1f6650]"><span>{extracting==="resume"?"Reading your file…":"Upload PDF or image"}</span><span>↑</span><input disabled={!!extracting} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>uploadFile(e.target.files?.[0],"resume")}/></label></div>
        <div className="group rounded-[28px] border border-black/[.07] bg-[#18201d] p-5 text-white shadow-sm transition focus-within:-translate-y-1 focus-within:shadow-xl focus-within:shadow-emerald-950/15"><span className="mb-3 flex items-center justify-between"><strong className="font-display text-xl">The role you want</strong><small className="text-white/35">Paste or upload</small></span><textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value)} rows="13" className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/25" placeholder="Paste the job description. We’ll decode what the employer really values."/><label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/15 px-4 py-3 text-xs text-white/45 transition hover:border-[#98bfae] hover:text-[#98bfae]"><span>{extracting==="job"?"Reading your file…":"Upload PDF or image"}</span><span>↑</span><input disabled={!!extracting} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>uploadFile(e.target.files?.[0],"job")}/></label></div>
      </div>
      <div className="mt-7 flex flex-col items-center justify-between gap-4 sm:flex-row"><p className="text-xs text-ink/40">Your draft stays in this browser. Generated content is grounded in what you provide.</p><button disabled={!canBegin} onClick={begin} className="group rounded-full bg-[#1f6650] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-900/15 transition hover:-translate-y-1 hover:bg-[#174f3f] disabled:translate-y-0 disabled:opacity-30">Find my strongest angle <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span></button></div>
    </div>}

    {stage === "analysing" && <Loading copy="Finding the signal in your experience…"/>}

    {stage === "conversation" && analysis && <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-ink/40">Adaptive evidence check · Question {answers.length+1}</span><span className="text-xs text-[#1f6650]">Questions stop as soon as there is enough evidence</span></div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#1f6650]"/></div>
      <section key={questionIndex} className="rounded-[30px] border border-black/[.07] bg-white/80 p-5 shadow-xl shadow-black/[.03] md:p-7">
        <div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#18201d] text-white">R</span><div className="min-w-0 flex-1"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1f6650]">ResumeCoach</p><h2 className="min-h-[84px] font-display text-3xl leading-tight">{analysis.questions[questionIndex]}</h2><p className="mt-3 text-sm leading-6 text-ink/45">Answer naturally. A sentence or two is enough—I’m looking for evidence, not polished copy.</p></div></div>
        <div className={`mt-6 rounded-[22px] border p-3 transition ${consultationLoading?"border-[#1f6650]/20 bg-[#dfece6]/60":"border-black/[.08] bg-[#f4f2eb]/70 focus-within:border-[#1f6650]/40 focus-within:bg-white"}`}><textarea key={`answer-${questionIndex}`} autoFocus disabled={consultationLoading} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitAnswer()}}} rows="3" className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none disabled:text-ink/60 disabled:opacity-100" placeholder="Type or speak your answer…"/><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className={`text-[11px] ${consultationLoading?"font-medium text-[#1f6650]":"text-ink/30"}`}>{consultationLoading?"✓ Answer submitted — checking for any remaining evidence gaps…":"Enter to continue · Shift + Enter for a new line"}</span><div className="flex gap-2"><button type="button" disabled={consultationLoading||!!listeningField} onClick={()=>startVoiceInput("answer",setAnswer)} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink/60 disabled:opacity-40">{listeningField==="answer"?"Listening…":"🎙 Speak"}</button><button onClick={submitAnswer} disabled={!answer.trim()||consultationLoading} className="shrink-0 rounded-full bg-[#1f6650] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#174f3f] disabled:opacity-30">{consultationLoading?"Reviewing…":"Continue →"}</button></div></div></div>
      </section>
      {answers.length>0&&<p className="mt-4 text-center text-xs text-[#1f6650]">✓ {answers.length} {answers.length===1?"insight":"insights"} captured</p>}
    </div>}

    {stage === "strategy" && analysis && <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <div className="grid gap-7 lg:grid-cols-[1fr_330px]"><section><span className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">Your positioning</span><h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight md:text-5xl">Choose the idea you want recruiters to remember.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/50">Each option comes from your evidence and this role’s priorities. Select one, or keep the recommended focus.</p>
        <div className="mt-6 flex flex-wrap gap-2">{positioningOptions.map(option=><button type="button" key={option.label} onClick={()=>setPositioning(option.label)} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${positioning===option.label?"border-[#1f6650] bg-[#1f6650] text-white shadow-md":"border-black/10 bg-white/70 text-ink/65 hover:border-[#1f6650]/40"}`}>{option.label}{option.label===analysis.recommendedPositioning&&<span className={`ml-2 text-[9px] uppercase tracking-wider ${positioning===option.label?"text-[#bfe0d1]":"text-[#1f6650]"}`}>Recommended</span>}</button>)}</div>
        {selectedPositioning&&<div className="mt-5 rounded-[24px] border border-[#1f6650]/10 bg-white/70 p-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#1f6650]">Why this fits you</p><p className="mt-2 text-sm leading-6 text-ink/65">{selectedPositioning.reason}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#dfece6] p-4"><p className="text-[10px] font-semibold uppercase tracking-widest text-[#1f6650]">Resume proof</p><p className="mt-1 font-display text-3xl">{percentClamp(selectedPositioning.resumeScore)}%</p></div><div className="rounded-2xl bg-[#f5ead6] p-4"><p className="text-[10px] font-semibold uppercase tracking-widest text-[#8b6424]">Role fit</p><p className="mt-1 font-display text-3xl">{percentClamp(selectedPositioning.roleScore)}%</p></div></div>{selectedPositioning.evidence?.length>0&&<div className="mt-3 flex flex-wrap gap-2">{selectedPositioning.evidence.slice(0,3).map(item=><span key={item} className="rounded-full bg-[#dfece6] px-3 py-1.5 text-xs text-[#1f6650]">{item}</span>)}</div>}</div>}
        {recommendations.length>0&&<div className="mt-6"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1f6650]">Recommended additions</p><h2 className="mt-1 font-display text-3xl">Useful things your resume is missing</h2></div><span className="hidden text-xs text-ink/35 sm:block">You decide what is included</span></div><div className="mt-4 space-y-3">{recommendations.map((item,index)=>{const choice=recommendationChoices[index];return <div key={`${item.title}-${index}`} className="rounded-[22px] border border-black/[.07] bg-white/70 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><strong className="font-display text-xl">{item.title}</strong><p className="mt-1 text-sm leading-6 text-ink/55">{item.reason}</p><p className="mt-2 text-xs leading-5 text-[#1f6650]">Suggestion: {item.suggestedAction}</p></div><div className="flex shrink-0 gap-2"><button onClick={()=>setRecommendationChoices(current=>({...current,[index]:true}))} className={`rounded-full px-3 py-2 text-xs font-semibold ${choice===true?"bg-[#1f6650] text-white":"border border-black/10 bg-white text-ink/55"}`}>Include</button><button onClick={()=>setRecommendationChoices(current=>({...current,[index]:false}))} className={`rounded-full px-3 py-2 text-xs font-semibold ${choice===false?"bg-ink text-white":"border border-black/10 bg-white text-ink/55"}`}>Leave out</button></div></div></div>})}</div></div>}
        <div className="mt-7 flex flex-col items-start justify-between gap-4 rounded-[26px] bg-[#18201d] p-6 text-white sm:flex-row sm:items-center"><div><p className="text-xs uppercase tracking-widest text-[#98bfae]">Your lead focus</p><h2 className="mt-1 font-display text-3xl">{positioning}</h2>{positioning!==analysis.recommendedPositioning&&<button onClick={()=>setPositioning(analysis.recommendedPositioning)} className="mt-2 text-xs text-[#98bfae] underline underline-offset-4">Use recommendation: {analysis.recommendedPositioning}</button>}</div><button onClick={generate} className="shrink-0 rounded-full bg-[#e5bc78] px-6 py-3.5 text-sm font-semibold text-[#18201d] transition hover:-translate-y-1">Write my application →</button></div></section>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start"><ScoreBars title="What the employer values" entries={priorityEntries}/><ScoreBars title="What your resume proves" entries={resumeProofEntries} tone="gold" selected={positioning}/><div className="rounded-[24px] border border-black/[.07] bg-[#dfece6] p-5"><p className="text-xs uppercase tracking-widest text-[#1f6650]">Evidence for this angle</p><div className="mt-3 space-y-2">{(selectedPositioning?.evidence?.length?selectedPositioning.evidence:analysis.evidence||[]).slice(0,5).map(x=><p key={x} className="rounded-xl bg-white/70 px-3 py-2 text-xs leading-5">{x}</p>)}</div>{(selectedPositioning?.evidence?.length||0)>5&&<p className="mt-3 text-xs text-[#1f6650]">+ {(selectedPositioning?.evidence||[]).length-5} more evidence points</p>}</div></aside></div>
    </div>}

    {stage === "generating" && <Loading copy="Writing it like a human who knows your value…"/>}

    {stage === "result" && documents && <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><span className="text-xs font-semibold uppercase tracking-[.18em] text-[#1f6650]">Your application is ready · You stay in control</span><h1 className="mt-2 font-display text-4xl md:text-5xl">Strong, specific, still you.</h1><p className="mt-2 text-sm text-ink/45">Preview everything, change any section, and export only when you’re ready.</p></div><button onClick={()=>{setStage("input");setDocuments(null)}} className="text-sm text-ink/45 underline underline-offset-4">Start another role</button></div>
      <div className="mb-5 rounded-[24px] border border-black/[.07] bg-white/65 p-4 shadow-sm md:flex md:items-center md:justify-between md:gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1f6650]">Need to change direction?</p>
          <p className="mt-1 text-sm leading-6 text-ink/55">Go back, edit the source or strategy, then regenerate a cleaner draft without starting from scratch.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0 md:justify-end">
          <button onClick={reviseInputs} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink/65 transition hover:border-[#1f6650]/40">Edit resume/job</button>
          {analysis?.questions?.length>0&&<button onClick={reviseFollowUps} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink/65 transition hover:border-[#1f6650]/40">Redo questions</button>}
          <button onClick={reviseStrategy} className="rounded-full bg-[#1f6650] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#174f3f]">Change positioning</button>
        </div>
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{[["resume","Resume preview"],["coverLetter","Cover letter"],["coachAdvice","Guided review"]].map(([k,l])=><Pill key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</Pill>)}</div>
      {tab!=="coachAdvice"&&<div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <section className="rounded-[28px] border border-black/[.07] bg-white p-6 shadow-xl shadow-black/[.03] md:p-9">
          {tab==="resume"&&<div className="mb-5 flex gap-2"><Pill active={resumeView==="edit"} onClick={()=>setResumeView("edit")}>Edit text</Pill><Pill active={resumeView==="preview"} onClick={()=>setResumeView("preview")}>Template preview</Pill></div>}
          {tab==="resume"&&resumeView==="preview"
            ? <ResumeTemplatePreview resumeText={documents.resume} templateId={documents.template}/>
            : <textarea value={documents[tab]} onChange={e=>setDocuments({...documents,[tab]:e.target.value})} className="min-h-[650px] w-full resize-none bg-transparent font-body text-sm leading-7 outline-none"/>}
        </section>
        <aside className="space-y-3">
          {tab==="resume"&&<div className="rounded-[24px] border border-black/[.07] bg-white/70 p-4"><p className="text-xs uppercase tracking-widest text-[#1f6650]">Choose a look</p><div className="mt-3 space-y-2">{RESUME_TEMPLATES.map(t=><button key={t.id} onClick={()=>setDocuments({...documents,template:t.id})} className={`block w-full rounded-2xl border p-3 text-left transition ${(documents.template||"classic")===t.id?"border-[#1f6650] bg-[#dfece6]":"border-black/[.07] bg-white hover:border-[#1f6650]/30"}`}><strong className="block text-sm">{t.name}</strong><span className="mt-0.5 block text-xs text-ink/45">{t.blurb}</span></button>)}</div><p className="mt-3 text-[11px] leading-4 text-ink/35">This only changes how it looks when previewed or exported — your words stay exactly as written.</p></div>}
          <div className="rounded-[24px] bg-[#18201d] p-5 text-white"><p className="text-xs uppercase tracking-widest text-[#98bfae]">Why it works</p><p className="mt-3 text-sm leading-6 text-white/60">The writing leads with {positioning.toLowerCase()}, mirrors the role’s language and keeps every claim grounded in your evidence.</p></div>
          <button onClick={()=>navigator.clipboard.writeText(documents[tab])} className="w-full rounded-full border border-black/10 bg-white py-3 text-sm font-semibold transition hover:border-[#1f6650]">Copy to clipboard</button>
          {tab==="resume"&&<><button onClick={downloadWord} className="w-full rounded-full border border-[#1f6650] bg-white py-3 text-sm font-semibold text-[#1f6650]">Download Word</button><button onClick={downloadPdf} className="w-full rounded-full bg-[#1f6650] py-3 text-sm font-semibold text-white">Download PDF</button></>}
          <button onClick={()=>saveBlob(new Blob([documents[tab]],{type:"text/plain"}),`resumecoach-${tab}.txt`)} className="w-full py-2 text-xs text-ink/40 underline underline-offset-4">Download plain text</button>
        </aside>
      </div>}
      {tab==="coachAdvice"&&<div><div className="mb-5 flex flex-col justify-between gap-4 rounded-[24px] bg-[#dfece6] p-5 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#1f6650]">Your first draft is ready</p><p className="mt-1 text-sm leading-6 text-ink/60">This is your draft. Jump between sections, keep what works, change anything, or preview and export whenever you’re ready.</p></div><button onClick={()=>setTab("resume")} className="shrink-0 rounded-full border border-[#1f6650] bg-white px-5 py-3 text-sm font-semibold text-[#1f6650]">Preview full resume</button></div><div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[24px] border border-black/[.07] bg-white/65 p-4 lg:sticky lg:top-24 lg:self-start"><div className="flex items-center justify-between gap-3 px-2 pb-3"><p className="text-xs font-semibold uppercase tracking-widest text-ink/40">Resume sections</p><span className="text-xs text-[#1f6650]">{Object.keys(reviewStatuses).length}/{reviewSections.length} reviewed</span></div><div className="max-h-64 space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible">{reviewSections.map((section,index)=><button key={`${section.title}-${index}`} onClick={()=>{setReviewIndex(index);setReviewEditing(false);setReviewMessage("")}} className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${reviewIndex===index?"border-[#1f6650] bg-[#dfece6]":"border-transparent bg-white/70 hover:border-[#1f6650]/20"}`}><span>{section.title}</span>{reviewStatuses[index]&&<span className={`text-[10px] font-semibold uppercase ${reviewStatuses[index]==="updated"?"text-[#b06b22]":"text-[#1f6650]"}`}>{reviewStatuses[index]==="updated"?"Updated":"Kept"}</span>}</button>)}</div><button onClick={()=>setTab("resume")} className="mt-4 w-full rounded-full bg-[#18201d] px-4 py-3 text-xs font-semibold text-white">Preview & export</button></aside>
        <section className="rounded-[28px] border border-black/[.07] bg-white p-6 shadow-xl shadow-black/[.03] md:p-8">{reviewSection?<><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[.16em] text-[#1f6650]">Section {reviewIndex+1}</span><span className="text-xs text-ink/35">Select any section from the list</span></div><h2 className="mt-3 font-display text-4xl">{reviewSection.title}</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><div className="rounded-[20px] bg-[#dfece6] p-4"><p className="text-xs font-semibold uppercase tracking-widest text-[#1f6650]">Why it was written this way</p><p className="mt-2 text-sm leading-6 text-ink/65">{reviewSection.rationale}</p></div><div className="rounded-[20px] border border-black/[.07] bg-[#f4f2eb]/70 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-[#1f6650]">What to keep</p><ul className="mt-2 space-y-2 text-sm leading-6 text-ink/65">{(reviewSection.keep||[]).map(item=><li key={item}>✓ {item}</li>)}</ul></div></div>{reviewSection.consider?.length>0&&<div className="mt-3 rounded-[20px] border border-[#e5bc78]/40 bg-[#fff7e8] p-4"><p className="text-xs font-semibold uppercase tracking-widest text-[#9a651d]">What you could change</p><ul className="mt-2 space-y-2 text-sm leading-6 text-ink/65">{reviewSection.consider.map(item=><li key={item}>→ {item}</li>)}</ul></div>}<div className="mt-4 rounded-[20px] border border-black/[.07] bg-white p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/35">First-draft section</p><pre className="max-h-[320px] overflow-auto whitespace-pre-wrap font-body text-sm leading-7 text-ink/75">{reviewSection.content}</pre></div>{reviewMessage&&<p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{reviewMessage}</p>}{reviewEditing?<div className="mt-4 rounded-[20px] border border-[#1f6650]/20 bg-white p-4"><label className="text-xs font-semibold text-[#1f6650]">What would you like changed?</label><textarea autoFocus value={reviewInstruction} onChange={e=>setReviewInstruction(e.target.value)} rows="4" className="mt-2 w-full resize-none rounded-2xl bg-[#f4f2eb] p-3 text-sm leading-6 outline-none" placeholder="Make this warmer, shorter, more specific, or emphasise a different strength…"/><div className="mt-3 flex justify-end gap-2"><button disabled={reviewSaving} onClick={()=>{setReviewEditing(false);setReviewInstruction("")}} className="rounded-full px-4 py-2 text-xs text-ink/45">Cancel</button><button disabled={!reviewInstruction.trim()||reviewSaving} onClick={reviseReviewSection} className="rounded-full bg-[#1f6650] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-30">{reviewSaving?"Updating…":"Update only this section"}</button></div></div>:<div className="mt-5 flex flex-col gap-3 sm:flex-row"><button onClick={advanceReview} className="flex-1 rounded-full bg-[#1f6650] px-5 py-3 text-sm font-semibold text-white">{reviewIndex===reviewSections.length-1?"Keep section — finish review":"Keep section — next →"}</button><button onClick={()=>{setReviewEditing(true);setReviewMessage("")}} className="flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink/65">Change this section</button></div>}</>:<p className="text-sm text-ink/50">Your guided review will appear here.</p>}</section>
      </div></div>}
    </div>}
    <footer className="mx-auto flex max-w-6xl justify-center px-5 py-8 text-[11px] text-ink/30">Claude-powered</footer>
  </main>;
}



