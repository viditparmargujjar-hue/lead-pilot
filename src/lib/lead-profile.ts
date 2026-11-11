import type { LiveResult } from "./live-search";
import type { Intelligence } from "./intelligence";
import { discoveryDetails } from "./live-result-details";

/** One normalized lead. Every value comes from the Tavily excerpt or cited research; missing stays null. */
export interface LeadProfile {
  id: string; name: string; industry: string | null; description: string | null;
  website: string | null; domain: string; phones: string[]; emails: string[]; whatsapp: string | null;
  linkedin: string | null; instagram: string | null; facebook: string | null; youtube: string | null;
  location: string | null; city: string | null; state: string | null; country: string | null;
  employees: string | null; products: string | null; contacts: string | null;
  source: "Tavily web search"; sourceUrl: string; retrievedAt: string; verified: boolean; completeness: number;
}

const uniq = (a: string[]) => [...new Set(a)];
const social = (text: string, host: string) => text.match(new RegExp(`https?://(?:[a-z]+\\.)?${host}/[^\\s)"'<>]+`, "i"))?.[0] ?? null;

export function extractContacts(text: string) {
  const emails = uniq((text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).map(e => e.toLowerCase())).filter(e => !/\.(png|jpe?g|svg|webp)$/.test(e));
  const phones = uniq((text.match(/\+?\d[\d\s().-]{8,}\d/g) ?? []).map(p => p.replace(/\s+/g, " ").trim()).filter(p => { const d = p.replace(/\D/g, ""); return d.length >= 10 && d.length <= 15 && !/^\d{4}[-.]\d{2}[-.]\d{2}/.test(p); }));
  const wa = text.match(/whats\s?app[^\d+]{0,20}(\+?\d[\d\s-]{8,}\d)/i)?.[1]?.trim() ?? null;
  return { emails, phones, whatsapp: wa };
}

export const COMPLETENESS_FIELDS = ["name", "phone", "email", "website", "address", "industry", "employees", "linkedin"] as const;

export function toLeadProfile(r: LiveResult, query: string, analysis?: Intelligence): LeadProfile {
  const f = analysis?.facts;
  const text = `${r.description} ${f?.contacts?.value ?? ""}`;
  const c = extractContacts(text);
  const d = discoveryDetails(r, query);
  const city = f?.headquartersCity?.value ?? null, state = f?.headquartersRegion?.value ?? null, country = f?.headquartersCountry?.value ?? null;
  const location = [city, state, country].filter(Boolean).join(", ") || null;
  const p: Omit<LeadProfile, "completeness"> = {
    id: `live:${r.domain}`, name: f?.name?.value ?? r.name, industry: f?.industry?.value ?? d.industry,
    description: f?.overview?.value ?? (r.description.replace(/#{1,6}\s*/g, "").replace(/[\uE000-\uF8FF]/g, "").trim() || null),
    website: r.website || null, domain: r.domain, phones: c.phones, emails: c.emails, whatsapp: c.whatsapp,
    linkedin: social(text, "linkedin\\.com"), instagram: social(text, "instagram\\.com"), facebook: social(text, "facebook\\.com"), youtube: social(text, "youtube\\.com"),
    location, city, state, country, employees: f?.size?.value ?? null, products: f?.products?.value ?? null, contacts: f?.contacts?.value ?? null,
    source: "Tavily web search", sourceUrl: r.sourceUrl, retrievedAt: analysis?.analyzedAt ?? r.fetchedAt, verified: !!analysis,
  };
  const have = [!!p.name, p.phones.length > 0, p.emails.length > 0, !!p.website, !!p.location, !!p.industry, !!p.employees, !!p.linkedin];
  return { ...p, completeness: Math.round((have.filter(Boolean).length / have.length) * 100) };
}

export const EXPORT_COLUMNS: [string, (p: LeadProfile) => string][] = [
  ["Company Name", p => p.name], ["Category", p => p.industry ?? ""], ["Industry", p => p.industry ?? ""],
  ["Phone", p => p.phones.join("; ")], ["Email", p => p.emails.join("; ")], ["Website", p => p.website ?? ""],
  ["Contact Person", () => ""], ["Designation", () => ""], ["Employee Count", p => p.employees ?? ""], ["Company Size", p => p.employees ?? ""],
  ["Address", p => p.location ?? ""], ["City", p => p.city ?? ""], ["State", p => p.state ?? ""], ["Country", p => p.country ?? ""],
  ["LinkedIn", p => p.linkedin ?? ""], ["Instagram", p => p.instagram ?? ""], ["Facebook", p => p.facebook ?? ""], ["WhatsApp", p => p.whatsapp ?? ""],
  ["Business Description", p => p.description ?? ""], ["Data Source", p => p.source], ["Source URL", p => p.sourceUrl],
  ["Data Retrieval Date", p => p.retrievedAt], ["Data Completeness", p => `${p.completeness}%`],
];

export function leadsToCsv(list: LeadProfile[]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [EXPORT_COLUMNS.map(c => c[0]), ...list.map(p => EXPORT_COLUMNS.map(c => c[1](p)))].map(r => r.map(esc).join(",")).join("\n");
}

export async function leadsToXlsx(list: LeadProfile[]): Promise<Blob> {
  const { default: writeXlsxFile } = await import("write-excel-file");
  const data = [EXPORT_COLUMNS.map(c => ({ value: c[0], fontWeight: "bold" as const })), ...list.map(p => EXPORT_COLUMNS.map(c => ({ value: c[1](p) })))];
  return (await writeXlsxFile(data, {})) as unknown as Blob;
}
