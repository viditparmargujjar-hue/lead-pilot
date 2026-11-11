<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Demo lead data and mock AI scoring live in src/lib (data.ts, ai.ts); saved leads persist in browser storage via src/lib/store.tsx — keeps the MVP backend-free.
- Search history persists in browser storage via src/lib/history.tsx (separate key from saved leads) — same backend-free MVP approach.
- Lists, follow-ups and display preferences share a separate browser-persisted workspace provider; references use saved company IDs and are cleaned on unsave to avoid duplicate company records and orphaned tasks.
- New browsers start with no saved leads; catalog recommendations never seed saved state, so dashboard metrics reflect user actions.
- CSV imports only save existing catalog matches with explicit validation and duplicate skipping; arbitrary company ingestion is excluded because the current scoring/research model is catalog-bound.
- Home-specific presentation is scoped under `.dashboard` in the shared stylesheet so dashboard refinement does not restyle unrelated pages.
- Lead-card presentation is scoped under `.lead-card` and reuses existing shared card controls; keep scoring and saved-state logic separate so visual upgrades cannot change lead data.
- Find Leads uses browser-safe catalog predicates in `src/lib/lead-search.ts`; filters narrow existing scored records without re-scoring, and optional existing AI interpretation cannot remove catalog matches or block results.
- Lovable Cloud is connected for secure server-side integrations; retain the existing browser workspace persistence until a separate migration is requested to preserve saved user data.
- Live intelligence uses versioned, quote-validated full-page Tavily evidence and deterministic scoring in `intelligence.ts`; discovery snippets never establish verified fields, and all views reuse the same stored analysis.
- Company evidence retrieval is a bounded, cached server-only Tavily helper called on explicit research actions; AI extraction preserves the existing Gateway model and cannot fetch arbitrary supplied URLs.
- Cited research PDFs are generated in the browser with pdf-lib from the stored Intelligence object — exports add no API usage and preserve claim quotes, source links and AI-hypothesis labels.
- Live discovery filtering and provisional card assessments are browser-only pure helpers; excerpts never upgrade locations to verified facts, and existing cited research is reused only for matching criteria to avoid extra API usage.
- Live result profiles normalize the actual Tavily excerpt and already stored quote-validated research in browser-safe `src/lib/lead-profile.ts`; missing facts remain unavailable and results never trigger additional enrichment calls.
