"use client";

import { parseResumeText, findTemplate } from "@/lib/resume-templates";

export default function ResumeTemplatePreview({ resumeText, templateId }) {
  const template = findTemplate(templateId);
  const { name, tagline, contact, sections } = parseResumeText(resumeText || "");
  const p = template.preview;
  const isBlock = p.headerStyle === "block";
  const isCompact = p.density === "compact";
  const bodyPad = isCompact ? "p-6 md:p-7" : "p-8 md:p-10";
  const sectionGap = isCompact ? "mt-5 space-y-4" : "mt-7 space-y-6";
  const itemGap = isCompact ? "space-y-1" : "space-y-1.5";
  const bodyText = isCompact ? "text-[13px] leading-5" : "text-sm leading-6";
  const headingMb = isCompact ? "mb-2" : "mb-2.5";

  const header = (
    <div className={p.align === "center" ? "text-center" : "text-left"}>
      <h1 className={`font-bold tracking-tight ${isCompact ? "text-2xl" : "text-3xl"}`} style={{ color: p.nameColor }}>{name}</h1>
      {tagline && <p className={`mt-1.5 font-semibold ${isCompact ? "text-xs" : "text-sm"}`} style={{ color: isBlock ? p.nameColor : p.accent, opacity: isBlock ? 0.9 : 1 }}>{tagline}</p>}
      {contact && <p className={`mt-1 text-xs ${isBlock ? "" : "text-ink/45"}`} style={isBlock ? { color: p.nameColor, opacity: 0.75 } : undefined}>{contact}</p>}
    </div>
  );

  return (
    <div className="min-h-[650px] overflow-hidden rounded-2xl border border-black/[.06] bg-white" style={{ fontFamily: p.fontFamily }}>
      {isBlock
        ? <div className={isCompact ? "px-6 py-6 md:px-7" : "px-8 py-8 md:px-10"} style={{ background: p.headingColor }}>{header}</div>
        : <div className={bodyPad}>{header}<div className="mt-4 h-px" style={{ background: p.headingColor, opacity: 0.3 }} /></div>}
      <div className={`${bodyPad} ${isBlock ? "pt-6 md:pt-7" : "pt-0"}`}>
        <div className={sectionGap}>
          {sections.map((section, index) => (
            <div key={`${section.title}-${index}`}>
              {section.title && <h2 className={`${headingMb} border-b pb-1.5 text-xs font-semibold ${p.headingClass}`} style={{ color: p.headingColor, borderColor: p.headingColor, opacity: 1 }}>{section.title}</h2>}
              <div className={`${itemGap} ${bodyText} text-ink/80`}>
                {(section.items||[]).map((item, li) => {
                  if (item.type === "blank") return <div key={li} className={isCompact ? "h-1" : "h-2"} />;
                  if (item.type === "bullet") return <div key={li} className="flex gap-2.5"><span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: p.accent }} /><p className="flex-1">{item.text}</p></div>;
                  if (item.type === "heading") return <div key={li} className={`flex items-baseline justify-between gap-3 first:pt-0 ${isCompact ? "pt-1.5" : "pt-2"}`}><p className="font-semibold text-ink">{item.text}</p>{item.date && <span className="shrink-0 text-xs text-ink/45">{item.date}</span>}</div>;
                  return <p key={li}>{item.text}</p>;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
