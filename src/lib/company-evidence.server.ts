import { domainOf, isDirectoryDomain } from "./live-search";
import type { EvidencePage } from "./intelligence";

const cache = new Map<string, { at: number; pages: EvidencePage[] }>();
export async function companyEvidence(website: string, name: string): Promise<EvidencePage[]> {
  const domain = domainOf(website);
  if (!domain || isDirectoryDomain(domain)) throw new Error("This is a directory or article, not an identified company website. Choose a company site.");
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < 15 * 60000) return hit.pages;
  const key = process.env["TAVILY_API_KEY"];
  if (!key) throw new Error("Tavily research is not configured.");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query: `site:${domain} company about us contact headquarters office locations products services latest news`, include_domains: [domain], search_depth: "basic", auto_parameters: false, max_results: 6, include_raw_content: "text" }),
    signal: AbortSignal.timeout(20000),
  });
  if ([402, 432, 433].includes(res.status)) throw new Error("Your free Tavily quota is used up. No paid fallback is used; research resumes when the free allowance resets.");
  if (res.status === 429) throw new Error("Tavily rate limit reached. Please wait before researching again.");
  if (!res.ok) throw new Error("Tavily company research is unavailable. No analysis was generated.");
  const body = await res.json() as { results?: Array<{ url?: string; raw_content?: string | null; published_date?: string }> };
  const pages = (body.results ?? []).flatMap(r => {
    const host = domainOf(r.url ?? "");
    return r.url && r.raw_content && (host === domain || host.endsWith(`.${domain}`)) ? [{ url: r.url, text: r.raw_content.slice(0, 18000), published: r.published_date ?? null, official: true }] : [];
  });
  if (cache.size >= 100) cache.clear();
  cache.set(domain, { at: Date.now(), pages });
  return pages;
}