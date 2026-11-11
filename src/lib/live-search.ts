// Live web discovery via Tavily (free tier only). Pure helpers + client fetch.
export interface LiveResult {
  name: string;
  website: string;
  domain: string;
  description: string;
  sourceUrl: string;
  published: string | null;
  fetchedAt: string;
}

export interface TavilyRaw { title?: string; url?: string; content?: string; published_date?: string }

const DIRECTORY = /(linkedin|crunchbase|wikipedia|tracxn|glassdoor|indeed|clutch|goodfirms|medium|youtube|facebook|twitter|x\.com|instagram|reddit|quora|forbes|economictimes|yourstory|inc42|ambitionbox|zaubacorp|justdial|f6s|builtin|g2)\./i;
export const isDirectoryDomain = (domain: string) => DIRECTORY.test(domain + ".") || /(^|\.)ycombinator\.com$/.test(domain);

export function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

/** Turn raw Tavily hits into source-backed records, one per domain. Nothing is invented. */
export function toLiveResults(raw: TavilyRaw[], fetchedAt: string): LiveResult[] {
  const seen = new Set<string>();
  const out: LiveResult[] = [];
  for (const r of raw) {
    if (!r.url || !r.title) continue;
    const domain = domainOf(r.url);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    const isDirectory = isDirectoryDomain(domain);
    out.push({
      name: (r.title.split(/\s[|–—-]\s/)[0] ?? r.title).trim().slice(0, 120),
      website: isDirectory ? "" : `https://${domain}`,
      domain,
      description: (r.content ?? "").trim().slice(0, 400),
      sourceUrl: r.url,
      published: r.published_date ?? null,
      fetchedAt,
    });
  }
  return out;
}

export async function liveSearch(query: string, signal?: AbortSignal): Promise<LiveResult[]> {
  const res = await fetch("/api/live-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal: signal ?? null,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Live search failed."), { status: res.status });
  return data.results as LiveResult[];
}
