"use client";

import { parseResumeText, findTemplate } from "@/lib/resume-templates";

export default function ResumeTemplatePreview({ resumeText, templateId }) {
  const template = findTemplate(templateId);
  const { name, tagline, sections } = parseResumeText(resumeText || "");
  const p = template.preview;
  return (
    <div className="min-h-[650px] rounded-2xl border border-black/[.06] bg-white p-8 md:p-10" style={{ fontFamily: p.fontFamily }}>
      <div className={p.align === "center" ? "text-center" : "text-left"}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: p.nameColor }}>{name}</h1>
        {tagline && <p className="mt-1.5 text-sm" style={{ color: p.accent }}>{tagline}</p>}
      </div>
      <div className="mt-8 space-y-6">
        {sections.map((section, index) => (
          <div key={`${section.title}-${index}`}>
            {section.title && <h2 className={`mb-2.5 text-xs font-semibold ${p.headingClass}`} style={{ color: p.headingColor }}>{section.title}</h2>}
            <div className="space-y-1.5 text-sm leading-6 text-ink/80">
              {section.lines.map((line, li) => line
                ? <p key={li} className={/^[•-]/.test(line.trim()) ? "pl-4" : ""}>{line}</p>
                : <div key={li} className="h-2" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
