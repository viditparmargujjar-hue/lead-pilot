import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { analyzeLead } from "@/lib/analysis.functions";
import { factKeys, factLabels, type Claim, type Intelligence } from "@/lib/intelligence";
import { getCompany, getLiveAnalysis, getLiveSource, setLiveAnalysis } from "@/lib/data";
import { useStore } from "@/lib/store";

export function EvidenceClaim({ claim, missing = "Not available" }: { claim: Claim | null | undefined; missing?: string }) {
  if (!claim) return <span className="text-muted-foreground">{missing}</span>;
  return <div className="min-w-0 break-words"><p>{claim.value}</p><a href={claim.sourceUrl} target="_blank" rel="noreferrer" title={claim.quote} className="text-xs text-primary underline">Source</a><details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Supporting quote</summary><blockquote className="mt-1 border-l pl-2">{claim.quote}</blockquote></details></div>;
}
export function Temperature({ analysis }: { analysis: Intelligence | undefined }) {
  const t = analysis?.temperature ?? "Insufficient data";
  const style = t === "Hot" ? "bg-hot-soft text-hot" : t === "Warm" ? "bg-warm-soft text-warm" : "bg-low-soft text-low";
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${style}`}>{t}{analysis?.score != null ? ` · ${analysis.score}/100` : ""}</span>;
}
export function LiveAnalysis({ id, detailed = false }: { id: string; detailed?: boolean }) {
  const run = useServerFn(analyzeLead);
  const { query } = useStore();
  const [a, setA] = useState<Intelligence | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState("");
  useEffect(() => { const update = () => setA(getLiveAnalysis(id)); update(); setCriteria(getLiveSource(id)?.query ?? query); window.addEventListener("leadpilot-intelligence", update); return () => window.removeEventListener("leadpilot-intelligence", update); }, [id]);
  const go = async () => {
    const c = getCompany(id); const src = getLiveSource(id); if (!c || !src) return;
    setBusy(true); setError(null);
    try {
      const r = await run({ data: { name: c.name, website: src.websiteCandidate === false ? "" : c.website, excerpt: src.excerpt, sourceUrl: src.url, criteria } });
      if (r.analysis) { setLiveAnalysis(id, r.analysis); setA(r.analysis); } else { const message = r.error ?? "AI analysis failed."; setError(message); toast.error(message); }
    } catch { setError("AI analysis failed."); toast.error("AI analysis failed."); } finally { setBusy(false); }
  };
  return <div className={`min-w-0 space-y-3 text-sm ${detailed ? "" : "lg:w-72"}`}>
    {detailed && <label className="block text-xs text-muted-foreground">Target criteria / your offering<input aria-label="Research criteria" value={criteria} maxLength={300} onChange={e => setCriteria(e.target.value)} className="mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground" /></label>}
    {a && <>
      <Temperature analysis={a} />
      <p className="text-xs text-muted-foreground">Search fit: {a.fit} · Buying intent: {a.temperature === "Hot" ? "Source-reported" : "Not confirmed"}</p>
      <p className="text-xs text-muted-foreground">{a.reason}</p>
      <p className="text-xs text-muted-foreground">Criteria: {a.criteria || "Not supplied"} · Checked {new Date(a.analyzedAt).toLocaleString()}</p>
      <dl className={detailed ? "grid gap-4 sm:grid-cols-2" : "space-y-2"}>{(detailed ? factKeys : ["headquartersCity", "headquartersCountry", "industry", "size"] as const).map(k => <div key={k}><dt className="mb-1 text-xs font-medium text-muted-foreground">{factLabels[k]} · source-reported</dt><dd><EvidenceClaim claim={a.facts[k]} missing={k.startsWith("headquarters") ? "Location not verified" : "Not available"} /></dd></div>)}</dl>
      {detailed && <>
        <section className="border-t pt-4"><h3 className="mb-2 font-semibold">Recent activity, growth and buying signals</h3>{a.signals.length ? a.signals.map((s, i) => <div key={i} className="mb-3"><p className="mb-1 text-xs font-medium text-muted-foreground">{s.kind} · {s.date ?? "Date not verified"} · {s.relevant ? "Relevant to criteria" : "Relevance not established"}</p><EvidenceClaim claim={s.claim} /></div>) : <p className="text-muted-foreground">Not available — no supported signals found.</p>}</section>
        <section className="border-t pt-4"><h3 className="mb-2 font-semibold">Potential needs and sales opportunities</h3><p className="mb-2 text-xs text-muted-foreground">AI hypotheses · not verified buying intent</p><p>{a.opportunities || "Not available"}</p></section>
        <section className="border-t pt-4"><h3 className="mb-2 font-semibold">Pages researched</h3>{a.pages.map(p => <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="mb-1 block break-all text-xs text-primary underline">{p.url}</a>)}<p className="mt-2 text-xs text-muted-foreground">Full-page quotes support these fields; source accuracy and site ownership are not independently verified.</p></section>
      </>}
    </>}
    <Button size="sm" variant="outline" onClick={go} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy ? "Researching…" : a ? "Re-analyze" : "Analyze with AI"}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {detailed && <p className="text-xs text-muted-foreground">On request only: one basic Tavily search from your free allowance; AI analysis uses existing Lovable AI credits. No paid fallback.</p>}
  </div>;
}
