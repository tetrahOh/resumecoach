import { NextResponse } from "next/server";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

async function askClaude(system, payload, maxTokens = 2500) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ResumeCoach is not connected to Claude yet. Add ANTHROPIC_API_KEY in Vercel Environment Variables.");
  const response = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"}, body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:"user",content:JSON.stringify(payload)}]}) });
  if (!response.ok) throw new Error(`Claude API returned ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const text = data.content?.map(x=>x.text||"").join("") || "{}";
  try { return JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")); } catch { throw new Error("Claude returned an unexpected response. Please try again."); }
}

const ANALYSE = `You are ResumeCoach, a warm, incisive Australian resume strategist. Analyse a current resume against a job description. Never invent evidence. Ask only 2-4 short follow-up questions, selected because their answers could materially strengthen this specific application. Return only JSON: {"jobTitle":"","company":"","summary":"","priorities":{"Technical expertise":0,"Problem solving":0,"Communication":0,"Leadership":0,"Business impact":0},"keywords":[""],"evidence":["short evidence phrase"],"gaps":[""],"recommendedPositioning":"one of: Technical expert, Problem solver, Results driven, Trusted operator, People leader, Fast learner","strategyReason":"2 sentences","coachingNote":"supportive 2 sentences","questions":["contextual question"]}. Percentages are independent 0-100.`;
const GENERATE = `You are ResumeCoach, an expert Australian resume writer. Write an ATS-friendly resume and tailored cover letter using only supplied facts. Reframe and prioritise; never fabricate employers, dates, qualifications, metrics or tools. Use natural Australian English, specific verbs, restrained confidence and no generic AI clichés. The resume must include contact-header placeholders only when details are absent, professional summary, key capabilities, experience, education/certifications when supported, and referees. Return only JSON: {"resume":"complete plain-text resume","coverLetter":"complete tailored letter","writersNotes":"plain-English explanation of positioning, prioritisation, evidence gaps and any placeholders"}.`;

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === "analyse") {
      if ((body.resume||"").length < 80 || (body.jobDescription||"").length < 80) return NextResponse.json({error:"Please paste both your current resume and the full job description."},{status:400});
      return NextResponse.json(await askClaude(ANALYSE,{resume:body.resume,jobDescription:body.jobDescription},1800));
    }
    if (body.action === "generate") return NextResponse.json(await askClaude(GENERATE,{resume:body.resume,jobDescription:body.jobDescription,analysis:body.analysis,followUpAnswers:body.answers,chosenPositioning:body.positioning},4500));
    return NextResponse.json({error:"Unknown coaching action."},{status:400});
  } catch (error) { return NextResponse.json({error:error.message||"ResumeCoach could not complete that request."},{status:500}); }
}
