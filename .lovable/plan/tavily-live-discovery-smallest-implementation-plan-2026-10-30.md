# Tavily live discovery — smallest implementation plan

## Preserve the app
Keep the existing dashboard, navigation, styling, demo catalog and working tools. Add **Live web / Demo catalog** choices to Find Leads, defaulting new searches to Live web. Never show demo results after a live-search failure.

## 1. Secure Tavily setup
- Enable Lovable Cloud for secure server-side integration; keep existing browser-saved workspace data in place rather than introducing accounts or moving data in this phase.
- Request **TAVILY_API_KEY** through the secure Secrets form. Obtain it from the Tavily dashboard; never put it in a page or frontend code.
- Use the existing TanStack server boundary running at the edge, not a second standalone function service.

## 2. Live search and evidence
- Send the existing search text to Tavily, supporting company names, industries, locations, services and keywords.
- Limit each search to **10 web results**, use basic search, cache identical normalized requests for **15 minutes**, and reuse simultaneous identical requests. Bound the cache and handle timeout, invalid-key, rate-limit and service errors without automatic request loops.
- Analyze returned evidence through a separate call using the existing Lovable AI integration. Preserve the current demo AI call unchanged. If AI analysis fails, show the sourced search results and its error, not fabricated company records.
- Prefer official sites; treat directories/articles as supporting discovery sources, not companies themselves. Deduplicate company candidates by supported website/domain; identify uncertain website ownership honestly.
- Store source URLs, fetched time, any returned publication dates and supporting excerpts. Only populate facts supported by returned evidence; unknown location, contacts, employee count and revenue remain unavailable. Search snippets and AI inferences are never called independently verified.
- Calculate explainable relevance from available evidence; unknown factors stay unknown and scores are not automatically 100%.

## 3. Reuse lead workflows
- Extend the shared lead record lookup to resolve both existing catalog IDs and source-backed live records. Preserve previously saved demo leads and browser persistence.
- Reuse existing cards and controls with live descriptions, clickable websites/sources, evidence labels and timestamps.
- Keep Save Lead, My Leads, Research and Compare working with live records, including after refresh. Research uses a bounded Tavily search scoped to the selected company's supported domain, with explicit refresh and fetched time.
- Extend existing filters to live fields without inventing missing values. A company with unknown employee count will not match an employee-range filter.
- Update dependent lists, tasks, outreach templates, dashboard metrics and CSV exports only where required to recognize live saved records. Preserve catalog-only CSV import.
- Correct Settings and other demo-only notices so they accurately distinguish live and demo data. Do not add provider-key inputs to Settings.

## 4. Verify before claiming success
- Add focused tests for source integrity, unknown fields, domain deduplication, score bounds, filter behavior, cache expiry and saved-record compatibility; run existing regression tests.
- Make a real Tavily request for **“AI companies in Meerut India”**. Check returned sources and disclose unavailable fields or insufficient company evidence.
- Exercise search → save → refresh → research → compare through the app. Check that live failures never show fictional matches.
- Report any credential, credit or provider-access blocker. Do not claim live search works unless the real Tavily request succeeds.

## Scope and costs
No Apollo, other paid APIs, app rebuild, email sending, sign-in or cross-device sync. Tavily requests consume your Tavily credits; the added evidence analysis consumes Lovable AI credits. Basic search uses one Tavily API credit per request; research is a separate request when not cached.

## Technical details
Use Worker-compatible `fetch` on the server, validated inputs and safe error responses. Add a separate live-search/analysis boundary rather than changing `/api/rank`'s catalog contract. Keep secrets server-only, use the existing streaming AI integration pattern with the required gateway SDK helpers, and store live evidence snapshots alongside ID-based workspace references. The implementation must account for every existing catalog-only reader so real leads do not disappear from saved views or metrics.