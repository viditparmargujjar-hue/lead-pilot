import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, GitCompareArrows, X } from "lucide-react";
import { toast } from "sonner";
import { MAX_COMPARE, useCompare } from "@/lib/compare";
import { getCompany } from "@/lib/data";

export function CompareButton({ id, name }: { id: string; name: string }) {
  const { has, toggle } = useCompare();
  const on = has(id);
  return (
    <Button
      type="button"
      aria-pressed={on}
      onClick={() => {
        const r = toggle(id);
        if (r === "full") toast.error(`You can compare up to ${MAX_COMPARE} companies. Remove one to add ${name}.`);
      }}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        on ? "border-primary bg-primary-soft text-accent-foreground" : "bg-card hover:bg-muted"
      }`}
    >
      {on ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
      {on ? "Selected" : "Compare"}
    </Button>
  );
}

export function CompareBar() {
  const { ids, remove, clear } = useCompare();
  if (!ids.length) return null;
  return (
    <div className="sticky bottom-4 z-20 mt-8">
      <div className="card-surface flex flex-col gap-3 border-primary/30 p-4 shadow-lg sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{ids.length} of {MAX_COMPARE} companies selected</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ids.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-accent-foreground">
                {getCompany(id)?.name ?? id}
                <Button aria-label={`Remove ${getCompany(id)?.name ?? id} from comparison`} onClick={() => remove(id)} className="rounded-full p-0.5 hover:bg-accent">
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={clear} className="h-10 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">Clear selection</Button>
          {ids.length >= 2 ? (
            <Link to="/compare" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <GitCompareArrows className="h-4 w-4" /> Compare Selected
            </Link>
          ) : (
            <Button disabled title="Select at least 2 companies" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground opacity-50">
              <GitCompareArrows className="h-4 w-4" /> Compare Selected
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
