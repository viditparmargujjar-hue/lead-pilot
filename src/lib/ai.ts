// Deterministic demo "AI": interprets search text and scores companies.
import { companies, getResearch, type Company } from "./data";

export interface Criteria {
  industry?: string;
  location?: string; // city or country
  minEmp?: number;
  maxEmp?: number;
  relevance?: string[];
  growth?: boolean;
  inferred?: Array<"employees" | "growth">; // fields the AI inferred rather than the user stating them
}

export interface Breakdown {
  industry: number;
  location: number;
  size: number;
  relevance: number;
}

export interface ScoredLead {
  company: Company;
  score: number;
  label: Label;
  breakdown: Breakdown;
  why: string;
}

export type Label = "Hot" | "Warm" | "Potential" | "Low Match";

const INDUSTRY_KEYS: Record<string, string[]> = {
  SaaS: ["saas", "b2b software", "software companies", "software company"],
  Fintech: ["fintech", "finance", "payments", "banking", "lending"],
  Healthtech: ["health", "healthtech", "medical", "clinic"],
  "E-commerce": ["ecommerce", "e-commerce", "retail", "online store"],
  Logistics: ["logistics", "freight", "delivery", "shipping"],
  Cybersecurity: ["security", "cybersecurity", "cyber"],
  Edtech: ["edtech", "education", "learning"],
  Cleantech: ["cleantech", "energy", "solar", "climate"],
  Marketing: ["marketing", "agency", "advertising"],
  AI: [" ai ", "artificial intelligence", "machine learning", "genai"],
};

const RELATED: Record<string, string[]> = {
  SaaS: ["AI", "Fintech", "Healthtech", "Edtech"],
  Fintech: ["SaaS"],
  AI: ["SaaS"],
  Marketing: ["E-commerce"],
  "E-commerce": ["Marketing", "Logistics"],
};

const RELEVANCE_KEYS: Record<string, string[]> = {
  "CRM / business software": ["crm", "sales", "customer relationship", "business software"],
  Payments: ["payment", "billing"],
  "HR / payroll": ["hr", "payroll", "hiring software"],
  Security: ["security", "compliance"],
  Analytics: ["analytics", "data"],
  Marketing: ["marketing tool", "marketing automation", "advertis"],
  Cloud: ["cloud", "infrastructure"],
};
const RELEVANCE_TAGS: Record<string, string[]> = {
  "CRM / business software": ["crm", "sales", "business software", "support"],
  Payments: ["payments"],
  "HR / payroll": ["hr", "payroll"],
  Security: ["security", "identity"],
  Analytics: ["analytics"],
  Marketing: ["marketing", "advertising"],
  Cloud: ["cloud"],
};

const LOCATIONS = Array.from(
  new Set(companies.flatMap((c) => [c.city, c.country])),
).concat(["USA", "UK", "Europe", "Asia"]);
const ALIASES: Record<string, string> = { USA: "United States", UK: "United Kingdom" };

export function interpret(text: string): Criteria {
  const t = ` ${text.toLowerCase().replace(/[^\w\s\-–]/g, " ")} `;
  const c: Criteria = {};
  for (const [ind, keys] of Object.entries(INDUSTRY_KEYS)) {
    if (keys.some((k) => t.includes(k.startsWith(" ") ? k : ` ${k}`))) {
      c.industry = ind;
      break;
    }
  }
  for (const loc of LOCATIONS) {
    if (new RegExp(`\\b${loc.toLowerCase()}\\b`).test(t)) {
      c.location = ALIASES[loc] ?? loc;
      // prefer city over country: keep scanning only if this was a country
      if (companies.some((co) => co.city === c.location)) break;
    }
  }
  const range = t.match(/(\d[\d,]*)\s*(?:-|–|to)\s*(\d[\d,]*)/);
  if (range) {
    c.minEmp = parseInt((range[1] ?? "0").replace(/,/g, ""));
    c.maxEmp = parseInt((range[2] ?? "0").replace(/,/g, ""));
  } else {
    const over = t.match(/(?:over|more than|above|\+)\s*(\d+)|(\d+)\s*\+/);
    const under = t.match(/(?:under|less than|below|fewer than)\s*(\d+)/);
    if (over) c.minEmp = parseInt(over[1] ?? over[2] ?? "0");
    if (under) c.maxEmp = parseInt(under[1] ?? "0");
  }
  const rel = Object.entries(RELEVANCE_KEYS)
    .filter(([, keys]) => keys.some((k) => t.includes(k)))
    .map(([r]) => r);
  if (rel.length) c.relevance = rel;
  if (/\b(growing|fast-growing|high-growth|scaling|expanding|hiring|growth)\b/.test(t)) c.growth = true;
  if (/\bstart-?ups?\b/.test(t)) {
    const inf: Array<"employees" | "growth"> = [];
    if (!c.growth) { c.growth = true; inf.push("growth"); }
    if (c.minEmp == null && c.maxEmp == null) { c.maxEmp = 200; inf.push("employees"); }
    if (inf.length) c.inferred = inf;
  }
  return c;
}

const hash = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7);

export function labelFor(score: number): Label {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Potential";
  return "Low Match";
}

export function weightedScore(b: Breakdown): number {
  return Math.round(b.industry * 0.3 + b.location * 0.25 + b.size * 0.2 + b.relevance * 0.25);
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function scoreCompany(co: Company, c: Criteria): ScoredLead {
  const jitter = hash(co.id) % 9; // deterministic neutral variance when a criterion is not specified
  let industry = 72 + jitter;
  if (c.industry) {
    industry = co.industry === c.industry ? 100 : RELATED[c.industry]?.includes(co.industry) ? 55 : 15;
  }

  let location = 70 + jitter;
  if (c.location) {
    const targetIsCity = companies.some((x) => x.city === c.location);
    if (co.city === c.location) location = 100;
    else if (co.country === c.location) location = targetIsCity ? 90 : 100;
    else if (co.region === c.location) location = 85;
    else if (companies.some((x) => x.city === c.location && x.country === co.country)) location = 65;
    else location = 15;
  }

  let size = 70 + jitter;
  if (c.minEmp != null || c.maxEmp != null) {
    const min = Math.max(1, c.minEmp ?? 1);
    const max = c.maxEmp ?? Infinity;
    if (co.employees >= min && co.employees <= max) {
      // Inside the range: closer to the middle (log scale) scores higher, edges ~90.
      if (!isFinite(max)) size = 100;
      else {
        const span = Math.log(max / min) / 2 || 1;
        const mid = Math.log(min) + span;
        size = clamp(100 - (Math.abs(Math.log(co.employees) - mid) / span) * 10);
      }
    } else {
      const ratio = co.employees < min ? min / co.employees : co.employees / max;
      size = Math.max(10, Math.round(85 - Math.log2(ratio) * 40));
    }
  }

  let relevance = 60 + jitter * 2;
  if (c.relevance?.length) {
    const tags = c.relevance.flatMap((r) => RELEVANCE_TAGS[r] ?? []);
    const hits = co.tags.filter((t) => tags.includes(t)).length;
    relevance = hits >= 2 ? 100 : hits === 1 ? 82 : 35;
  }

  if (c.growth) {
    const sig = getResearch(co.id)?.signals ?? [];
    const g = sig.filter((x) => x === "Growth" || x === "Hiring" || x === "Expansion").length;
    relevance = relevance + (g >= 2 ? 12 : g === 1 ? 5 : -15);
  }
  const breakdown = { industry: clamp(industry), location: clamp(location), size: clamp(size), relevance: clamp(relevance) };
  const score = weightedScore(breakdown);
  return { company: co, score, label: labelFor(score), breakdown, why: explain(co, breakdown, c) };
}

function explain(co: Company, b: Breakdown, c: Criteria): string {
  const base = explainBase(co, b, c);
  if (!c.growth) return base;
  const sig = (getResearch(co.id)?.signals ?? []).filter((x) => x !== "New product");
  return sig.length ? `${base} Shows growth signals (${sig.join(", ").toLowerCase()}).` : `${base} No clear growth signals yet.`;
}

function explainBase(co: Company, b: Breakdown, c: Criteria): string {
  const ind = c.industry ? `your target ${c.industry} industry` : `a relevant ${co.industry} profile`;
  const loc = c.location ? `${c.location} location` : "location";
  const iS = b.industry >= 85, lS = b.location >= 85, sS = b.size >= 85, rS = b.relevance >= 85;
  if (iS && lS && sS) {
    return `Excellent match for your search. The company matches ${ind} and ${loc}, with a strong company-size fit (${co.employees} employees)${rS ? " and high business relevance" : ""}.`;
  }
  if (iS && lS && !sS) return `Industry and location are strong matches, but the employee range (${co.employees}) is outside your preferred range.`;
  if (iS && !lS && sS) return `The company matches ${ind} and company size, but its location (${co.city}, ${co.country}) is a weaker match.`;
  if (iS && !lS) return `The company matches ${ind}, but its location (${co.city}) and company size are weaker matches.`;
  if (!iS && lS && sS) return `Strong location and company-size fit, but its industry (${co.industry}) differs from your target.`;
  if (!iS && lS) return `Located in your target area, but industry (${co.industry}) and size are weaker matches.`;
  if (rS) return `Relevant business focus, though industry and location differ from your target.`;
  return `Partial fit — industry, location and size only loosely match. Consider only to broaden your search.`;
}

export function explainFromBreakdown(co: Company, b: Breakdown, c: Criteria): string {
  return explain(co, b, c);
}

export function search(c: Criteria): ScoredLead[] {
  return companies.map((co) => scoreCompany(co, c)).sort((a, b) => b.score - a.score);
}

export function whyResults(c: Criteria): string {
  const stated: string[] = [];
  if (c.industry) stated.push("industry");
  if (c.location) stated.push("location");
  if ((c.minEmp != null || c.maxEmp != null) && !c.inferred?.includes("employees")) stated.push("company size");
  const extra: string[] = [];
  if (c.relevance?.length) extra.push("business need");
  if (c.growth) extra.push("growth signals");
  if (c.inferred?.includes("employees")) extra.push("startup-sized teams");
  if (!stated.length && !extra.length) return "No specific criteria were detected, so companies are ranked by general fit.";
  let s = stated.length ? `These companies were prioritized because they match your requested ${stated.join(" and ")}` : "These companies were prioritized";
  if (extra.length) s += `${stated.length ? ", with additional relevance based on " : " based on "}${extra.join(" and ")}`;
  return s + ".";
}

export function explainSearch(text: string, c: Criteria): string {
  const parts: string[] = [];
  parts.push(`${c.growth && !c.inferred?.includes("growth") ? "growing " : ""}${c.industry ? `${c.industry} companies` : "companies across industries"}`);
  if (c.location) parts.push(`in ${c.location}`);
  if (c.minEmp != null && c.maxEmp != null) parts.push(`with ${c.minEmp}–${c.maxEmp} employees`);
  else if (c.minEmp != null) parts.push(`with ${c.minEmp}+ employees`);
  else if (c.maxEmp != null && !c.inferred?.includes("employees")) parts.push(`with under ${c.maxEmp} employees`);
  let s = `You are looking for ${parts.join(" ")}`;
  if (c.relevance?.length) s += ` that may need ${c.relevance.join(", ")}`;
  s += ".";
  if (!text.trim()) s = "No description given — showing all demo companies ranked by general fit.";
  else if (c.inferred?.length) s += " As this mentions startups, I assumed smaller, growing teams (AI inference).";
  return s;
}

// Baseline profile used for dashboard and research when no search has been made.
export const DEFAULT_CRITERIA: Criteria = interpret(
  "growing SaaS companies in India with 50-500 employees that may need CRM software",
);
