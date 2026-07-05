import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a career-positioning analyst. Given a job description, score how much
the employer values each of these categories, as integer percentages that do NOT need to sum to 100:
Technical Skills, Leadership, Communication, Achievements.

Also write a two-sentence plain-English recommendation about how the candidate should primarily
present themselves for this role.

Respond ONLY with valid JSON, no preamble, no markdown fences, in this exact shape:
{
  "weights": { "Technical Skills": 0, "Leadership": 0, "Communication": 0, "Achievements": 0 },
  "recommendation": "string"
}`;

export async function POST(request) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription || jobDescription.trim().length < 20) {
      return NextResponse.json({ error: "Job description is too short." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: jobDescription }],
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
