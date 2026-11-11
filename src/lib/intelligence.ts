import { z } from "zod";

export const claimSchema = z.object({ value: z.string().max(1200), sourceUrl: z.string().url(), quote: z.string().min(12).max(1500) });
export const factKeys = ["name", "overview", "industry", "headquartersCity", "headquartersRegion", "headquartersCountry", "offices", "serviceArea", "products", "size", "contacts", "targetMarket"] as const;
export type FactKey = typeof factKeys[number];
export type Claim = z.infer<typeof claimSchema>;
export interface EvidencePage { url: string; text: string; published: string | null; official: boolean }
export const extractionSchema = z.object({
  facts: z.object(Object.fromEntries(factKeys.map(k => [k, claimSchema.nullable()])) as Record<FactKey, z.ZodNullable<typeof claimSchema>>),
  fit: z.enum(["strong", "partial", "weak", "unknown"]), fitEvidence: claimSchema.nullable(),
  signals: z.array(z.object({ kind: z.enum(["buying", "hiring", "expansion", "adoption", "growth", "activity"]), claim: claimSchema, date: z.string().nullable(), relevant: z.boolean() })).max(12),
  opportunities: z.string().max(1500),
});
export interface Intelligence {
  version: 2; facts: Record<FactKey, Claim | null>; pages: EvidencePage[];
  fit: "strong" | "partial" | "weak" | "unknown"; fitEvidence: Claim | null;
  signals: z.infer<typeof extractionSchema>["signals"]; opportunities: string;
  score: number | null; temperature: "Hot" | "Warm" | "Cold" | "Insufficient data";
  reason: string; analyzedAt: string; criteria: string;
}
const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
export function supportedClaim(claim: Claim | null, pages: EvidencePage[], officialOnly = false): Claim | null {
  if (!claim) return null;
  return pages.some(p => p.url === claim.sourceUrl && (!officialOnly || p.official) && normalize(p.text).includes(normalize(claim.quote))) ? claim : null;
}
export function buildIntelligence(raw: z.infer<typeof extractionSchema>, pages: EvidencePage[], criteria: string, now: string): Intelligence {
  const facts = Object.fromEntries(factKeys.map(k => [k, supportedClaim(raw.facts[k], pages)])) as Record<FactKey, Claim | null>;
  for (const key of ["headquartersCity", "headquartersRegion", "headquartersCountry"] as const) {
    const c = facts[key];
    if (c && !/head\s*(?:quarters|office)|\bhq\b|registered office/i.test(c.quote)) facts[key] = null;
  }
  const fitEvidence = supportedClaim(raw.fitEvidence, pages);
  const fit = fitEvidence && criteria.trim() ? raw.fit : "unknown";
  const signals = raw.signals.filter(s => supportedClaim(s.claim, pages));
  const recent = signals.filter(s => {
    if (!s.date) return false;
    const date = Date.parse(s.date), age = Date.parse(now) - date;
    // The event date itself must occur in the full source, not be an AI-created timestamp.
    const page = pages.find(p => p.url === s.claim.sourceUrl);
    return Number.isFinite(date) && age >= 0 && age <= 180 * 86400000 && !!page && (page.published?.slice(0, 10) === s.date.slice(0, 10) || page.text.includes(s.date));
  });
  const buying = recent.some(s => s.kind === "buying" && s.relevant);
  const growth = recent.some(s => ["hiring", "expansion", "adoption", "growth"].includes(s.kind) && s.relevant);
  const enough = !!facts.overview && !!fitEvidence && fit !== "unknown";
  const score = !enough ? null : buying && fit === "strong" ? 90 : buying && fit === "partial" ? 75 : fit === "strong" ? (growth ? 70 : 55) : fit === "partial" ? (growth ? 60 : 40) : 20;
  const temperature = score == null ? "Insufficient data" : score >= 75 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  const reason = score == null ? "Full-page company evidence and a supported search match are required; no score is assigned."
    : `${fit === "weak" ? "Weak" : fit === "strong" ? "Strong" : "Partial"} search fit. ${buying ? "Recent relevant explicit buying intent is source-reported." : growth ? "Recent relevant growth is source-reported, but buying intent is not confirmed." : "No confirmed recent relevant buying intent; company size and popularity do not increase the score."}`;
  return { version: 2, facts, pages, fit, fitEvidence, signals, opportunities: raw.opportunities, score, temperature, reason, analyzedAt: now, criteria };
}
export const factLabels: Record<FactKey, string> = {
  name: "Company name", overview: "Company overview", industry: "Industry", headquartersCity: "Headquarters city", headquartersRegion: "State / region", headquartersCountry: "Country", offices: "Office locations", serviceArea: "Service area", products: "Products and services", size: "Business size", contacts: "Public contacts", targetMarket: "Target market",
};