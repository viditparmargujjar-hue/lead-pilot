import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkX, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { LabelBadge, Meta, ResearchButton, ScoreRing, WhyThisLead } from "@/components/LeadCard";
import { scoreCompany } from "@/lib/ai";
import { CompareBar, CompareButton } from "@/components/CompareControls";
import { useCompare } from "@/lib/compare";
import { getCompany, getLiveAnalysis, getLiveSource } from "@/lib/data";
import { LiveAnalysis } from "@/components/LiveAnalysis";
import { ResearchReportButton } from "@/components/ResearchReportButton";
import { useStore, SAVED_LEAD_STATUSES, type Status } from "@/lib/store";
import { useWorkspace } from "@/lib/workspace-store";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Leads — LeadPilot AI" },
      { name: "description", content: "Manage your saved leads: search, filter by status, and sort by score." },
      { property: "og:title", content: "My Leads — LeadPilot AI" },
      { property: "og:description", content: "Your saved B2B leads, organized by status and score." },
    ],
  }),
  component: MyLeads,
});

const STATUSES: Status[] = SAVED_LEAD_STATUSES;
const statusStyle: Record<Status, string> = {
  New: "bg-potential-soft text-potential",
  Reviewing: "bg-warm-soft text-warm",
  Contacted: "bg-insight-soft text-insight",
  Interested: "bg-insight-soft text-insight",
  "Not Interested": "bg-muted text-muted-foreground",
};

function MyLeads() {
  const { saved, criteria, setStatus, toggleSave } = useStore();
  const compare = useCompare();
  const { preferences } = useWorkspace();
  const [revision, refresh] = useState(0);
  useEffect(() => { const update = () => refresh(v => v + 1); window.addEventListener("leadpilot-intelligence", update); return () => window.removeEventListener("leadpilot-intelligence", update); }, []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [sortOverride, setSort] = useState<"high" | "low" | "recent" | undefined>();
  const [viewOverride, setView] = useState<"detailed" | "compact" | undefined>();
  const sort = sortOverride ?? preferences.sort;
  const view = viewOverride ?? preferences.leadView;

  const rows = useMemo(() => {
    const list = saved
      .map((s) => {
        const c = getCompany(s.companyId);
        return c ? { ...s, lead: scoreCompany(c, criteria) } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .filter((r) => filter === "All" || r.status === filter)
      .filter((r) => `${r.lead.company.name} ${r.lead.company.industry} ${r.lead.company.city}`.toLowerCase().includes(q.toLowerCase()));
    return list.sort((a, b) =>
      sort === "recent" ? b.savedAt - a.savedAt : (() => { const score = (id: string, fallback: number) => id.startsWith("live:") ? getLiveAnalysis(id)?.score ?? null : fallback; const x = score(a.companyId, a.lead.score), y = score(b.companyId, b.lead.score); return x == null ? (y == null ? b.savedAt - a.savedAt : 1) : y == null ? -1 : sort === "high" ? y - x : x - y; })(),
    );
  }, [saved, criteria, q, filter, sort, revision]);

  return (
    <>
      <PageHeader title="My Leads" description="Companies you've saved, with sourced intelligence and clearly labelled evidence gaps." />

      {saved.length === 0 ? (
        <div className="card-surface flex flex-col items-center p-14 text-center">
          <BookmarkX className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">You haven't saved any leads yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Find promising companies and save them here.</p>
          <Link to="/find" className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Find leads</Link>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search saved leads..."
                className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
              {(["All", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-10 rounded-lg border bg-card px-3 text-sm"
            >
              <option value="high">Highest score</option>
              <option value="low">Lowest score</option>
              <option value="recent">Recently saved</option>
            </select>
            <select aria-label="Lead view" value={view} onChange={(e) => setView(e.target.value as typeof view)} className="h-10 rounded-lg border bg-card px-3 text-sm"><option value="detailed">Detailed view</option><option value="compact">Compact view</option></select>
          </div>

          {rows.length === 0 ? (
            <div className="card-surface p-10 text-center text-sm text-muted-foreground">No saved leads match this view.</div>
          ) : (
            <div className="space-y-3">
              {rows.map(({ lead, status }) => (
                <div key={lead.company.id} className={`card-surface flex ${compare.has(lead.company.id) ? "ring-2 ring-primary" : ""} flex-col gap-4 p-5 lg:flex-row lg:items-center`}>
                  {(() => { const src = getLiveSource(lead.company.id); return src ? (<>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{lead.company.name}</h3>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">Live web · sourced</span>
                    </div>
                    {view === "detailed" && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Source excerpt: </span>{src.excerpt || "No excerpt returned."}</p>}
                    <a href={src.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">View source</a>
                  </div>
                  <LiveAnalysis id={lead.company.id} /></>) : (<>
                  <ScoreRing score={lead.score} label={lead.label} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{lead.company.name}</h3>
                      <LabelBadge label={lead.label} />
                    </div>
                    <Meta lead={lead} />
                  </div>
                  {view === "detailed" && <div className="lg:w-72"><WhyThisLead text={lead.why} compact /></div>}</>); })()}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Status"
                      value={status}
                      onChange={(e) => {
                        setStatus(lead.company.id, e.target.value as Status);
                        toast.success(`Status set to ${e.target.value}`);
                      }}
                      className={`h-9 rounded-lg border-0 px-3 text-sm font-semibold ${statusStyle[status]}`}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    {lead.company.id.startsWith("live:") && <ResearchReportButton id={lead.company.id} name={lead.company.name} compact />}
                    <ResearchButton id={lead.company.id} />
                    <CompareButton id={lead.company.id} name={lead.company.name} />
                    <button
                      aria-label="Remove lead"
                      onClick={() => { toggleSave(lead.company.id); toast(`${lead.company.name} removed`); }}
                      className="grid h-9 w-9 place-items-center rounded-lg border bg-card text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <CompareBar />
    </>
  );
}
