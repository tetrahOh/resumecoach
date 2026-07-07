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

function questionWords(value="") {
  const ignored=new Set(["a","an","and","are","can","did","do","for","have","how","in","is","it","of","on","or","that","the","this","to","was","what","when","where","which","with","you","your"]);
  return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(word=>word.length>2&&!ignored.has(word)));
}

function isRepeatedQuestion(candidate, asked=[]) {
  const candidateWords=questionWords(candidate);
  if(!candidateWords.size)return true;
  return asked.some(question=>{
    const previousWords=questionWords(question);
    const shared=[...candidateWords].filter(word=>previousWords.has(word)).length;
    const smaller=Math.min(candidateWords.size,previousWords.size);
    return smaller>0&&shared/smaller>=0.7;
  });
}

const POSITIONING_OPTION_SCHEMA={type:"object",additionalProperties:false,required:["label","reason","evidence","resumeScore","roleScore"],properties:{label:{type:"string"},reason:{type:"string"},evidence:{type:"array",items:{type:"string"}},resumeScore:{type:"integer",minimum:0,maximum:100},roleScore:{type:"integer",minimum:0,maximum:100}}};
const RECOMMENDATION_SCHEMA={type:"object",additionalProperties:false,required:["title","reason","suggestedAction"],properties:{title:{type:"string"},reason:{type:"string"},suggestedAction:{type:"string"}}};
const ANALYSIS_SCHEMA={type:"object",additionalProperties:false,required:["jobTitle","company","summary","priorities","keywords","evidence","gaps","positioningOptions","recommendations","recommendedPositioning","strategyReason","coachingNote","questions"],properties:{jobTitle:{type:"string"},company:{type:"string"},summary:{type:"string"},priorities:{type:"object",additionalProperties:false,required:["Technical expertise","Problem solving","Communication","Leadership","Business impact"],properties:{"Technical expertise":{type:"integer",minimum:0,maximum:100},"Problem solving":{type:"integer",minimum:0,maximum:100},Communication:{type:"integer",minimum:0,maximum:100},Leadership:{type:"integer",minimum:0,maximum:100},"Business impact":{type:"integer",minimum:0,maximum:100}}},keywords:{type:"array",items:{type:"string"}},evidence:{type:"array",items:{type:"string"}},gaps:{type:"array",items:{type:"string"}},positioningOptions:{type:"array",minItems:3,maxItems:6,items:POSITIONING_OPTION_SCHEMA},recommendations:{type:"array",maxItems:5,items:RECOMMENDATION_SCHEMA},recommendedPositioning:{type:"string"},strategyReason:{type:"string"},coachingNote:{type:"string"},questions:{type:"array",maxItems:1,items:{type:"string"}}}};
const FOLLOW_UP_SCHEMA={type:"object",additionalProperties:false,required:["complete","nextQuestion","reason"],properties:{complete:{type:"boolean"},nextQuestion:{type:"string"},reason:{type:"string"}}};
const REVIEW_SECTION_SCHEMA={type:"object",additionalProperties:false,required:["title","content","rationale","keep","consider"],properties:{title:{type:"string"},content:{type:"string"},rationale:{type:"string"},keep:{type:"array",items:{type:"string"}},consider:{type:"array",items:{type:"string"}}}};
const DOCUMENT_SCHEMA={type:"object",additionalProperties:false,required:["resume","coverLetter","writersNotes","reviewSections"],properties:{resume:{type:"string"},coverLetter:{type:"string"},writersNotes:{type:"string"},reviewSections:{type:"array",minItems:3,items:REVIEW_SECTION_SCHEMA}}};
const REVISION_SCHEMA={type:"object",additionalProperties:false,required:["content","rationale"],properties:{content:{type:"string"},rationale:{type:"string"}}};

const ANALYSE = `You are ResumeCoach, a warm, incisive Australian resume strategist. Speak directly to the person using "you" and "your" in every user-facing explanation. Never call the person "the candidate" or "the user", and never use third-person pronouns for the person. Analyse the supplied resume against the job description. Never invent evidence. Create 3-6 concise positioning options that describe your strongest credible professional identities for this role. Do not choose from a fixed list. Derive each label from your supplied experience, achievements, portfolio evidence and the employer's priorities. Labels should be memorable, professional and 2-4 words long. For each option explain why it fits you and cite 1-3 short evidence phrases from your material. For each positioning option, set resumeScore to how strongly the current resume already proves that story and roleScore to how useful that story is for this specific job. Identify up to five useful additions or clarifications that are missing from the resume. Each recommendation must explain why it matters and suggest a truthful action; never invent the missing information. Set recommendedPositioning to exactly one option label and explain why it is your strongest lead. Decide whether one follow-up question could materially strengthen your application. If so, return only the single highest-value contextual question. If the supplied evidence is already sufficient, return an empty questions array. Return only JSON: {"jobTitle":"","company":"","summary":"","priorities":{"Technical expertise":0,"Problem solving":0,"Communication":0,"Leadership":0,"Business impact":0},"keywords":[""],"evidence":["short evidence phrase"],"gaps":[""],"positioningOptions":[{"label":"personalised focus","reason":"why this positioning fits you","evidence":["supporting evidence"],"resumeScore":0,"roleScore":0}],"recommendations":[{"title":"missing or weak area","reason":"why this matters for your application","suggestedAction":"what you could truthfully add or clarify"}],"recommendedPositioning":"exact label from positioningOptions","strategyReason":"2 sentences","coachingNote":"supportive 2 sentences","questions":["zero or one highest-value question"]}. Percentages are independent 0-100. Employer priority percentages describe what the employer values. resumeScore describes what your current resume proves. roleScore describes how well the story angle fits this job.`;
const FOLLOW_UP = `You are continuing a concise resume coaching consultation. Address the person directly as "you" and "your". Review the source resume, target role, initial analysis and every answer already supplied. Decide whether another question would uncover specific evidence that could materially improve the resume. Do not ask for information already provided, generic preferences, or facts that are merely nice to know. If enough credible evidence exists, set complete=true and nextQuestion to an empty string. Otherwise set complete=false and ask exactly one natural, specific question directly to the person. Keep the consultation as short as possible, but continue while important evidence gaps remain.`;
const GENERATE = `You are ResumeCoach, an expert Australian resume writer. Write all coaching directly to the person using "you" and "your"; never call the person "the candidate" or "the user", and never use third-person pronouns for the person. Write an ATS-friendly resume and tailored cover letter using only supplied facts. Reframe and prioritise; never fabricate employers, dates, qualifications, metrics or tools. Apply accepted recommendations only when supported by supplied evidence; otherwise use an explicit placeholder for information the person chose to add. Do not include declined recommendations. Use natural Australian English, specific verbs, restrained confidence and no generic AI clichés. The resume must include contact-header placeholders only when details are absent, professional summary, key capabilities, experience, education/certifications when supported, and referees. Also provide reviewSections: an ordered walkthrough of every major resume section. Each item must contain the exact section content as it appears in the resume, a concise rationale explaining why it was written that way for this role, 1-3 short points explaining what should be kept, and 0-3 honest suggestions the person could consider changing. Return only JSON: {"resume":"complete plain-text resume","coverLetter":"complete tailored letter","writersNotes":"overall coaching advice, evidence gaps and placeholders","reviewSections":[{"title":"section name","content":"exact content from the resume","rationale":"why this section was written and prioritised this way for you","keep":["what is already working"],"consider":["optional improvement to consider"]}]}.`;
const REVISE_SECTION = `You are ResumeCoach revising one resume section after feedback. Address the person directly as "you" and "your" in the explanation. Change only the supplied section. Preserve truthful facts, Australian English, ATS readability and alignment with the target role. Do not add unsupported claims. Return the complete replacement section content and a short explanation of what changed and why.`;

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === "analyse") {
      if ((body.resume||"").length < 80 || (body.jobDescription||"").length < 80) return NextResponse.json({error:"Please paste both your current resume and the full job description."},{status:400});
      return NextResponse.json(await askClaude(ANALYSE,{resume:body.resume,jobDescription:body.jobDescription,personalDetails:body.personalDetails},ANALYSIS_SCHEMA,2200));
    }
    if (body.action === "generate") return NextResponse.json(await askClaude(GENERATE,{resume:body.resume,jobDescription:body.jobDescription,personalDetails:body.personalDetails,analysis:body.analysis,followUpAnswers:body.answers,chosenPositioning:body.positioning,acceptedRecommendations:body.acceptedRecommendations||[],declinedRecommendations:body.declinedRecommendations||[]},DOCUMENT_SCHEMA,6500));
    if (body.action === "followUp") {
      const asked=(body.answers||[]).map(item=>item.question).filter(Boolean);
      let result=await askClaude(FOLLOW_UP,{resume:body.resume,jobDescription:body.jobDescription,analysis:body.analysis,answers:body.answers,questionsAlreadyAsked:asked},FOLLOW_UP_SCHEMA,900);
      if(!result.complete&&isRepeatedQuestion(result.nextQuestion,asked)) {
        const rejectedQuestion=result.nextQuestion;
        result=await askClaude(FOLLOW_UP,{resume:body.resume,jobDescription:body.jobDescription,analysis:body.analysis,answers:body.answers,questionsAlreadyAsked:asked,rejectedDuplicate:rejectedQuestion,instruction:"Choose a materially different evidence gap. If none remains, end the consultation."},FOLLOW_UP_SCHEMA,900);
        if(!result.complete&&isRepeatedQuestion(result.nextQuestion,asked))result={complete:true,nextQuestion:"",reason:"No materially different evidence gap remains."};
      }
      return NextResponse.json(result);
    }
    if (body.action === "reviseSection") {
      if (!body.section?.content || !body.instruction?.trim()) return NextResponse.json({error:"Tell the coach what you want changed in this section."},{status:400});
      return NextResponse.json(await askClaude(REVISE_SECTION,{fullResume:body.resume,targetRole:body.jobDescription,chosenPositioning:body.positioning,section:body.section,userRequest:body.instruction},REVISION_SCHEMA,2200));
    }
    return NextResponse.json({error:"Unknown coaching action."},{status:400});
  } catch (error) { return NextResponse.json({error:error.message||"ResumeCoach could not complete that request."},{status:500}); }
}
