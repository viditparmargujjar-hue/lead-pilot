# LeadPilot upgrade

## Live lead-results experience
- [ ] Normalize Tavily results and existing cited research without fabricating missing facts.
- [ ] Add completeness, contact-aware cards, detailed profiles, summary metrics, filters, sorting, selection, and bulk CSV/Excel actions.
- [ ] Add Interested and Not Interested saved-lead statuses while preserving saved browser data.
- [ ] Test normalization/statuses and verify search, details, save, bulk actions, exports, and responsive layouts.

## Live result card accuracy
- [x] Filter unrelated and directory results locally; add honest source-based location and scoring summaries while preserving lead actions. Real Tavily search succeeded, saving/reload and comparison were verified; excerpts lacking requested locations are excluded, and remaining evidence gaps receive unavailable labels. No per-lead API calls added.

## Cited research PDF export
- [x] Add a browser-generated PDF export for saved live leads with cited facts, quotes, source links, signals, and clearly separated AI hypotheses; verified the downloaded three-page A4 document, clickable citations, both export controls and mobile layout.

## Follow-up conversion pipeline
- [x] Track sent, replied and converted outreach stages for each saved-lead follow-up, show the lead conversion rate, preserve existing tasks, and verify persistence and calculations; browser checks confirmed legacy defaults, 33%/67% updates, reload persistence and mobile layout.

## Lead intelligence accuracy
- [x] Ground company research in full Tavily page evidence, with cited fields and explicit unknowns.
- [x] Apply evidence-based Hot/Warm/Cold rules; separate search fit from recent buying intent.
- [x] Extend real-company comparison to 2–5 selections with explanations and replacement controls.
- [x] Verify live CoRover, Yellow.ai and Haptik discovery, saving/reload, comparison/removal, history and mobile layouts; no demo discovery or page errors.
- [ ] Complete three-company location, classification and citation verification — blocked by exhausted Lovable AI credits. Earlier real calls returned CoRover evidence/Warm and two Cold companies; latest named-company analysis correctly paused without invented results.

## Tavily integration
- [x] Approve the smallest implementation plan and enable Lovable Cloud.
- [x] Configure TAVILY_API_KEY securely.
- [x] Add bounded, cached live discovery and research with source-backed company records.
- [x] Extend saving, research, comparison and filters to live records while preserving saved workspace data.
- [x] Complete real Tavily search plus save/research/compare checks; further accuracy verification is tracked above.

- [x] Find Leads loading/error/empty states: "Finding relevant leads…" status, duplicate-submit guard, friendly classified AI errors with safe Retry (query and filters kept); other pages already had clear empty states.
- [x] Focused Find Leads search and combined filters: catalog name/keyword/location matching, inclusive score ranges, status and employee filters, reset controls and deduplication; 19 tests passed and browser checks verified Enter, trimming, three combined filters, reset, empty state, save persistence, breakdown and research at 1280/770/390/320px without overflow or runtime errors. Existing AI interpretation success remains unverified; matching works independently on fictional catalog data.

- [x] Refine existing lead cards only: company icons, compact metadata, labeled relevance rings, subtle badges, separated demo explanations and refined controls; save persistence, research, comparison and breakdown verified at 1280/770/390/320px with no overflow or runtime errors; 8 regression tests passed, data and surrounding sections unchanged.

- [x] Distinctive premium dashboard pass: stronger header, accented metrics, prominent recommendation cards with fictional-company labels, elegant quick actions and navy navigation; verified saving/persistence, research/search, all six quick actions, sidebar controls, desktop/tablet/mobile without overflow or runtime errors; 8 regression tests passed.

- [x] Focused dashboard polish: compact header, aligned metrics and recommendations, cleaner activity, preserved navigation; verified desktop/tablet/mobile, saving and persistence, research/search links, all navigation destinations, and 8 regression tests.

- [x] Reuse existing storage; remove automatic saved-lead seeding and test accurate metrics.
- [x] Group and expand the compact collapsible sidebar with all working routes.
- [x] Operational home: real metrics, saved/recommended leads, tasks, history and quick actions.
- [x] Persistent lead lists and follow-up creation, editing, completion and deletion.
- [x] Editable, copyable, explicitly template-based outreach drafts.
- [x] State-derived reports, CSV export and safe catalog-only CSV import.
- [x] Functional display/default-view settings and honest data-management notices.
- [x] Regression tests, route checks and desktop/mobile workflow verification.
## Limits
- CSV import is intentionally limited to existing catalog company names; arbitrary company imports are not supported.
- Browser-only persistence is retained; no cross-device sync, email sending or calendar reminders.
- Outreach is an explicitly labeled template, not live AI. The existing search AI provider response was not separately verified.
- Automated tests and browser checks passed; manual review of list deletion confirmation is still recommended.
