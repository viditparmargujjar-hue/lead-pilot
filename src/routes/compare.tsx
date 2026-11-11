import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCompareArrows, Trophy, X, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { ResearchButton, SaveButton } from "@/components/LeadCard";
import { EvidenceClaim, Temperature } from "@/components/LiveAnalysis";
import { Button } from "@/components/ui/button";
import { MAX_COMPARE, useCompare } from "@/lib/compare";
import { getCompany, getLiveAnalysis, getLiveSource } from "@/lib/data";
import { factKeys, factLabels } from "@/lib/intelligence";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [
    { title: "Compare Real Companies — LeadPilot AI" }, { name: "description", content: "Compare two to five real companies using cited intelligence, search fit and buying-intent evidence." },
    { property: "og:title", content: "Compare Real Companies — LeadPilot AI" }, { property: "og:description", content: "Evidence-led company comparison with transparent strengths, gaps and recommendations." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: ComparePage,
});
function ComparePage() {
  const { ids, remove } = useCompare();
  const [, refresh] = useState(0);
  useEffect(() => { const update = () => refresh(v => v + 1); window.addEventListener("leadpilot-intelligence", update); return () => window.removeEventListener("leadpilot-intelligence", update); }, []);
  const companies = ids.filter(id => id.startsWith("live:")).map(getCompany).filter((c): c is NonNullable<typeof c> => !!c);
  const analyzed = companies.map(c => ({ c, a: getLiveAnalysis(c.id) }));
  const scored = analyzed.filter(r => r.a?.score != null).sort((x, y) => (y.a?.score ?? 0) - (x.a?.score ?? 0));
  const comparable = scored.length === companies.length && new Set(scored.map(r => r.a?.criteria.trim().toLowerCase())).size === 1;
  const top = scored[0], second = scored[1];
  const summary = !comparable ? "No reliable overall winner: research every company against the same target criteria. Missing evidence is not a low score."
    : top && second && top.a?.score === second.a?.score ? "The top companies are tied. Compare their cited fit and intent evidence; there is no unique winner."
    : top ? `${top.c.name} is the strongest supported match (${top.a?.score}/100). ${top.a?.reason} ${second ? `It ranks ${(top.a?.score ?? 0) - (second.a?.score ?? 0)} points above ${second.c.name}; review the criteria and cited intent evidence below.` : ""}` : "Insufficient data.";
  const rows: Array<[string, (id: string) => React.ReactNode]> = [
    ["Website candidate", id => { const c = getCompany(id), src = getLiveSource(id); return c && src?.websiteCandidate !== false ? <a href={c.website} target="_blank" rel="noreferrer" className="break-all text-primary underline">{c.website}</a> : "Not available"; }],
    ...factKeys.map(k => [factLabels[k], (id: string) => <EvidenceClaim claim={getLiveAnalysis(id)?.facts[k]} missing={k.startsWith("headquarters") ? "Location not verified" : "Not available"} />] as [string, (id: string) => React.ReactNode]),
    ["Lead temperature / quality", id => <Temperature analysis={getLiveAnalysis(id)} />],
    ["Search fit", id => { const a = getLiveAnalysis(id); return <><p className="mb-1 font-medium">{a?.fit ?? "Insufficient data"}</p><EvidenceClaim claim={a?.fitEvidence} /></>; }],
    ["Recent business activity / growth / buying intent", id => { const a = getLiveAnalysis(id); return a?.signals.length ? a.signals.map((s, i) => <div key={i} className="mb-3"><p className="text-xs text-muted-foreground">{s.kind} · {s.date ?? "Date not verified"}</p><EvidenceClaim claim={s.claim} /></div>) : "Not available"; }],
    ["Strengths", id => { const a = getLiveAnalysis(id); return a ? `${a.fit === "strong" ? "Strong supported search fit. " : a.fit === "partial" ? "Partial supported search fit. " : "No strong search match established. "}${a.temperature === "Hot" ? "Recent explicit relevant buying evidence." : ""}` : "Insufficient data"; }],
    ["Weaknesses / evidence gaps", id => { const a = getLiveAnalysis(id); return a ? `${a.temperature !== "Hot" ? "No confirmed recent relevant buying intent. " : ""}${factKeys.filter(k => !a.facts[k]).map(k => factLabels[k]).join(", ") || "No missing profile fields"}` : "Company evidence has not been researched."; }],
    ["Score explanation", id => getLiveAnalysis(id)?.reason ?? "Insufficient data — no score assigned."],
    ["Target criteria", id => getLiveAnalysis(id)?.criteria || getLiveSource(id)?.query || "Not available"],
    ["Last researched", id => { const a = getLiveAnalysis(id); return a ? new Date(a.analyzedAt).toLocaleString() : "Not researched"; }],
    ["Source URLs", id => { const a = getLiveAnalysis(id), src = getLiveSource(id); return <>{(a?.pages.map(p => p.url) ?? (src ? [src.url] : [])).map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="mb-1 block break-all text-xs text-primary underline">{url}</a>)}</>; }],
  ];
  return <>
    <PageHeader title="Compare Leads" description={`Compare 2–${MAX_COMPARE} real companies using cited evidence. Unsupported fields stay unavailable.`} />
    <div className="mb-5 flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/find"><Plus />Find replacement</Link></Button><Button variant="outline" asChild><Link to="/leads">My Leads</Link></Button><span className="self-center text-sm text-muted-foreground">{companies.length} of {MAX_COMPARE} selected</span></div>
    {companies.length < 2 ? <div className="flex flex-col items-center gap-3 border-y py-12 text-center"><GitCompareArrows className="h-6 w-6 text-primary" /><p className="font-semibold">Select at least 2 real companies</p><p className="text-sm text-muted-foreground">{companies[0]?.name ?? "No companies selected"}</p></div> : <>
      <section className="mb-5 border-y bg-primary-soft px-4 py-4"><h2 className="mb-2 flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-primary" />Comparison recommendation</h2><p className="text-sm">{summary}</p></section>
      <div role="region" aria-label="Company comparison" tabIndex={0} className="w-full overflow-x-auto border"><table className="w-full table-fixed border-collapse text-left"><colgroup><col className="w-44" />{companies.map(c => <col key={c.id} className="w-64" />)}</colgroup><thead><tr><th className="sticky left-0 z-10 bg-card p-4 text-xs text-muted-foreground">Company</th>{companies.map(c => <th key={c.id} className="bg-card p-4 align-top"><div className="flex items-start justify-between gap-2"><span className="break-words font-semibold">{c.name}</span><Button size="icon" variant="ghost" aria-label={`Remove ${c.name} from comparison`} onClick={() => remove(c.id)}><X /></Button></div><div className="mt-2 flex flex-wrap gap-2"><ResearchButton id={c.id} /><SaveButton id={c.id} name={c.name} /></div></th>)}</tr></thead><tbody>{rows.map(([label, render]) => <tr key={label}><th scope="row" className="sticky left-0 z-10 border-t bg-card p-4 align-top text-xs font-medium text-muted-foreground">{label}</th>{companies.map(c => <td key={c.id} className="border-t p-4 align-top text-sm">{render(c.id)}</td>)}</tr>)}</tbody></table></div>
    </>}
  </>;
}
