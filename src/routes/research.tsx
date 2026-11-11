import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Gauge, Globe, Info, Radar, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { LabelBadge, MatchBreakdown, Meta, SaveButton, ScoreRing, WhyThisLead } from "@/components/LeadCard";
import { scoreCompany, search } from "@/lib/ai";
import { getCompany, getLiveSource, getResearch, type Confidence } from "@/lib/data";
import { LiveAnalysis } from "@/components/LiveAnalysis";
import { ResearchReportButton } from "@/components/ResearchReportButton";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/research")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "AI Research — LeadPilot AI" },
      { name: "description", content: "Quick AI company intelligence: what they do, business signals, potential needs and match breakdown." },
      { property: "og:title", content: "AI Research — LeadPilot AI" },
      { property: "og:description", content: "Concise, explainable company research for every lead." },
    ],
  }),
  component: ResearchPage,
});

const confStyle: Record<Confidence, string> = {
  High: "bg-insight-soft text-insight",
  Medium: "bg-warm-soft text-warm",
  "Limited data": "bg-low-soft text-low",
};

function Section({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function ResearchPage() {
  const { id } = Route.useSearch();
  const { criteria, saved, loaded } = useStore();
  const [, refresh] = useState(0);
  useEffect(() => { const update = () => refresh(v => v + 1); window.addEventListener("leadpilot-intelligence", update); return () => window.removeEventListener("leadpilot-intelligence", update); }, []);
  const company = loaded && id ? getCompany(id) : undefined;

  if (!company) {
    const suggestions = [
      ...saved.map((s) => s.companyId),
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
    return (
      <>
        <PageHeader title="AI Research" description="Pick a company to see quick, explainable intelligence. You can also open research from any lead card." />
        {id && <div className="mb-4 card-surface p-4 text-sm text-muted-foreground">Research is not available for this company yet.</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((cid) => {
            const c = getCompany(cid);
            if (!c) return null;
            if (cid.startsWith("live:")) return (
              <Link key={cid} to="/research" search={{ id: cid }} className="card-surface card-lift flex items-center gap-4 p-4">
                <Globe className="h-6 w-6 text-primary" />
                <div className="min-w-0"><div className="truncate font-semibold">{c.name}</div><div className="text-sm text-muted-foreground">Live web · sourced</div></div>
              </Link>
            );
            const lead = scoreCompany(c, criteria);
            return (
              <Link key={cid} to="/research" search={{ id: cid }} className="card-surface card-lift flex items-center gap-4 p-4">
                <ScoreRing score={lead.score} label={lead.label} size={48} />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{lead.company.name}</div>
                  <div className="text-sm text-muted-foreground">{lead.company.industry} · {lead.company.city}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </>
    );
  }

  if (company.id.startsWith("live:")) {
    const src = getLiveSource(company.id);
    return (
      <>
        <Link to="/research" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All research</Link>
        <div className="mb-4 rounded-lg border border-dashed bg-muted/40 px-4 py-2 text-xs text-muted-foreground">Live web company — search excerpts are unverified. Researched fields include full-page supporting quotes; AI opportunities are separate.</div>
        <div className="card-surface mb-6 flex flex-col gap-4 p-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary"><Globe className="h-3.5 w-3.5" />{company.website}</a>
          </div>
          <div className="flex flex-wrap gap-2">
            <ResearchReportButton id={company.id} name={company.name} />
            <SaveButton id={company.id} name={company.name} />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Section icon={Building2} title="Discovery excerpt · unverified">
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Source excerpt: </span>{src?.excerpt || "No excerpt returned."}</p>
            {src && <a href={src.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-muted-foreground underline">View source · fetched {new Date(src.fetchedAt).toLocaleString()}</a>}
          </Section>
          <Section icon={Gauge} title="Company intelligence"><LiveAnalysis id={company.id} detailed /></Section>
        </div>
      </>
    );
  }

  const lead = scoreCompany(company, criteria);
  const r = getResearch(company.id);
  const factorNames: Record<string, string> = { industry: "industry", location: "location", size: "company size", relevance: "business relevance" };
  const sorted = Object.entries(lead.breakdown).sort((a, b) => b[1] - a[1]);
  const strong = sorted.filter(([, v]) => v >= 75).map(([k, v]) => `${factorNames[k]} (${v}%)`);
  const weak = sorted.filter(([, v]) => v < 60).map(([k, v]) => `${factorNames[k]} (${v}%)`);
  const leadReason = [
    `${company.name} is a ${company.industry} company in ${company.city}, ${company.country} with ${company.employees} employees, scoring ${lead.score}/100 against your current search.`,
    strong.length ? `Strongest factors: ${strong.join(", ")}.` : `No factor is a strong match for your current search.`,
    weak.length ? `Weaker factors: ${weak.join(", ")}.` : `No factor is notably weak.`,
  ].join(" ");
  const confExplain = r
    ? r.confidence === "High"
      ? `The demo profile includes a clear company summary, ${r.signals.length} business signal${r.signals.length === 1 ? "" : "s"} and relevance keywords, so the research is well supported.`
      : r.confidence === "Medium"
      ? `The demo profile has a company summary${r.signals.length ? ` and ${r.signals.length} signal${r.signals.length === 1 ? "" : "s"}` : ""}, but limited detail on current priorities.`
      : `Only a short demo summary is available${r.signals.length ? "" : " and no business signals"}, so conclusions are tentative.`
    : "";
  const needBasis = r
    ? `Based on: its ${company.industry} focus, ${company.employees}-person size${r.signals.length ? `, ${r.signals.join(" / ").toLowerCase()} signals` : ""} and profile keywords (${company.tags.join(", ")}).`
    : "";

  return (
    <>
      <Link to="/research" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All research
      </Link>

      <div className="mb-4 rounded-lg border border-dashed bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        Demo information — this research uses fictional sample data, not live or verified web research.
      </div>

      <div className="card-surface mb-6 flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <ScoreRing score={lead.score} label={lead.label} size={76} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            <LabelBadge label={lead.label} />
          </div>
          <Meta lead={lead} />
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Globe className="h-3.5 w-3.5" />{company.website} · demo website</span>
        </div>
        <SaveButton id={company.id} name={company.name} />
      </div>

      <div className="mb-6"><WhyThisLead text={lead.why} /></div>

      {!r ? (
        <div className="card-surface p-8 text-center text-muted-foreground">Research information is not available for this company yet.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Section icon={Building2} title="Company overview">
              <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Industry</dt><dd className="font-medium">{company.industry}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Location</dt><dd className="font-medium">{company.city}, {company.country}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Employees</dt><dd className="font-medium">{company.employees}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Website</dt><dd className="truncate font-medium">{company.website}</dd></div>
              </dl>
              <p>{r.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">Evidence: demo company profile</p>
            </Section>
            <Section icon={Target} title="Why this company may be a lead">
              <p>{leadReason}</p>
              <p className="mt-2 text-xs text-muted-foreground">Evidence: company data + your current search criteria</p>
            </Section>
            <Section icon={TrendingUp} title="Business signals">
              {r.signals.length ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {r.signals.map((s) => (
                      <span key={s} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-accent-foreground">{s}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Evidence: supplied in demo data</p>
                </>
              ) : (
                <p className="text-muted-foreground">No verified business signals available.</p>
              )}
            </Section>
            <Section icon={Radar} title="Potential business need">
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-warm-soft px-2 py-1 text-xs font-semibold text-warm">
                <Info className="h-3.5 w-3.5" /> AI inference — not verified.
              </span>
              <p>{r.potentialNeed}</p>
              <p className="mt-2 text-xs text-muted-foreground">{needBasis}</p>
            </Section>
          </div>
          <div className="space-y-4">
            <Section icon={Gauge} title="Match breakdown">
              <MatchBreakdown b={lead.breakdown} />
            </Section>
            <Section icon={Info} title="AI confidence">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${confStyle[r.confidence]}`}>{r.confidence}</span>
              <p className="mt-2 text-sm text-muted-foreground">{confExplain}</p>
              <p className="mt-1 text-xs text-muted-foreground">Based on available information, not the lead score.</p>
            </Section>
          </div>
        </div>
      )}
    </>
  );
}
