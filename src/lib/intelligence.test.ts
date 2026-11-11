import { describe, expect, it } from "vitest";
import { buildIntelligence, factKeys, supportedClaim, type EvidencePage, type FactKey, type Claim } from "./intelligence";
const page: EvidencePage = { url: "https://real.test/about", text: "Builds AI systems for banks. Looking for CRM vendors on 2026-11-01. Headquarters: Pune, India.", published: "2026-11-01", official: true };
const claim = { value: "AI systems for banks", sourceUrl: page.url, quote: "Builds AI systems for banks." };
const base = { facts: { ...Object.fromEntries(factKeys.map(k => [k, null])), overview: claim } as Record<FactKey, Claim | null>, fit: "strong" as const, fitEvidence: claim, signals: [], opportunities: "" };
describe("evidence scoring", () => {
  it("Hot is 75–100 only with recent relevant buying evidence", () => { const a = buildIntelligence({ ...base, fit: "partial", signals: [{ kind: "buying", relevant: true, date: "2026-11-01", claim: { ...claim, quote: "Looking for CRM vendors on 2026-11-01." } }] }, [page], "CRM for banks", "2026-11-06"); expect(a.score).toBe(75); expect(a.temperature).toBe("Hot"); });
  it("Warm stays 40–74 without confirmed buying intent", () => { const a = buildIntelligence({ ...base, fit: "partial" }, [page], "AI", "2026-11-06"); expect(a.score).toBe(40); expect(a.temperature).toBe("Warm"); });
  it("Cold stays 0–39 for weak fit", () => { const a = buildIntelligence({ ...base, fit: "weak" }, [page], "AI", "2026-11-06"); expect(a.score).toBe(20); expect(a.temperature).toBe("Cold"); });
  it("insufficient evidence has no guessed score", () => { const a = buildIntelligence({ ...base, fitEvidence: null }, [page], "India", "2026-11-06"); expect(a.score).toBeNull(); expect(a.temperature).toBe("Insufficient data"); });
  it("rejects unsupported location claims and snippet-only evidence", () => { expect(supportedClaim({ ...claim, value: "Delhi", quote: "Headquarters in Delhi, India" }, [page])).toBeNull(); expect(supportedClaim(claim, [])).toBeNull(); });
  it("old signals cannot make a company hot", () => { const a = buildIntelligence({ ...base, signals: [{ kind: "buying", relevant: true, date: "2020-11-01", claim }] }, [page], "AI", "2026-11-06"); expect(a.score).toBe(55); });
  it("does not label a branch address as headquarters", () => { const branch = { ...page, text: "Office in Pune, India. Builds AI systems for banks." }; const a = buildIntelligence({ ...base, facts: { ...base.facts, headquartersCity: { ...claim, value: "Pune", quote: "Office in Pune, India." } } }, [branch], "AI", "2026-11-06"); expect(a.facts.headquartersCity).toBeNull(); });
});