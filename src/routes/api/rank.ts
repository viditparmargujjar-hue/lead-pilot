import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { companies } from "@/lib/data";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";

const pct = { type: "integer", minimum: 0, maximum: 100 };
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["interpretation", "results"],
  properties: {
    interpretation: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "industry", "location", "employees", "relevance"],
      properties: {
        summary: { type: "string" },
        industry: { type: ["string", "null"] },
        location: { type: ["string", "null"] },
        employees: { type: ["string", "null"] },
        relevance: { type: ["string", "null"] },
      },
    },
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "industry", "location", "size", "relevance", "why"],
        properties: { id: { type: "string" }, industry: pct, location: pct, size: pct, relevance: pct, why: { type: "string" } },
      },
    },
  },
};

const SYSTEM = `You are LeadPilot AI, a B2B lead-ranking assistant.
Given a sales user's plain-language description of ideal leads and a list of FICTIONAL demo companies, interpret the request and rank the best-matching companies.
Rules:
- Only use companies from the provided list, referencing them by id. Return up to 12, best first; omit clear non-matches.
- For each, give 0-100 match percentages for industry, location, company size and business relevance.
- "why" is one concise sentence (max 25 words) explaining why the company may be a good lead. Base it on the listed data; phrase any inferred need as a possibility ("may", "could"), never as verified fact.
- interpretation.summary: one sentence starting "You asked for..." restating the request. Other interpretation fields: short values or null if not specified.
- Never invent people, emails, phone numbers or social profiles.`;

const Input = z.object({ query: z.string().trim().min(3).max(1000) });

export const Route = createFileRoute("/api/rank")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Input.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Please describe your ideal leads in a few words." }, { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured for this app." }, { status: 500 });

        const list = companies
          .map((c) => `${c.id} | ${c.name} | ${c.industry} | ${c.city}, ${c.country} (${c.region}) | ${c.employees} employees | focus: ${c.tags.join(", ")}`)
          .join("\n");

        try {
          const upstream = await fetch(GATEWAY, {
            method: "POST",
            signal: request.signal,
            headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
            body: JSON.stringify({
              model: MODEL,
              stream: true,
              store: false,
              reasoning: { effort: "low", summary: "auto" },
              include: ["reasoning.encrypted_content"],
              text: { format: { type: "json_schema", name: "lead_ranking", strict: true, schema } },
              input: [
                { role: "system", content: SYSTEM },
                { role: "user", content: `Ideal leads: ${parsed.data.query}\n\nCompanies:\n${list}` },
              ],
            }),
          });
          if (!upstream.ok) {
            const body = await upstream.text();
            console.error(`AI gateway error [${upstream.status}]: ${body}`);
            let message = "Something went wrong while ranking. Please try again.";
            if (upstream.status === 429) message = "The AI is busy right now. Please wait a moment and try again.";
            else if (upstream.status === 402) message = "AI credits have run out for this workspace. Please add credits to continue.";
            else if (upstream.status === 403) message = "AI access is currently blocked for this workspace.";
            return Response.json({ error: message }, { status: upstream.status });
          }
          return new Response(upstream.body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
        } catch (e) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          console.error(e);
          return Response.json({ error: "Something went wrong while ranking. Please try again." }, { status: 502 });
        }
      },
    },
  },
});
