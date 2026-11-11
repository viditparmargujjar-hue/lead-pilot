import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, BookmarkCheck, Building2, ChevronDown, Globe, MapPin, Sparkles, Users, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import type { Label, ScoredLead, Breakdown } from "@/lib/ai";
import { useStore } from "@/lib/store";
import { CompareButton } from "@/components/CompareControls";
import { useCompare } from "@/lib/compare";
import { Button } from "@/components/ui/button";

const labelStyles: Record<Label, string> = {
  Hot: "bg-hot-soft text-hot",
  Warm: "bg-warm-soft text-warm",
  Potential: "bg-potential-soft text-potential",
  "Low Match": "bg-low-soft text-low",
};

export function LabelBadge({ label }: { label: Label }) {
  return (
    <span className={`lead-status inline-flex items-center gap-1.5 rounded-md border border-current/15 px-2.5 py-1 text-[11px] font-semibold ${labelStyles[label]}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label === "Low Match" ? label : `${label} lead`}
    </span>
  );
}

export function ScoreRing({ score, label, size = 48 }: { score: number; label: Label; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const color = { Hot: "text-hot", Warm: "text-warm", Potential: "text-potential", "Low Match": "text-low" }[label];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} className="fill-none stroke-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={5} strokeLinecap="round"
          className={`fill-none stroke-current ${color}`}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
        />
      </svg>
      <span className="tabular absolute inset-0 grid place-items-center font-display text-sm font-semibold">{score}</span>
    </div>
  );
}

export function WhyThisLead({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div className={`lead-explanation rounded-lg border border-insight/20 bg-insight-soft ${compact ? "p-3" : "p-4"}`}>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-insight">
        <Lightbulb className="h-3.5 w-3.5" /> Why this lead?
      </div>
      <p className="break-words text-sm leading-relaxed text-foreground">{text || "No match explanation available."}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">AI-generated explanation · demo data · unverified</p>
    </div>
  );
}

export function SaveButton({ id, name, removeLabel }: { id: string; name: string; removeLabel?: boolean }) {
  const { isSaved, toggleSave } = useStore();
  const saved = isSaved(id);
  return (
    <Button
      type="button"
      aria-pressed={saved}
      onClick={() => {
        const now = toggleSave(id);
        toast.success(now ? `${name} saved to My Leads` : `${name} removed from My Leads`);
      }}
      className={`lead-save px-3 ${
        saved ? "bg-primary-soft text-accent-foreground hover:bg-accent" : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? (removeLabel ? "Remove from My Leads" : "Saved") : "Save Lead"}
    </Button>
  );
}

export function ResearchButton({ id }: { id: string }) {
  return (
    <Button asChild variant="outline" className="lead-research border-border bg-card px-3 shadow-none">
    <Link
      to="/research"
      search={{ id }}
    >
      <Sparkles className="h-4 w-4 text-primary" /> Research
    </Link>
    </Button>
  );
}

export function Meta({ lead }: { lead: ScoredLead }) {
  const c = lead.company;
  return (
    <div className="lead-meta flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <span className="inline-flex min-w-0 items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{c.industry || "Industry unavailable"}</span></span>
      <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{[c.city, c.country].filter(Boolean).join(", ") || "Location unavailable"}</span></span>
      <span className="inline-flex min-w-0 items-center gap-1.5"><Users className="h-3.5 w-3.5 shrink-0" /><span>{Number.isFinite(c.employees) && c.employees >= 0 ? `${c.employees} employees` : "Size unavailable"}</span></span>
    </div>
  );
}

export function LeadCard({ lead }: { lead: ScoredLead }) {
  const c = lead.company;
  const [open, setOpen] = useState(false);
  const selected = useCompare().has(c.id);
  return (
    <article className={`lead-card card-surface flex h-full min-w-0 flex-col gap-4 p-5 ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="lead-company-header flex items-start gap-3">
        <div aria-hidden="true" className="lead-company-icon grid h-10 w-10 shrink-0 place-items-center rounded-md border border-primary/15 bg-primary-soft text-primary"><Building2 className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-bold leading-snug">{c.name || "Company name unavailable"}</h3>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Fictional demo company · unverified</p>
          {c.website && <span className="mt-2 inline-flex max-w-full items-start gap-1.5 text-xs text-muted-foreground">
            <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="break-all">{c.website}</span>
          </span>}
        </div>
      </div>
      <Meta lead={lead} />
      <div className="lead-relevance flex items-center justify-between gap-3 border-y py-3">
        <div className="flex items-center gap-3">
          <div className={`lead-score lead-score-${lead.label === "Hot" ? "high" : lead.label === "Low Match" ? "low" : "medium"}`}><ScoreRing score={lead.score} label={lead.label} size={44} /></div>
          <div><p className="text-xs font-semibold">Relevance Score</p><p className="mt-0.5 text-[11px] text-muted-foreground">{lead.score} / 100 · demo match</p></div>
        </div>
        <LabelBadge label={lead.label} />
      </div>
      <WhyThisLead text={lead.why} compact />
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="h-auto self-start px-0 py-1 text-xs text-primary hover:bg-transparent hover:underline"
      >
        {open ? "Hide" : "View"} Match Breakdown
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <MatchBreakdown b={lead.breakdown} />
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
            <span className="font-semibold">Overall Score</span>
            <span className="text-right font-semibold">{lead.score}/100 — <span>{lead.label === "Low Match" ? "Low Match" : `${lead.label} lead`}</span></span>
          </div>
        </div>
      )}
      <div className="lead-actions mt-auto flex flex-wrap gap-2 border-t pt-4">
        <SaveButton id={c.id} name={c.name} />
        <ResearchButton id={c.id} />
        <CompareButton id={c.id} name={c.name} />
      </div>
    </article>
  );
}

export function MatchBreakdown({ b }: { b: Breakdown }) {
  const items = [
    ["Industry Match", b.industry, "Demo profile"],
    ["Location Match", b.location, "Demo profile"],
    ["Company Size Match", b.size, "Demo profile"],
    ["Business Relevance", b.relevance, "AI inference — not verified"],
  ] as const;
  return (
    <div className="space-y-3.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Match Breakdown</div>
      {items.map(([k, v, src]) => (
        <div key={k}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span>
              {k}
              <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${src === "Demo profile" ? "bg-card text-muted-foreground border" : "border border-dashed text-muted-foreground"}`}>{src}</span>
            </span>
            <span className="font-semibold">{v}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${v}%` }} />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Overall = industry × 30% + location × 25% + size × 20% + relevance × 25%, rounded.</p>
    </div>
  );
}
