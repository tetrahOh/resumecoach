import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a career-positioning strategist and resume writer. You are given:
1. A job description
2. A candidate's existing resume (plain text)
3. A set of positioning weights (0-100) across: Technical Skills, Leadership, Communication, Achievements
4. Up to four strengths the candidate wants to be known for

Your job:
- Decide a "primary impression" and "secondary impression" (short phrases, e.g. "Technical Expert", "Problem Solver")
- List 2-4 "supporting" strengths and 2-3 areas of "reduced" emphasis (things to de-prioritise from the resume)
- Write a short "rationale" (2-3 sentences) explaining why this positioning fits the role
- Rewrite the resume content so it consistently reinforces that positioning, respecting the weights given
  (higher weight = more emphasis on that category). Keep it truthful to the original resume's facts —
  reframe and reprioritise, do not invent experience.

Respond ONLY with valid JSON, no preamble, no markdown fences, in this exact shape:
{
  "report": {
    "primary": "string",
    "secondary": "string",
    "supporting": ["string"],
    "reduced": ["string"],
    "rationale": "string"
  },
  "resume": "string (the rewritten resume as plain text, ready to format)"
}`;

export async function POST(request) {
  try {
    const { jobDescription, resume, weights, strengths } = await request.json();

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: "Missing job description or resume." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local." },
        { status: 500 }
      );
    }

    const userContent = `JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resume}

POSITIONING WEIGHTS:
${JSON.stringify(weights, null, 2)}

DESIRED STRENGTHS:
${strengths?.join(", ") || "none specified"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Claude API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text ?? "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not parse the model's response." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Unknown error." }, { status: 500 });
  }
}
