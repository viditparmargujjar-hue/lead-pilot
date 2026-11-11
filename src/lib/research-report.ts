import { PDFDocument, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { Company, LiveSource } from "./data";
import { factKeys, factLabels, type Claim, type Intelligence } from "./intelligence";

const PAGE_SIZE: [number, number] = [595.28, 841.89];
const MARGIN = 46;
const BOTTOM = 54;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const INK = rgb(0.14, 0.16, 0.23);
const MUTED = rgb(0.42, 0.44, 0.5);
const PRIMARY = rgb(0.36, 0.29, 0.72);
const BORDER = rgb(0.86, 0.87, 0.9);
const SOFT = rgb(0.96, 0.96, 0.985);

const replacements: Record<string, string> = {
  "–": "-", "—": "-", "‘": "'", "’": "'", "“": '"', "”": '"', "•": "-", "…": "...", "\u00a0": " ",
};

// Built-in PDF fonts keep the export self-contained. Transliterate accented Latin
// text and mark unsupported glyphs rather than failing the entire export.
function pdfText(value: unknown): string {
  const normalized = String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return Array.from(normalized).map((character) => {
    if (replacements[character]) return replacements[character];
    if (character === "\n" || character === "\t") return character;
    const code = character.codePointAt(0) ?? 0;
    if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) return character;
    if (code < 32 || (code >= 0x200b && code <= 0x200f)) return "";
    return "?";
  }).join("").replace(/[ \t]+/g, " ");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of pdfText(text).split(/\r?\n/)) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      if (font.widthOfTextAtSize(word, size) <= maxWidth) { line = word; continue; }
      let chunk = "";
      for (const character of word) {
        const next = chunk + character;
        if (chunk && font.widthOfTextAtSize(next, size) > maxWidth) { lines.push(chunk); chunk = character; }
        else chunk = next;
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

class ReportWriter {
  page!: PDFPage;
  y = 0;
  constructor(private doc: PDFDocument, private regular: PDFFont, private bold: PDFFont) { this.addPage(); }

  addPage() {
    this.page = this.doc.addPage(PAGE_SIZE);
    this.page.drawRectangle({ x: 0, y: PAGE_SIZE[1] - 8, width: PAGE_SIZE[0], height: 8, color: PRIMARY });
    this.page.drawText("LEADPILOT AI", { x: MARGIN, y: PAGE_SIZE[1] - 38, size: 10, font: this.bold, color: PRIMARY });
    this.page.drawText("CITED RESEARCH REPORT", { x: PAGE_SIZE[0] - MARGIN - 127, y: PAGE_SIZE[1] - 38, size: 8, font: this.regular, color: MUTED });
    this.y = PAGE_SIZE[1] - 70;
  }

  ensure(height: number) { if (this.y - height < BOTTOM) this.addPage(); }
  space(height = 8) { this.y -= height; }

  paragraph(text: string, options: { size?: number; bold?: boolean; color?: RGB; indent?: number; gap?: number } = {}) {
    const size = options.size ?? 10;
    const font = options.bold ? this.bold : this.regular;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.42;
    for (const line of wrapText(text, font, size, CONTENT_WIDTH - indent)) {
      this.ensure(lineHeight);
      if (line) this.page.drawText(line, { x: MARGIN + indent, y: this.y - size, size, font, color: options.color ?? INK });
      this.y -= lineHeight;
    }
    this.y -= options.gap ?? 5;
  }

  heading(text: string) {
    // Reserve room for the heading and the first evidence/item block so a
    // section title is never stranded at the bottom of a page.
    this.ensure(86);
    this.y -= 7;
    this.page.drawRectangle({ x: MARGIN, y: this.y - 13, width: 3, height: 14, color: PRIMARY });
    this.page.drawText(pdfText(text), { x: MARGIN + 10, y: this.y - 11, size: 13, font: this.bold, color: INK });
    this.y -= 28;
  }

  rule() {
    this.ensure(14);
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_SIZE[0] - MARGIN, y: this.y }, thickness: 0.7, color: BORDER });
    this.y -= 14;
  }

  link(url: string, label = url) {
    const size = 8.5;
    const lineHeight = 13;
    for (const line of wrapText(label, this.regular, size, CONTENT_WIDTH - 10)) {
      this.ensure(lineHeight);
      const width = this.regular.widthOfTextAtSize(line, size);
      this.page.drawText(line, { x: MARGIN + 10, y: this.y - size, size, font: this.regular, color: PRIMARY });
      if (/^https?:\/\//i.test(url)) {
        const annotation = this.doc.context.obj({
          Type: "Annot", Subtype: "Link", Rect: [MARGIN + 10, this.y - size - 2, MARGIN + 10 + width, this.y + 3],
          Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
        });
        this.page.node.addAnnot(this.doc.context.register(annotation));
      }
      this.y -= lineHeight;
    }
    this.y -= 4;
  }

  claim(label: string, claim: Claim | null) {
    this.ensure(58);
    this.paragraph(label, { size: 10, bold: true, gap: 2 });
    if (!claim) { this.paragraph("Not available", { color: MUTED, indent: 10, gap: 8 }); return; }
    this.paragraph(claim.value, { indent: 10, gap: 4 });
    this.paragraph(`Supporting quote: "${claim.quote}"`, { size: 9, color: MUTED, indent: 10, gap: 4 });
    this.link(claim.sourceUrl);
    this.space(3);
  }

  finish(generatedAt: Date) {
    const pages = this.doc.getPages();
    pages.forEach((page, index) => {
      const footerY = 29;
      page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_SIZE[0] - MARGIN, y: 42 }, thickness: 0.5, color: BORDER });
      page.drawText(`Generated ${displayDate(generatedAt.toISOString())}`, { x: MARGIN, y: footerY, size: 7.5, font: this.regular, color: MUTED });
      page.drawText(`Page ${index + 1} of ${pages.length}`, { x: PAGE_SIZE[0] - MARGIN - 48, y: footerY, size: 7.5, font: this.regular, color: MUTED });
    });
  }
}

export function researchReportFilename(companyName: string): string {
  const slug = companyName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  return `leadpilot-${slug || "company"}-research.pdf`;
}

export async function createResearchReport({ company, source, analysis }: { company: Company; source?: LiveSource; analysis: Intelligence }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const [regular, bold] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold)]);
  const generatedAt = new Date();
  doc.setTitle(`${company.name} — LeadPilot AI cited research`);
  doc.setAuthor("LeadPilot AI");
  doc.setSubject("Source-cited company research with evidence quotes and AI analysis labels");
  doc.setCreator("LeadPilot AI");
  doc.setCreationDate(generatedAt);
  doc.setModificationDate(generatedAt);

  const writer = new ReportWriter(doc, regular, bold);
  writer.paragraph(company.name, { size: 24, bold: true, gap: 4 });
  if (company.website) writer.link(company.website);
  writer.paragraph("Live web company · research based on retrieved full-page evidence", { size: 9, color: MUTED, gap: 8 });
  writer.rule();

  writer.heading("Assessment");
  writer.paragraph(`${analysis.temperature}${analysis.score == null ? "" : ` · ${analysis.score}/100`}`, { size: 16, bold: true, color: PRIMARY, gap: 5 });
  writer.paragraph(`Search fit: ${analysis.fit}. Buying intent: ${analysis.temperature === "Hot" ? "recent, relevant and source-reported" : "not confirmed"}.`, { gap: 3 });
  writer.paragraph(`Research completed: ${displayDate(analysis.analyzedAt)}`, { size: 9, color: MUTED, gap: 3 });
  writer.paragraph(`Target criteria: ${analysis.criteria || "Not supplied"}`, { size: 9, color: MUTED, gap: 8 });
  writer.paragraph(analysis.reason, { size: 10, gap: 6 });
  if (analysis.fitEvidence) writer.claim("Search fit evidence", analysis.fitEvidence);

  writer.heading("Company facts · source-reported");
  writer.paragraph("Every available field below includes its supporting quote and source URL. Unsupported fields remain unavailable.", { size: 9, color: MUTED, gap: 10 });
  for (const key of factKeys) writer.claim(factLabels[key], analysis.facts[key]);

  writer.heading("Recent activity, growth and buying signals");
  if (!analysis.signals.length) writer.paragraph("Not available — no supported signals found.", { color: MUTED });
  analysis.signals.forEach((signal, index) => {
    writer.ensure(70);
    writer.paragraph(`${index + 1}. ${signal.kind} · ${signal.date ?? "Date not verified"} · ${signal.relevant ? "Relevant to criteria" : "Relevance not established"}`, { bold: true, gap: 3 });
    writer.paragraph(signal.claim.value, { indent: 10, gap: 4 });
    writer.paragraph(`Supporting quote: "${signal.claim.quote}"`, { size: 9, color: MUTED, indent: 10, gap: 4 });
    writer.link(signal.claim.sourceUrl);
    writer.space(4);
  });

  writer.heading("Potential needs and sales opportunities");
  writer.paragraph("AI hypotheses · not verified buying intent", { size: 9, bold: true, color: PRIMARY, gap: 5 });
  writer.paragraph(analysis.opportunities || "Not available", { gap: 10 });

  if (source) {
    writer.heading("Original discovery result · unverified");
    writer.paragraph("This search excerpt is retained for provenance and does not establish the researched fields above.", { size: 9, color: MUTED, gap: 5 });
    writer.paragraph(source.excerpt || "No excerpt returned.", { size: 9, gap: 4 });
    writer.link(source.url);
    writer.paragraph(`Discovered by query: ${source.query || "Not recorded"} · fetched ${displayDate(source.fetchedAt)}`, { size: 8.5, color: MUTED, gap: 8 });
  }

  writer.heading("Pages researched");
  if (!analysis.pages.length) writer.paragraph("No research pages recorded.", { color: MUTED });
  analysis.pages.forEach((page, index) => {
    writer.ensure(42);
    writer.paragraph(`${index + 1}. ${page.official ? "Official website candidate" : "Third-party source"} · ${page.published ? `published ${page.published}` : "publication date unavailable"}`, { size: 9, bold: true, gap: 2 });
    writer.link(page.url);
  });

  writer.heading("Method and limitations");
  writer.paragraph("Facts and signals are included only when their supporting quote is present in a retrieved research page. Headquarters fields additionally require explicit headquarters, HQ or registered-office wording.", { size: 9, color: MUTED });
  writer.paragraph("Scores use deterministic evidence rules: Hot 75–100, Warm 40–74, Cold 0–39, and no score when evidence is insufficient. Company size and popularity do not establish buying intent.", { size: 9, color: MUTED });
  writer.paragraph("Source accuracy, site ownership and currentness are not independently verified. AI opportunities are hypotheses and are kept separate from sourced facts.", { size: 9, color: MUTED });

  writer.finish(generatedAt);
  return doc.save();
}
