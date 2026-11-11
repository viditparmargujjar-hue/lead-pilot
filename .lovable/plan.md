# Live lead-results upgrade

## Scope
Improve the existing live Tavily results on Find Leads without rebuilding the app, altering its API, or inventing unavailable business details. Existing search, research, comparison, saved leads, and browser persistence remain intact.

## Work
- Normalize each result from the fields Tavily actually returns, supplementing only with already stored cited research; preserve unknowns and expose source and retrieval information.
- Refine live lead cards with a factual completeness indicator, source-backed contact links, and a structured details drawer; keep unavailable actions hidden.
- Add results summary metrics, relevant contact/completeness filters, sorting, selection and bulk save/remove/export actions, plus CSV and Excel exports using the existing export dependency.
- Extend saved-lead statuses with Interested and Not Interested while preserving existing stored records and statuses.
- Add focused regression tests for normalization/completeness and the new saved statuses, then verify the live-search results workflow and responsive presentation.

## Technical approach
Keep discovery and filtering browser-side, reuse the existing Tavily response shape, `lead-profile` helpers, browser-persisted store, design-system controls, and XLSX dependency. No schema migration or extra paid API calls. Results remain limited to information supplied by Tavily or existing quote-validated research; data absent from those sources stays blank or explicitly unavailable.
