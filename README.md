# ResumeCoach

ResumeCoach is an AI resume writing coach focused on strength discovery, job analysis, strategic positioning, evidence checks, ATS-friendly resume content, and tailored cover letters.

## Run locally

```bash
npm install
npm run dev
```

Profiles and documents currently persist in the browser. The service contract in `lib/ai-service.js` provides mock-capable functions that can be replaced by server-side AI and database implementations without changing the product flow.
