"use client";

import { parseResumeText, findTemplate } from "@/lib/resume-templates";

export default function ResumeTemplatePreview({ resumeText, templateId }) {
  const template = findTemplate(templateId);
  const { name, tagline, contact, sections } = parseResumeText(resumeText || "");
  const p = template.preview;
  return (
    <div className="min-h-[650px] rounded-2xl border border-black/[.06] bg-white p-8 md:p-10" style={{ fontFamily: p.fontFamily }}>
      <div className={p.align === "center" ? "text-center" : "text-left"}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: p.nameColor }}>{name}</h1>
        {tagline && <p className="mt-1.5 text-sm font-semibold" style={{ color: p.accent }}>{tagline}</p>}
        {contact && <p className="mt-1 text-xs text-ink/45">{contact}</p>}
      </div>
      <div className="mt-4 h-px" style={{ background: p.headingColor, opacity: 0.3 }} />
      <div className="mt-7 space-y-6">
        {sections.map((section, index) => (
          <div key={`${section.title}-${index}`}>
            {section.title && <h2 className={`mb-2.5 border-b pb-1.5 text-xs font-semibold ${p.headingClass}`} style={{ color: p.headingColor, borderColor: p.headingColor, opacity: 1 }}>{section.title}</h2>}
            <div className="space-y-1.5 text-sm leading-6 text-ink/80">
              {(section.items||[]).map((item, li) => {
                if (item.type === "blank") return <div key={li} className="h-2" />;
                if (item.type === "bullet") return <div key={li} className="flex gap-2.5"><span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: p.accent }} /><p className="flex-1">{item.text}</p></div>;
                if (item.type === "heading") return <div key={li} className="flex items-baseline justify-between gap-3 pt-2 first:pt-0"><p className="font-semibold text-ink">{item.text}</p>{item.date && <span className="shrink-0 text-xs text-ink/45">{item.date}</span>}</div>;
                return <p key={li}>{item.text}</p>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
