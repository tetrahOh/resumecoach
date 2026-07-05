# ResumeCoach

Paste a job description and a resume. ResumeCoach tells you which professional
identity to lead with for that specific role, lets you adjust the positioning,
and rewrites the resume to match.

## Stack

- Next.js (App Router)
- Tailwind CSS
- Claude API (Haiku for the initial role analysis, Sonnet for the final resume + report)

## Running it locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste in your real ANTHROPIC_API_KEY
npm run dev
```

Then open http://localhost:3000

## Getting a Claude API key

1. Go to https://console.anthropic.com
2. Settings → API Keys → Create Key
3. Paste it into `.env.local` as `ANTHROPIC_API_KEY`

Never commit `.env.local` — it's already excluded in `.gitignore`.

## Project structure

```
app/
  page.js              the whole 3-step UI flow
  layout.js            root layout + fonts
  globals.css          Tailwind + base styles
  api/
    analyze/route.js   Step 1: scores what the job description values
    generate/route.js  Step 2/3: writes the positioning report + rewritten resume
components/
  JobResumeForm.js
  PositioningSliders.js
  StrengthsChecklist.js
  PositioningReport.js
```

## Deploying

Push this repo to GitHub, then import it at https://vercel.com/new.
Add `ANTHROPIC_API_KEY` under Vercel's Project Settings → Environment Variables
(same value as your local `.env.local`) before your first deploy.

## Next steps (not built yet)

- Stripe checkout gate (first resume free, pay for more)
- PDF export instead of plain .txt
- Resume upload (PDF/docx parsing) instead of paste-only
