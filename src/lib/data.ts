import type { Intelligence } from "./intelligence";
// Fictional demo companies. Not real-world verified information.
export type Confidence = "High" | "Medium" | "Limited data";
export type Signal = "Hiring" | "Expansion" | "New product" | "Growth";

export interface Company {
  id: string;
  name: string;
  industry: string;
  city: string;
  country: string;
  region: string;
  employees: number;
  website: string;
  tags: string[]; // relevance keywords
}

export interface Research {
  companyId: string;
  summary: string;
  signals: Signal[];
  potentialNeed: string;
  confidence: Confidence;
}

type Row = [string, string, string, string, string, number, string[], string, Signal[], string, Confidence];

const rows: Row[] = [
  ["CloudNova Technologies", "SaaS", "Bengaluru", "India", "Asia", 120, ["crm", "sales", "business software", "cloud"], "Builds cloud workflow tools for mid-sized sales teams.", ["Hiring", "Growth"], "Likely needs a scalable CRM to manage a fast-growing sales pipeline.", "High"],
  ["Stackwise Labs", "SaaS", "Pune", "India", "Asia", 260, ["analytics", "business software", "crm"], "Offers product analytics dashboards for B2B software companies.", ["New product"], "May need customer data tooling as it launches new modules.", "High"],
  ["Orbitly Software", "SaaS", "Hyderabad", "India", "Asia", 85, ["hr", "business software"], "Provides HR onboarding software for small and mid-sized firms.", ["Hiring"], "Could benefit from sales automation to support outbound growth.", "Medium"],
  ["Tidewave Systems", "SaaS", "Chennai", "India", "Asia", 410, ["crm", "support", "business software"], "Customer support ticketing platform with growing enterprise base.", ["Expansion", "Growth"], "Expanding teams may need better pipeline and account management.", "High"],
  ["Brightpath Cloud", "SaaS", "Mumbai", "India", "Asia", 35, ["marketing", "business software"], "Email marketing tool for e-commerce brands.", [], "Possible need for lead management as customer base grows.", "Limited data"],
  ["Ledgerly Pay", "Fintech", "London", "United Kingdom", "Europe", 340, ["payments", "finance", "business software"], "Payment reconciliation platform for online merchants.", ["Hiring", "Expansion"], "May need compliance and customer onboarding tools for new markets.", "High"],
  ["Northbank Digital", "Fintech", "London", "United Kingdom", "Europe", 780, ["banking", "finance", "security"], "Digital banking infrastructure for small businesses.", ["Growth"], "Likely evaluating security and fraud-prevention solutions.", "Medium"],
  ["Coinlane", "Fintech", "Manchester", "United Kingdom", "Europe", 150, ["payments", "crypto", "finance"], "Cross-border payment app for freelancers.", ["New product"], "Could need customer support and CRM tooling for new users.", "Medium"],
  ["Finvera", "Fintech", "Bengaluru", "India", "Asia", 220, ["payments", "lending", "finance", "crm"], "SME lending platform with automated credit scoring.", ["Hiring", "Growth"], "Growing loan book may require better borrower relationship management.", "High"],
  ["Quantia Capital Tech", "Fintech", "Berlin", "Germany", "Europe", 95, ["investing", "finance", "analytics"], "Portfolio analytics for independent wealth managers.", [], "May need data integration tools.", "Limited data"],
  ["MediSync Health", "Healthtech", "Boston", "United States", "North America", 300, ["healthcare", "scheduling", "business software"], "Patient scheduling and clinic management software.", ["Expansion"], "Could need CRM to manage clinic partner relationships.", "Medium"],
  ["CareLoop", "Healthtech", "Bengaluru", "India", "Asia", 140, ["healthcare", "telemedicine"], "Telemedicine platform connecting rural patients to doctors.", ["Growth", "Hiring"], "May need support tooling to handle rising patient volume.", "Medium"],
  ["Vitalis Labs", "Healthtech", "Toronto", "Canada", "North America", 60, ["healthcare", "analytics"], "Remote patient monitoring analytics.", [], "Possible need for data compliance tools.", "Limited data"],
  ["ShopRiver", "E-commerce", "Mumbai", "India", "Asia", 520, ["retail", "marketing", "logistics"], "Online marketplace for regional fashion brands.", ["Expansion"], "Likely needs marketing automation and seller CRM.", "Medium"],
  ["Cartology", "E-commerce", "Austin", "United States", "North America", 180, ["retail", "analytics", "marketing"], "Conversion optimization tools for online stores.", ["New product", "Growth"], "May need sales tooling as it moves upmarket.", "High"],
  ["Freightly", "Logistics", "Rotterdam", "Netherlands", "Europe", 450, ["logistics", "supply chain"], "Digital freight brokerage for European shippers.", ["Hiring"], "Could need CRM to manage carrier and shipper accounts.", "Medium"],
  ["RouteMint", "Logistics", "Delhi", "India", "Asia", 210, ["logistics", "delivery", "business software"], "Last-mile delivery route optimization software.", ["Growth", "Expansion"], "Rapid city expansion may need better B2B account management.", "High"],
  ["Shieldcore Security", "Cybersecurity", "Tel Aviv", "Israel", "Middle East", 230, ["security", "cloud"], "Cloud workload protection for mid-market companies.", ["Hiring", "New product"], "May need partner and channel management tools.", "High"],
  ["Cipherline", "Cybersecurity", "San Francisco", "United States", "North America", 900, ["security", "identity"], "Identity and access management platform.", ["Growth"], "Likely evaluating enterprise sales tooling.", "Medium"],
  ["Learnora", "Edtech", "Bengaluru", "India", "Asia", 330, ["education", "business software"], "Upskilling platform for corporate teams.", ["Expansion"], "Could need CRM for managing corporate client renewals.", "Medium"],
  ["Classly", "Edtech", "Singapore", "Singapore", "Asia", 70, ["education", "scheduling"], "Class scheduling tools for tutoring centers.", [], "Possible need for payments and billing tools.", "Limited data"],
  ["Greenvolt Energy", "Cleantech", "Munich", "Germany", "Europe", 610, ["energy", "analytics"], "Solar asset monitoring for commercial buildings.", ["Expansion", "Hiring"], "May need field service and customer management software.", "Medium"],
  ["Pixelforge Studio", "Marketing", "London", "United Kingdom", "Europe", 45, ["marketing", "advertising"], "Performance marketing agency for SaaS brands.", [], "Could need client reporting tools.", "Limited data"],
  ["Adwise Media", "Marketing", "New York", "United States", "North America", 160, ["marketing", "advertising", "analytics"], "Programmatic advertising platform for retailers.", ["New product"], "Likely needs CRM to manage advertiser relationships.", "Medium"],
  ["Peoplestack HR", "SaaS", "Dublin", "Ireland", "Europe", 190, ["hr", "payroll", "business software"], "Payroll and HR software for European SMEs.", ["Growth"], "Could benefit from sales pipeline tooling for new markets.", "High"],
  ["Datanest AI", "AI", "Bengaluru", "India", "Asia", 75, ["ai", "analytics", "business software"], "AI document processing for insurance firms.", ["Hiring", "New product"], "May need CRM as it signs first enterprise customers.", "Medium"],
];

export const companies: Company[] = rows.map((r, i) => ({
  id: `c${i + 1}`,
  name: r[0],
  industry: r[1],
  city: r[2],
  country: r[3],
  region: r[4],
  employees: r[5],
  website: `${r[0].toLowerCase().split(" ")[0]}.example.com`,
  tags: r[6],
}));

export const research: Research[] = rows.map((r, i) => ({
  companyId: `c${i + 1}`,
  summary: r[7],
  signals: r[8],
  potentialNeed: r[9],
  confidence: r[10],
}));

export const getCompany = (id: string): Company | undefined => companies.find((c) => c.id === id) ?? live.get(id);
export const getResearch = (id: string) => research.find((r) => r.companyId === id);

// Live web companies saved from Tavily results. Only sourced fields are filled; unknowns stay "Not stated".
export interface LiveSource { url: string; excerpt: string; fetchedAt: string; query?: string | undefined; websiteCandidate?: boolean }
const LIVE_KEY = "leadpilot-live-companies-v1";
const live = new Map<string, Company & { source: LiveSource; analysis?: Intelligence }>();
export function loadLiveCompanies() {
  try { const raw = localStorage.getItem(LIVE_KEY); if (raw) for (const c of JSON.parse(raw)) if (c?.id?.startsWith("live:")) live.set(c.id, c); } catch { /* ignore unreadable cache */ }
}
export function registerLiveCompany(r: { name: string; website: string; domain: string; description: string; sourceUrl: string; fetchedAt: string; query?: string }) {
  const id = `live:${r.domain}`;
  const prev = live.get(id);
  const keepAnalysis = prev?.source.excerpt === r.description && (!r.query || prev?.source.query === r.query);
  live.set(id, { ...(keepAnalysis && prev?.analysis ? { analysis: prev.analysis } : {}), id, name: r.name, industry: "Not stated", city: "Not stated", country: "", region: "", employees: 0, website: r.website || r.sourceUrl, tags: [], source: { url: r.sourceUrl, excerpt: r.description, fetchedAt: r.fetchedAt, query: r.query ?? prev?.source.query, websiteCandidate: !!r.website } });
  try { localStorage.setItem(LIVE_KEY, JSON.stringify([...live.values()])); } catch { /* storage unavailable */ }
  return id;
}
export const getLiveSource = (id: string) => live.get(id)?.source;
export type LiveAnalysis = Intelligence;
export const getLiveAnalysis = (id: string) => { const a = live.get(id)?.analysis; return a?.version === 2 ? a : undefined; };
export function setLiveAnalysis(id: string, analysis: LiveAnalysis) {
  const c = live.get(id); if (!c) return; live.set(id, { ...c, name: analysis.facts.name?.value ?? c.name, analysis });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("leadpilot-intelligence"));
  try { localStorage.setItem(LIVE_KEY, JSON.stringify([...live.values()])); } catch { /* storage unavailable */ }
}
