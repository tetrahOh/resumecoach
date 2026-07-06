import { NextResponse } from "next/server";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

async function askClaude(system, payload, schema, maxTokens = 2500) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ResumeCoach is not connected to Claude yet. Add ANTHROPIC_API_KEY in Vercel Environment Variables.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type":"application/json", "x-api-key":key, "anthropic-version":"2023-06-01" },
    body: JSON.stringify({
      model: MODEL, max_tokens:maxTokens, system,
      messages:[{role:"user",content:JSON.stringify(payload)}],
      tools:[{name:"submit_result",description:"Return the completed ResumeCoach result.",input_schema:schema}],
      tool_choice:{type:"tool",name:"submit_result"}
    })
  });
  if (!response.ok) throw new Error(`Claude API returned ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const result = data.content?.find(block => block.type === "tool_use" && block.name === "submit_result");
  if (result?.input) return result.input;
  if (data.stop_reason === "max_tokens") throw new Error("Claude needed more room to finish this document. Please try again with a shorter source resume.");
  throw new Error("Claude did not return a complete document. Please try again.");
}

const ANALYSIS_SCHEMA={type:"object",additionalProperties:false,required:["jobTitle","company","summary","priorities","keywords","evidence","gaps","recommendedPositioning","strategyReason","coachingNote","questions"],properties:{jobTitle:{type:"string"},company:{type:"string"},summary:{type:"string"},priorities:{type:"object",additionalProperties:false,required:["Technical expertise","Problem solving","Communication","Leadership","Business impact"],properties:{"Technical expertise":{type:"integer",minimum:0,maximum:100},"Problem solving":{type:"integer",minimum:0,maximum:100},Communication:{type:"integer",minimum:0,maximum:100},Leadership:{type:"integer",minimum:0,maximum:100},"Business impact":{type:"integer",minimum:0,maximum:100}}},keywords:{type:"array",items:{type:"string"}},evidence:{type:"array",items:{type:"string"}},gaps:{type:"array",items:{type:"string"}},recommendedPositioning:{type:"string",enum:["Technical expert","Problem solver","Results driven","Trusted operator","People leader","Fast learner"]},strategyReason:{type:"string"},coachingNote:{type:"string"},questions:{type:"array",minItems:2,maxItems:4,items:{type:"string"}}}};
const REVIEW_SECTION_SCHEMA={type:"object",additionalProperties:false,required:["title","content","rationale"],properties:{title:{type:"string"},content:{type:"string"},rationale:{type:"string"}}};
const DOCUMENT_SCHEMA={type:"object",additionalProperties:false,required:["resume","coverLetter","writersNotes","reviewSections"],properties:{resume:{type:"string"},coverLetter:{type:"string"},writersNotes:{type:"string"},reviewSections:{type:"array",minItems:3,items:REVIEW_SECTION_SCHEMA}}};
const REVISION_SCHEMA={type:"object",additionalProperties:false,required:["content","rationale"],properties:{content:{type:"string"},rationale:{type:"string"}}};

const ANALYSE = `You are ResumeCoach, a warm, incisive Australian resume strategist. Analyse a current resume against a job description. Never invent evidence. Ask only 2-4 short follow-up questions, selected because their answers could materially strengthen this specific application. Return only JSON: {"jobTitle":"","company":"","summary":"","priorities":{"Technical expertise":0,"Problem solving":0,"Communication":0,"Leadership":0,"Business impact":0},"keywords":[""],"evidence":["short evidence phrase"],"gaps":[""],"recommendedPositioning":"one of: Technical expert, Problem solver, Results driven, Trusted operator, People leader, Fast learner","strategyReason":"2 sentences","coachingNote":"supportive 2 sentences","questions":["contextual question"]}. Percentages are independent 0-100.`;
const GENERATE = `You are ResumeCoach, an expert Australian resume writer. Write an ATS-friendly resume and tailored cover letter using only supplied facts. Reframe and prioritise; never fabricate employers, dates, qualifications, metrics or tools. Use natural Australian English, specific verbs, restrained confidence and no generic AI clichés. The resume must include contact-header placeholders only when details are absent, professional summary, key capabilities, experience, education/certifications when supported, and referees. Also provide reviewSections: an ordered walkthrough of the major resume sections. Each item must contain the exact section content as it appears in the resume plus a concise, useful rationale explaining why it was written that way for this role. Return only JSON: {"resume":"complete plain-text resume","coverLetter":"complete tailored letter","writersNotes":"overall coaching advice, evidence gaps and placeholders","reviewSections":[{"title":"section name","content":"exact content from the resume","rationale":"why this section was written and prioritised this way"}]}.`;
const REVISE_SECTION = `You are ResumeCoach revising one resume section after user feedback. Change only the supplied section. Preserve truthful facts, Australian English, ATS readability and alignment with the target role. Do not add unsupported claims. Return the complete replacement section content and a short explanation of what changed and why.`;

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === "analyse") {
      if ((body.resume||"").length < 80 || (body.jobDescription||"").length < 80) return NextResponse.json({error:"Please paste both your current resume and the full job description."},{status:400});
      return NextResponse.json(await askClaude(ANALYSE,{resume:body.resume,jobDescription:body.jobDescription},ANALYSIS_SCHEMA,2200));
    }
    if (body.action === "generate") return NextResponse.json(await askClaude(GENERATE,{resume:body.resume,jobDescription:body.jobDescription,analysis:body.analysis,followUpAnswers:body.answers,chosenPositioning:body.positioning},DOCUMENT_SCHEMA,6500));
    if (body.action === "reviseSection") {
      if (!body.section?.content || !body.instruction?.trim()) return NextResponse.json({error:"Tell the coach what you want changed in this section."},{status:400});
      return NextResponse.json(await askClaude(REVISE_SECTION,{fullResume:body.resume,targetRole:body.jobDescription,chosenPositioning:body.positioning,section:body.section,userRequest:body.instruction},REVISION_SCHEMA,2200));
    }
    return NextResponse.json({error:"Unknown coaching action."},{status:400});
  } catch (error) { return NextResponse.json({error:error.message||"ResumeCoach could not complete that request."},{status:500}); }
}
