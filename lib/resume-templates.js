function isSectionHeading(line) {
  return line.length < 40 && line === line.toUpperCase() && /^[A-Z]/.test(line);
}

function looksLikeContact(line) {
  return /@/.test(line) || /\|/.test(line) || /\+?\d[\d\s-]{6,}\d/.test(line);
}

function classifySectionLines(lines) {
  return lines.map((line, idx) => {
    if (!line) return { type: "blank" };
    const trimmed = line.trim();
    if (/^[•-]/.test(trimmed)) return { type: "bullet", text: trimmed.replace(/^[•-]\s*/, "") };
    let j = idx + 1;
    while (j < lines.length && !lines[j]) j++;
    const nextIsBullet = j < lines.length && /^[•-]/.test(lines[j].trim());
    if (nextIsBullet) {
      const match = trimmed.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
      return match && match[1].trim() ? { type: "heading", text: match[1].trim(), date: match[2].trim() } : { type: "heading", text: trimmed, date: "" };
    }
    return { type: "text", text: trimmed };
  });
}

export function parseResumeText(text = "") {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const name = lines[i]?.trim() || "Your Name";
  i++;
  let tagline = "", contact = "";
  for (let guard = 0; guard < 2; guard++) {
    while (i < lines.length && !lines[i].trim()) i++;
    const trimmed = lines[i]?.trim();
    if (!trimmed || isSectionHeading(trimmed)) break;
    if (looksLikeContact(trimmed) && !contact) { contact = trimmed; i++; }
    else if (!tagline) { tagline = trimmed; i++; }
    else break;
  }
  const sections = [];
  let current = null;
  for (const raw of lines.slice(i)) {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (current) current.lines.push("");
      continue;
    }
    if (isSectionHeading(trimmed)) {
      current = { title: trimmed, lines: [] };
      sections.push(current);
    } else {
      if (!current) { current = { title: "", lines: [] }; sections.push(current); }
      current.lines.push(trimmed);
    }
  }
  sections.forEach(section => {
    while (section.lines.length && !section.lines[section.lines.length - 1]) section.lines.pop();
    section.items = classifySectionLines(section.lines);
  });
  return { name, tagline, contact, sections };
}

export const RESUME_TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    blurb: "Traditional serif layout. Formal and ATS-friendly.",
    preview: { fontFamily: "'Georgia','Times New Roman',serif", nameColor: "#18201d", headingColor: "#18201d", accent: "#4b4b46", align: "center", headingClass: "uppercase tracking-[.14em]", headerStyle: "plain", density: "normal" },
    pdf: { font: "times", nameColor: [24, 32, 29], headingColor: [24, 32, 29], align: "center", headerStyle: "plain", density: "normal" },
    docx: { font: "Georgia", nameColor: "18201D", headingColor: "18201D", align: "CENTER", headerStyle: "plain", density: "normal" },
  },
  {
    id: "modern",
    name: "Modern",
    blurb: "Clean sans-serif with a confident accent colour.",
    preview: { fontFamily: "'Helvetica Neue',Arial,sans-serif", nameColor: "#1f6650", headingColor: "#1f6650", accent: "#1f6650", align: "left", headingClass: "uppercase tracking-[.14em]", headerStyle: "plain", density: "normal" },
    pdf: { font: "helvetica", nameColor: [31, 102, 80], headingColor: [31, 102, 80], align: "left", headerStyle: "plain", density: "normal" },
    docx: { font: "Calibri", nameColor: "1F6650", headingColor: "1F6650", align: "LEFT", headerStyle: "plain", density: "normal" },
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Understated and spacious, lets the content lead.",
    preview: { fontFamily: "'Helvetica Neue',Arial,sans-serif", nameColor: "#18201d", headingColor: "#82827a", accent: "#82827a", align: "left", headingClass: "uppercase tracking-[.22em] text-[10px]", headerStyle: "plain", density: "normal" },
    pdf: { font: "helvetica", nameColor: [24, 32, 29], headingColor: [130, 130, 122], align: "left", headerStyle: "plain", density: "normal" },
    docx: { font: "Helvetica", nameColor: "18201D", headingColor: "82827A", align: "LEFT", headerStyle: "plain", density: "normal" },
  },
  {
    id: "bold",
    name: "Bold",
    blurb: "Confident colour-block header for senior and leadership roles.",
    preview: { fontFamily: "'Helvetica Neue',Arial,sans-serif", nameColor: "#ffffff", headingColor: "#1c2f4d", accent: "#1c2f4d", align: "left", headingClass: "uppercase tracking-[.14em]", headerStyle: "block", headerBg: "#1c2f4d", density: "normal" },
    pdf: { font: "helvetica", nameColor: [255, 255, 255], headingColor: [28, 47, 77], align: "left", headerStyle: "block", headerBg: [28, 47, 77], density: "normal" },
    docx: { font: "Calibri", nameColor: "FFFFFF", headingColor: "1C2F4D", align: "LEFT", headerStyle: "block", headerBg: "1C2F4D", density: "normal" },
  },
  {
    id: "compact",
    name: "Compact",
    blurb: "Tighter spacing that fits more onto a single page.",
    preview: { fontFamily: "'Helvetica Neue',Arial,sans-serif", nameColor: "#18201d", headingColor: "#3a3a35", accent: "#3a3a35", align: "left", headingClass: "uppercase tracking-[.12em] text-[10px]", headerStyle: "plain", density: "compact" },
    pdf: { font: "helvetica", nameColor: [24, 32, 29], headingColor: [58, 58, 53], align: "left", headerStyle: "plain", density: "compact" },
    docx: { font: "Helvetica", nameColor: "18201D", headingColor: "3A3A35", align: "LEFT", headerStyle: "plain", density: "compact" },
  },
];

export function findTemplate(id) {
  return RESUME_TEMPLATES.find(t => t.id === id) || RESUME_TEMPLATES[0];
}
