import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { toLiveResults, type LiveResult } from "@/lib/live-search";

const TTL = 15 * 60 * 1000;
const cache = new Map<string, { at: number; results: LiveResult[] }>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/live-search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = z.object({ query: z.string().trim().min(2).max(300) }).safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Enter a search of at least 2 characters." }, 400);
        const key = process.env["TAVILY_API_KEY"];
        if (!key) return json({ error: "Live search isn't configured." }, 503);
        const q = parsed.data.query.toLowerCase().replace(/\s+/g, " ");
        const hit = cache.get(q);
        if (hit && Date.now() - hit.at < TTL) return json({ results: hit.results, cached: true });

        let res: Response;
        try {
          res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({ query: `${parsed.data.query} companies official website`, search_depth: "basic", auto_parameters: false, max_results: 10 }),
            signal: AbortSignal.timeout(15000),
          });
        } catch {
          return json({ error: "Couldn't reach Tavily. Please retry." }, 504);
        }
        if (res.status === 432 || res.status === 433 || res.status === 402)
          return json({ error: "Your free Tavily search quota is used up. Live search will resume when the free allowance resets — no paid service is used." }, 402);
        if (res.status === 429) return json({ error: "Tavily rate limit reached. Wait a moment and retry." }, 429);
        if (res.status === 401 || res.status === 403) return json({ error: "The Tavily key was rejected." }, 401);
        if (!res.ok) return json({ error: "Tavily is temporarily unavailable." }, 502);

        const data = (await res.json()) as { results?: [] };
        const results = toLiveResults(data.results ?? [], new Date().toISOString());
        if (cache.size > 100) cache.clear();
        cache.set(q, { at: Date.now(), results });
        return json({ results });
      },
    },
  },
});
