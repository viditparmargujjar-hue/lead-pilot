import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { Company } from "./data";
import { factKeys, type Claim, type Intelligence } from "./intelligence";
import { createResearchReport, researchReportFilename } from "./research-report";

const sourceUrl = "https://example.com/about";
const claim: Claim = { value: "Enterprise AI systems", sourceUrl, quote: "We build enterprise AI systems. ".repeat(35).trim() };
const analysis: Intelligence = {
  version: 2,
  facts: Object.fromEntries(factKeys.map((key) => [key, claim])) as Intelligence["facts"],
  pages: [{ url: sourceUrl, text: claim.quote, published: "2026-11-01", official: true }],
  fit: "strong", fitEvidence: claim,
  signals: [{ kind: "buying", claim, date: "2026-11-01", relevant: true }],
  opportunities: "A clearly labelled AI hypothesis.",
  score: 90, temperature: "Hot", reason: "Strong search fit with recent relevant buying evidence.",
  analyzedAt: "2026-11-07T12:00:00.000Z", criteria: "AI companies in India",
};
const company: Company = { id: "live:example.com", name: "Example & Co", industry: "Not stated", city: "Not stated", country: "", region: "", employees: 0, website: "https://example.com", tags: [] };

describe("cited research PDF", () => {
  it("creates a readable multi-page PDF with clickable evidence citations", async () => {
    const bytes = await createResearchReport({ company, analysis });
    expect(bytes.byteLength).toBeGreaterThan(1000);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getTitle()).toContain(company.name);
    const annotations = pdf.getPages().flatMap((page) => {
      const refs = page.node.Annots();
      if (!refs) return [];
      return Array.from({ length: refs.size() }, (_, index) => String(pdf.context.lookup(refs.get(index))));
    });
    expect(annotations.join("\n")).toContain(sourceUrl);
  });

  it("creates safe, company-specific filenames", () => {
    expect(researchReportFilename("Example & Co")).toBe("leadpilot-example-co-research.pdf");
    expect(researchReportFilename("***")).toBe("leadpilot-company-research.pdf");
  });
});
