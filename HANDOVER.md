# HANDOVER

Read this before working on FraudDesk.

## State after 0.1.0 (2026-07-18)

Triage queue view is live: replay engine (src/useReplay.ts), queue UI (src/QueueView.tsx), methods panel (src/MethodsModal.tsx), seeded generator (scripts/generate-data.mjs) with committed output (src/data/transactions.json). Deploys to GitHub Pages via .github/workflows/deploy.yml on push to main. Vite base is /frauddesk/.

## Session conventions

- Every working session ends deployed: build clean, changelog entry dated, push, verify the live URL renders.
- One increment per session, from the backlog in docs/SPEC.md, plus its changelog entry.
- The methods panel is a contract. If a number or behavior changes, the panel changes in the same commit.
- The scorer must never read the fraud label. Evaluation work uses the label offline and reports honestly.
- No backend, no API keys, no user accounts, no analytics services. GitHub repo traffic stats are the only instrumentation.
- UI copy: no em dashes, plain language reason codes, estimates labeled as estimates.

## Next milestone (S2): threshold economics + memo

- Slider over the review threshold; recompute from the committed dataset client side.
- Dollar lines: fraud caught, fraud missed (typology weighted), review cost (S$25 to S$50 per alert band, show the band not just the midpoint), friction cost of holding legitimate payments.
- Analyst headcount implied by alert volume at the chosen threshold.
- Decision memo panel: one paragraph of prose regenerated from the slider position, print styled.
- Changelog 0.2.0.
