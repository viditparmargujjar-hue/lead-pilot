// Client helper: calls /api/rank, parses the streamed response into scored leads.
import { labelFor, weightedScore, type ScoredLead } from "./ai";
import { getCompany } from "./data";

export interface AiInterpretation {
  summary: string;
  industry: string | null;
  location: string | null;
  employees: string | null;
  relevance: string | null;
}

interface RawResult { id: string; industry: number; location: number; size: number; relevance: number; why: string }

export async function rankWithAI(
  query: string,
  onThinking: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ interpretation: AiInterpretation; leads: ScoredLead[] }> {
  const res = await fetch("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal: signal ?? null,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.error ?? "Something went wrong while ranking. Please try again."), { status: res.status });
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "", out = "", thinking = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let ev: { type?: string; delta?: string; error?: { message?: string }; response?: { error?: { message?: string } } };
      try { ev = JSON.parse(payload); } catch { continue; }
      if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
      else if (ev.type === "response.reasoning_summary_text.delta" && ev.delta) {
        thinking += ev.delta;
        onThinking(thinking);
      } else if (ev.type === "error" || ev.type === "response.failed") {
        console.error("AI stream error", ev);
        throw new Error("Something went wrong while ranking. Please try again.");
      }
    }
  }
  if (!out.trim()) throw new Error("The AI didn't return any results. Please try again.");

  const parsed = JSON.parse(out) as { interpretation: AiInterpretation; results: RawResult[] };
  const leads: ScoredLead[] = [];
  for (const r of parsed.results) {
    const company = getCompany(r.id);
    if (!company || leads.some((l) => l.company.id === r.id)) continue;
    const c = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const breakdown = { industry: c(r.industry), location: c(r.location), size: c(r.size), relevance: c(r.relevance) };
    const score = weightedScore(breakdown);
    leads.push({ company, score, label: labelFor(score), breakdown, why: r.why });
  }
  leads.sort((a, b) => b.score - a.score);
  return { interpretation: parsed.interpretation, leads };
}
