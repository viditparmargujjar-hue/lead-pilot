import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCompany, getLiveAnalysis, getLiveSource } from "@/lib/data";
import { deliverFile } from "@/lib/download";

interface PreparedReport { blob: Blob; filename: string }

export function ResearchReportButton({ id, name, compact = false }: { id: string; name: string; compact?: boolean }) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState<PreparedReport | null>(null);

  useEffect(() => {
    const update = () => { setAvailable(!!getLiveAnalysis(id)); setPrepared(null); };
    update();
    window.addEventListener("leadpilot-intelligence", update);
    return () => window.removeEventListener("leadpilot-intelligence", update);
  }, [id]);

  const prepare = async () => {
    const company = getCompany(id);
    const analysis = getLiveAnalysis(id);
    if (!company || !analysis) { toast.info("Run cited research before exporting this report."); return; }
    setBusy(true);
    try {
      const { createResearchReport, researchReportFilename } = await import("@/lib/research-report");
      const source = getLiveSource(id);
      const bytes = await createResearchReport({ company, analysis, ...(source ? { source } : {}) });
      const blob = new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" });
      setPrepared({ blob, filename: researchReportFilename(company.name) });
      toast.success("Research report ready. Select Download PDF to save it.");
    } catch {
      toast.error("The research PDF could not be created. Please try again.");
    } finally { setBusy(false); }
  };

  const download = () => {
    if (!prepared) return;
    void deliverFile(prepared.blob, prepared.filename);
    toast.success("PDF download started.");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      className={compact ? "px-3" : undefined}
      disabled={!available || busy}
      title={available ? "Export cited facts, quotes and sources as a PDF" : "Run cited research before exporting"}
      aria-label={`${prepared ? "Download" : "Export"} ${name} cited research PDF`}
      onClick={() => { if (prepared) download(); else void prepare(); }}
    >
      {busy ? <Loader2 className="animate-spin" /> : prepared ? <Download /> : <FileText />}
      {busy ? "Preparing…" : prepared ? "Download PDF" : "Export PDF"}
    </Button>
  );
}
