// Maps AI interpretation failures to safe, user-facing messages (never raw server details).
export function describeSearchError(err: unknown): { title: string; message: string; retry: boolean } {
  const status = (err as { status?: number } | null)?.status;
  if (err instanceof TypeError) return { title: "Connection problem", message: "We couldn't reach the AI service. Check your connection and try again.", retry: true };
  if (status === 401 || status === 403) return { title: "AI access unavailable", message: "The AI service isn't authorised for this app right now.", retry: false };
  if (status === 429) return { title: "Too many requests", message: "The AI service is busy. Wait a moment, then retry.", retry: true };
  if (status === 402) return { title: "AI credits exhausted", message: "AI interpretation is paused until credits are added.", retry: false };
  if (status && status >= 500) return { title: "AI service unavailable", message: "The AI service is temporarily unavailable. Please retry shortly.", retry: true };
  return { title: "AI interpretation failed", message: "Something went wrong while interpreting your search. Please retry.", retry: true };
}
