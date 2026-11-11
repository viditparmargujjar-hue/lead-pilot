import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { History, RotateCcw, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { useHistory, type HistoryItem } from "@/lib/history";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Search History — LeadPilot AI" },
      { name: "description", content: "Revisit, save and rerun your previous LeadPilot AI lead searches." },
      { property: "og:title", content: "Search History — LeadPilot AI" },
      { property: "og:description", content: "Your recent and saved natural-language lead searches." },
    ],
  }),
  component: HistoryPage,
});

function criteriaChips(c: HistoryItem["criteria"]) {
  const out: Array<[string, string]> = [];
  if (c.industry) out.push(["Industry", c.industry]);
  if (c.location) out.push(["Location", c.location]);
  if (c.minEmp != null || c.maxEmp != null) {
    out.push([
      "Employees",
      c.minEmp != null && c.maxEmp != null && c.maxEmp < 100000 ? `${c.minEmp}–${c.maxEmp}` : c.minEmp != null ? `${c.minEmp}+` : `Under ${c.maxEmp}`,
    ]);
  }
  if (c.growth) out.push(["Growth", "Growing"]);
  if (c.relevance?.length) out.push(["Relevance", c.relevance.join(", ")]);
  return out;
}

const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function HistoryPage() {
  const { items, toggleSaved, remove } = useHistory();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [q, setQ] = useState("");

  const list = useMemo(
    () => items.filter((i) => (tab === "all" || i.saved) && i.query.toLowerCase().includes(q.trim().toLowerCase())),
    [items, tab, q],
  );

  const tabBtn = (id: "all" | "saved", label: string, n: number) => (
    <button
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label} <span className="rounded-full bg-muted px-1.5 text-xs">{n}</span>
    </button>
  );

  return (
    <>
      <PageHeader title="Search History" description="Your past searches, stored on this device. Search again to retrieve current live web results." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" className="inline-flex w-fit rounded-lg bg-muted p-1">
          {tabBtn("all", "All Searches", items.length)}
          {tabBtn("saved", "Saved Searches", items.filter((i) => i.saved).length)}
        </div>
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Search previous queries</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search previous queries..."
            className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      {list.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
            <History className="h-5 w-5" />
          </span>
          <p className="text-muted-foreground">
            {items.length === 0
              ? "No searches yet. Your recent searches will appear here."
              : tab === "saved" && !q
                ? "No saved searches yet. Star a search to keep it here."
                : "No searches match your filter."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((i) => (
            <li key={i.id} className="card-surface card-lift flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start gap-2">
                  {i.saved && <Star className="mt-1 h-4 w-4 shrink-0 fill-warm text-warm" aria-label="Saved" />}
                  <p className="break-words font-medium">{i.query}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmt.format(i.at)}
                  {i.count != null && ` · ${i.count} matching ${i.count === 1 ? "company" : "companies"}`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {criteriaChips(i.criteria).map(([k, v]) => (
                    <span key={k} className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs">
                      <span className="text-muted-foreground">{k}:</span> <span className="font-medium">{v}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate({ to: "/find", search: { q: i.query, t: Date.now() } })}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <RotateCcw className="h-4 w-4" /> Search Again
                </button>
                <button
                  onClick={() => { toggleSaved(i.id); toast.success(i.saved ? "Removed from saved searches" : "Search saved"); }}
                  aria-pressed={i.saved}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star className={`h-4 w-4 ${i.saved ? "fill-warm text-warm" : ""}`} /> {i.saved ? "Saved" : "Save Search"}
                </button>
                <button
                  onClick={() => { remove(i.id); toast("Search deleted"); }}
                  aria-label={`Delete search: ${i.query}`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" /> <span className="sm:hidden md:inline">Delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
