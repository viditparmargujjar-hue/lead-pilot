import { createFileRoute, Link } from "@tanstack/react-router";
import { useHistory } from "@/lib/history";
import { Loader2, Sparkles, Search, X, RotateCcw, SlidersHorizontal, AlertTriangle, Phone, Mail, Globe, Linkedin, CheckCheck, BookmarkPlus, BookmarkX, Download, UsersRound } from "lucide-react";
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
import { toLeadProfile, availableProfileFields, leadsToCsv, leadsToXlsx } from "@/lib/lead-profile";
import { getLiveAnalysis } from "@/lib/data";
import { SAVED_LEAD_STATUSES, type Status } from "@/lib/store";

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

function downloadFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function FindLeads() {
  const { setSearch, isSaved, toggleSave, saveMany, setStatus } = useStore();
  const saveLive = (r: LiveResult) => { const id = registerLiveCompany({ ...r, query: live?.q ?? text }); const added = toggleSave(id); toast.success(added ? `${r.name} saved to My Leads` : `${r.name} removed from My Leads`); };
  const history = useHistory();
  const { q: initialQ, t } = Route.useSearch();
  const [text, setText] = useState(initialQ ?? "");
  const request = useRef<AbortController | null>(null);
  const requestQuery = useRef<string | null>(null);
  const [live, setLive] = useState<{ q: string; results: LiveResult[] | null; error: string | null; loading: boolean } | null>(null);

  useEffect(() => {
    if (initialQ?.trim()) { setText(initialQ); void submit(initialQ); }
    return () => request.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, t]);

  const submit = (input: string) => runLive(input);
  const [lf, setLf] = useState({ keyword: "", site: "", status: "", industry: "", location: "", completeness: "", contact: "" });
  const [sortBy, setSortBy] = useState("recent");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<Status>("Contacted");
  const [exportBusy, setExportBusy] = useState(false);
  const profiles = useMemo(() => (live?.results ?? []).map(r => {
    const analysis = getLiveAnalysis(`live:${r.domain}`);
    const matchingAnalysis = analysis?.criteria.trim().toLowerCase() === (live?.q ?? "").trim().toLowerCase() ? analysis : undefined;
    return toLeadProfile(r, live?.q ?? "", matchingAnalysis);
  }), [live]);
  const fieldAvailability = useMemo(() => availableProfileFields(profiles), [profiles]);
  const industries = useMemo(() => [...new Set(profiles.map(p => p.industry).filter((v): v is string => !!v))].sort(), [profiles]);
  const liveVisible = useMemo(() => (live?.results ?? []).filter(r => {
    const k = lf.keyword.trim().toLowerCase();
    if (k && !`${r.name} ${r.description} ${r.domain}`.toLowerCase().includes(k)) return false;
    if (lf.site === "official" && !r.website) return false;
    if (lf.site === "directory" && r.website) return false;
    const profile = profiles.find(p => p.id === `live:${r.domain}`);
    if (!profile) return false;
    if (lf.industry && profile.industry !== lf.industry) return false;
    if (lf.location && !`${profile.location ?? ""} ${profile.city ?? ""} ${profile.state ?? ""} ${profile.country ?? ""} ${r.description}`.toLowerCase().includes(lf.location.trim().toLowerCase())) return false;
    if (lf.completeness === "50" && profile.completeness < 50) return false;
    if (lf.completeness === "75" && profile.completeness < 75) return false;
    if (lf.completeness === "100" && profile.completeness < 100) return false;
    if (lf.contact === "phone" && !profile.phones.length) return false;
    if (lf.contact === "email" && !profile.emails.length) return false;
    if (lf.contact === "website" && !profile.website) return false;
    if (lf.contact === "linkedin" && !profile.linkedin) return false;
    if (lf.contact === "whatsapp" && !profile.whatsapp) return false;
    const sv = isSaved(`live:${r.domain}`);
    if (lf.status === "saved" && !sv) return false;
    if (lf.status === "unsaved" && sv) return false;
    return true;
  }), [live, lf, isSaved, profiles]);
  const orderedResults = useMemo(() => [...liveVisible].sort((a, b) => {
    const pa = profiles.find(p => p.id === `live:${a.domain}`);
    const pb = profiles.find(p => p.id === `live:${b.domain}`);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "completeness") return (pb?.completeness ?? 0) - (pa?.completeness ?? 0);
    if (sortBy === "largest") return (Number(pb?.employees?.match(/\d[\d,.]*/)?.[0].replace(/[,\.]/g, "")) || 0) - (Number(pa?.employees?.match(/\d[\d,.]*/)?.[0].replace(/[,\.]/g, "")) || 0);
    if (sortBy === "smallest") return (Number(pa?.employees?.match(/\d[\d,.]*/)?.[0].replace(/[,\.]/g, "")) || 0) - (Number(pb?.employees?.match(/\d[\d,.]*/)?.[0].replace(/[,\.]/g, "")) || 0);
    return Date.parse(b?.fetchedAt ?? "") - Date.parse(a?.fetchedAt ?? "");
  }), [liveVisible, profiles, sortBy]);
  const selectedVisible = orderedResults.filter(r => selected.includes(`live:${r.domain}`));
  const selectedSaved = selectedVisible.filter(r => isSaved(`live:${r.domain}`));
  const allVisibleSelected = orderedResults.length > 0 && orderedResults.every(r => selected.includes(`live:${r.domain}`));
  const summaryProfiles = profiles;
  const summary = {
    total: summaryProfiles.length,
    phone: summaryProfiles.filter(p => p.phones.length > 0).length,
    email: summaryProfiles.filter(p => p.emails.length > 0).length,
    website: summaryProfiles.filter(p => !!p.website).length,
    linkedin: summaryProfiles.filter(p => !!p.linkedin).length,
    contact: summaryProfiles.filter(p => p.phones.length > 0 && p.emails.length > 0).length,
  };

  const exportResults = async (rows: LiveResult[], format: "csv" | "xlsx") => {
    if (!rows.length) return;
    const data = rows.map(r => {
      const analysis = getLiveAnalysis(`live:${r.domain}`);
      const matchingAnalysis = analysis?.criteria.trim().toLowerCase() === (live?.q ?? "").trim().toLowerCase() ? analysis : undefined;
      return toLeadProfile(r, live?.q ?? "", matchingAnalysis);
    });
    const slug = (live?.q ?? "leads").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "leads";
    if (format === "csv") downloadFile(new Blob([leadsToCsv(data)], { type: "text/csv;charset=utf-8" }), `${slug}-leads.csv`);
    else {
      setExportBusy(true);
      try { downloadFile(await leadsToXlsx(data), `${slug}-leads.xlsx`); }
      catch { toast.error("Excel export could not be prepared. Try CSV instead."); }
      finally { setExportBusy(false); }
    }
  };

  const runLive = async (input: string) => {
    const q = normalizeQuery(input);
    if (request.current && !request.current.signal.aborted && requestQuery.current === q) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    requestQuery.current = q;
    setText(q);
    setSelected([]);
    setSearch(q, {});
    if (!q) { setLive(null); return; }
    setLive({ q, results: null, error: null, loading: true });
    try {
      const fetched = await liveSearch(q, controller.signal);
      const results = relevantLiveResults(fetched, q);
      if (!controller.signal.aborted) { setLive({ q, results, error: null, loading: false }); history.add({ query: q, criteria: {}, count: results.length }); }
    } catch (err) {
      if (!controller.signal.aborted) setLive({ q, results: null, error: (err as Error).message, loading: false });
    } finally {
      if (request.current === controller) { request.current = null; requestQuery.current = null; }
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

      {(
        <div className="mt-6 space-y-4">
          {live?.loading && <div role="status" className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Searching the live web…</div>}
          {live?.error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-card p-3 text-sm"><AlertTriangle className="h-4 w-4 shrink-0 text-destructive" /><div className="min-w-0 flex-1"><p className="font-medium">Live search unavailable</p><p className="text-muted-foreground">{live.error} No substitute results are shown.</p></div><Button size="sm" variant="outline" onClick={() => void submit(live.q)}>Retry</Button></div>}
          {live?.results && (
            <>
              <section aria-label="Search results summary" className="space-y-4 border-y py-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 aria-live="polite" className="text-lg font-semibold">{liveVisible.length} of {live.results.length} results</h2><p className="mt-1 break-words text-sm text-muted-foreground">“{live.q}” · Tavily web search · {new Date(live.results[0]?.fetchedAt ?? Date.now()).toLocaleString()}</p></div><span className="rounded-md border px-2.5 py-1 text-xs">Web excerpts · not verified facts</span></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{[{ label: "Total results", value: summary.total, icon: UsersRound }, { label: "With phone", value: summary.phone, icon: Phone }, { label: "With email", value: summary.email, icon: Mail }, { label: "With website", value: summary.website, icon: Globe }, { label: "With LinkedIn", value: summary.linkedin, icon: Linkedin }, { label: "Phone + email", value: summary.contact, icon: CheckCheck }].map(item => <div key={item.label} className="min-w-0 border-l-2 border-primary/40 px-3 py-2"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><item.icon className="h-3.5 w-3.5 shrink-0" />{item.label}</div><p className="mt-1 text-xl font-semibold tabular-nums">{item.value}</p></div>)}</div>
              </section>
              <p className="text-xs text-muted-foreground">Search excerpts are not verified company facts. Open Research for full-page evidence, cited company details and optional AI analysis.</p>
              <div className="grid min-w-0 gap-3 border-y py-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1 text-xs text-muted-foreground">Keyword in source text<input aria-label="Keyword in source text" className={sel} value={lf.keyword} placeholder="Company or phrase" onChange={e => setLf(p => ({ ...p, keyword: e.target.value }))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Result type<select aria-label="Site type" className={sel} value={lf.site} onChange={e => setLf(p => ({ ...p, site: e.target.value }))}><option value="">All results</option><option value="official">Company website candidates</option><option value="directory">Directories / articles</option></select></label>
                <label className="space-y-1 text-xs text-muted-foreground">Saved status<select aria-label="Lead status" className={sel} value={lf.status} onChange={e => setLf(p => ({ ...p, status: e.target.value }))}><option value="">Any status</option><option value="saved">Saved</option><option value="unsaved">Not saved</option></select></label>
                {fieldAvailability.industry && <label className="space-y-1 text-xs text-muted-foreground">Industry from available results<select aria-label="Filter by industry" className={sel} value={lf.industry} onChange={e => setLf(p => ({ ...p, industry: e.target.value }))}><option value="">All industries</option>{industries.map(i => <option key={i}>{i}</option>)}</select></label>}
                <label className="space-y-1 text-xs text-muted-foreground">Location in returned data<input aria-label="Filter by location" className={sel} placeholder="City, state, country" value={lf.location} onChange={e => setLf(p => ({ ...p, location: e.target.value }))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Data completeness<select aria-label="Filter by data completeness" className={sel} value={lf.completeness} onChange={e => setLf(p => ({ ...p, completeness: e.target.value }))}><option value="">Any completeness</option><option value="50">50% or more</option><option value="75">75% or more</option><option value="100">Complete profiles</option></select></label>
                <label className="space-y-1 text-xs text-muted-foreground">Available contact detail<select aria-label="Filter by contact detail" className={sel} value={lf.contact} onChange={e => setLf(p => ({ ...p, contact: e.target.value }))}><option value="">Any contact detail</option>{fieldAvailability.phone && <option value="phone">Has phone</option>}{fieldAvailability.email && <option value="email">Has email</option>}{fieldAvailability.website && <option value="website">Has website</option>}{fieldAvailability.linkedin && <option value="linkedin">Has LinkedIn</option>}{fieldAvailability.whatsapp && <option value="whatsapp">Has WhatsApp</option>}</select></label>
                <label className="space-y-1 text-xs text-muted-foreground">Sort results<select aria-label="Sort results" className={sel} value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="recent">Recently retrieved</option><option value="name-asc">Company name A–Z</option><option value="name-desc">Company name Z–A</option><option value="largest">Largest companies</option><option value="smallest">Smallest companies</option><option value="completeness">Most complete profiles</option></select></label>
                <div className="flex items-end"><Button variant="outline" onClick={() => setLf({ keyword: "", site: "", status: "", industry: "", location: "", completeness: "", contact: "" })} className="h-10 w-full"><RotateCcw />Reset filters</Button></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-y py-3">
                <label className="flex items-center gap-2 pr-2 text-sm"><input type="checkbox" aria-label="Select all visible leads" checked={allVisibleSelected} onChange={e => setSelected(current => e.target.checked ? [...new Set([...current, ...orderedResults.map(r => `live:${r.domain}`)])] : current.filter(id => !orderedResults.some(r => id === `live:${r.domain}`)))} className="h-4 w-4 accent-primary" />Select all visible</label>
                <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                <Button size="sm" variant="outline" disabled={!selectedVisible.length} onClick={() => { const ids = selectedVisible.map(r => registerLiveCompany({ ...r, query: live.q })); saveMany(ids); toast.success(`${ids.length} selected leads saved`); }}><BookmarkPlus />Save selected</Button>
                <Button size="sm" variant="outline" disabled={!selectedSaved.length} onClick={() => { selectedSaved.forEach(r => toggleSave(`live:${r.domain}`)); toast.success(`${selectedSaved.length} saved leads removed`); }}><BookmarkX />Remove saved</Button>
                <label className="flex items-center gap-2"><span className="sr-only">Selected lead status</span><select aria-label="Set selected lead status" className="h-8 rounded-md border bg-card px-2 text-xs" value={bulkStatus} onChange={e => setBulkStatus(e.target.value as Status)}>{SAVED_LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}</select><Button size="sm" variant="outline" disabled={!selectedSaved.length} onClick={() => { selectedSaved.forEach(r => setStatus(`live:${r.domain}`, bulkStatus)); toast.success(`Updated ${selectedSaved.length} saved leads`); }}>Set status</Button></label>
                <Button size="sm" variant="outline" disabled={!selectedVisible.length || exportBusy} onClick={() => void exportResults(selectedVisible, "csv")}><Download />Selected CSV</Button>
                <Button size="sm" variant="outline" disabled={!selectedVisible.length || exportBusy} onClick={() => void exportResults(selectedVisible, "xlsx")}><Download />Selected Excel</Button>
                <Button size="sm" variant="outline" disabled={!orderedResults.length || exportBusy} onClick={() => void exportResults(orderedResults, "csv")}><Download />All CSV</Button>
                <Button size="sm" variant="outline" disabled={!orderedResults.length || exportBusy} onClick={() => void exportResults(orderedResults, "xlsx")}><Download />All Excel</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear selection</Button>
              </div>
              {liveVisible.length === 0 ? <p className="border-y p-8 text-center text-sm text-muted-foreground">No leads found. Try changing your search query or filters.</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{orderedResults.map(r => <LiveResultCard key={r.domain} result={r} query={live.q} saved={isSaved(`live:${r.domain}`)} onSave={() => saveLive(r)} selected={selected.includes(`live:${r.domain}`)} onSelect={checked => setSelected(current => checked ? [...new Set([...current, `live:${r.domain}`])] : current.filter(id => id !== `live:${r.domain}`))} />)}</div>}
            </>
          )}
        </div>
      )}

      <CompareBar />
    </>
  );
}
