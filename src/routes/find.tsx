import { createFileRoute, Link } from "@tanstack/react-router";
import { useHistory } from "@/lib/history";
import { Loader2, SearchX, Sparkles, Search, X, RotateCcw, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { CompareBar } from "@/components/CompareControls";
import { LiveResultCard } from "@/components/LiveResultCard";
import { relevantLiveResults } from "@/lib/live-result-details";
import { Button } from "@/components/ui/button";
import { normalizeQuery } from "@/lib/lead-search";
import { useStore } from "@/lib/store";
import { liveSearch, type LiveResult } from "@/lib/live-search";
import { registerLiveCompany } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Find Leads — LeadPilot AI" },
      { name: "description", content: "Describe the companies you want in plain language and get scored, explained leads." },
      { property: "og:title", content: "Find Leads — LeadPilot AI" },
      { property: "og:description", content: "Natural-language B2B company search with explainable lead scores." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; t?: number | undefined } => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    t: typeof s["t"] === "number" ? s["t"] : undefined,
  }),
  component: FindLeads,
});

const EXAMPLES = [
  "SaaS companies in India with 50–500 employees",
  "Fintech companies in London with 100–1000 employees",
  "Growing AI startups in Bengaluru",
  "E-commerce companies that may need CRM software",
];
const sel = "h-10 min-w-0 w-full rounded-lg border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function FindLeads() {
  const { setSearch, isSaved, toggleSave } = useStore();
  const saveLive = (r: LiveResult) => { const id = registerLiveCompany({ ...r, query: live?.q ?? text }); const added = toggleSave(id); toast.success(added ? `${r.name} saved to My Leads` : `${r.name} removed from My Leads`); };
  const history = useHistory();
  const { q: initialQ, t } = Route.useSearch();
  const [text, setText] = useState(initialQ ?? "");
  const request = useRef<AbortController | null>(null);
  const [live, setLive] = useState<{ q: string; results: LiveResult[] | null; error: string | null; loading: boolean } | null>(null);

  useEffect(() => {
    if (initialQ?.trim()) { setText(initialQ); void submit(initialQ); }
    return () => request.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, t]);

  const submit = (input: string) => runLive(input);
  const [lf, setLf] = useState({ keyword: "", site: "", status: "" });
  const lfActive = Number(!!lf.keyword.trim()) + Number(!!lf.site) + Number(!!lf.status);
  const liveVisible = useMemo(() => (live?.results ?? []).filter(r => {
    const k = lf.keyword.trim().toLowerCase();
    if (k && !`${r.name} ${r.description} ${r.domain}`.toLowerCase().includes(k)) return false;
    if (lf.site === "official" && !r.website) return false;
    if (lf.site === "directory" && r.website) return false;
    const sv = isSaved(`live:${r.domain}`);
    if (lf.status === "saved" && !sv) return false;
    if (lf.status === "unsaved" && sv) return false;
    return true;
  }), [live, lf, isSaved]);

  const runLive = async (input: string) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const q = normalizeQuery(input);
    setText(q);
    setSearch(q, {});
    if (!q) { setLive(null); return; }
    setLive({ q, results: null, error: null, loading: true });
    try {
      const fetched = await liveSearch(q, controller.signal);
      const results = relevantLiveResults(fetched, q);
      if (!controller.signal.aborted) { setLive({ q, results, error: null, loading: false }); history.add({ query: q, criteria: {}, count: results.length }); }
    } catch (err) {
      if (!controller.signal.aborted) setLive({ q, results: null, error: (err as Error).message, loading: false });
    }
  };

  return (
    <>
      <PageHeader title="Find the right companies" description="Describe your ideal customer in plain language. LeadPilot AI searches the live web and shows real, source-backed companies." />

      <form
        onSubmit={(e) => { e.preventDefault(); void submit(text); }}
        className="card-surface p-4 sm:p-5"
      >
        <textarea
          aria-label="Search companies"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Search company name, industry, location, or keywords..."
          className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(text); } }}
        />
        <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Button variant="ghost" size="sm" type="button" key={ex} onClick={() => setText(ex)} className="h-auto whitespace-normal rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {ex.length > 44 ? ex.slice(0, 44) + "…" : ex}
              </Button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="ghost" size="icon" aria-label="Clear search" title="Clear search" onClick={() => { setText(""); setLive(null); }}><X /></Button>
            <Button type="submit" disabled={!!live?.loading} className="h-11 flex-1 px-5 sm:flex-none">{live?.loading ? <Loader2 className="animate-spin" /> : <Search />} {live?.loading ? "Searching…" : "Find Leads"}</Button>
          </div>
        </div>
      </form>

      <details open className="mt-4 border-y py-4">
        <summary className="cursor-pointer text-sm font-medium"><SlidersHorizontal className="mr-2 inline h-4 w-4 text-primary" />Filters{lfActive > 0 && <span className="ml-2 text-primary">({lfActive} active)</span>}</summary>
        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">Keyword in source text
            <input aria-label="Keyword in source text" className={sel} value={lf.keyword} placeholder="e.g. Bengaluru, fintech" onChange={e => setLf(p => ({ ...p, keyword: e.target.value }))} />
          </label>
          <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">Site type
            <select aria-label="Site type" className={sel} value={lf.site} onChange={e => setLf(p => ({ ...p, site: e.target.value }))}><option value="">All results</option><option value="official">Company website candidates</option><option value="directory">Directories / articles</option></select>
          </label>
          <label className="min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground">Lead status
            <select aria-label="Lead status" className={sel} value={lf.status} onChange={e => setLf(p => ({ ...p, status: e.target.value }))}><option value="">Any status</option><option value="saved">Saved</option><option value="unsaved">Not saved</option></select>
          </label>
          <div className="flex items-end"><Button variant="outline" onClick={() => setLf({ keyword: "", site: "", status: "" })} className="h-10 w-full"><RotateCcw />Reset Filters</Button></div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Web results have no verified industry, location or size fields, so filters only check the sourced text and site type.</p>
      </details>

      {(
        <div className="mt-6 space-y-4">
          {live?.loading && <div role="status" className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Searching the live web…</div>}
          {live?.error && <div role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-card p-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><div><p className="font-medium">Live search unavailable</p><p className="text-muted-foreground">{live.error} No substitute results are shown.</p></div></div>}
          {live?.results && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 aria-live="polite" className="text-lg font-semibold">{liveVisible.length} of {live.results.length} web results for “{live.q}”</h2>
                <span className="text-xs text-muted-foreground">Source: Tavily web search · fetched {new Date(live.results[0]?.fetchedAt ?? Date.now()).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Search excerpts are not verified company facts. Open Research for full-page evidence, cited company details and optional AI analysis.</p>
              {liveVisible.length === 0 ? <p className="card-surface p-8 text-center text-sm text-muted-foreground">No web results match. Try different wording or reset filters.</p> : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {liveVisible.map(r => <LiveResultCard key={r.domain} result={r} query={live.q} saved={isSaved(`live:${r.domain}`)} onSave={() => saveLive(r)} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <CompareBar />
    </>
  );
}
