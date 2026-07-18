# HANDOVER

Read this before working on FraudDesk.

## State after 0.2.0 (2026-07-18)

Two views behind a content switcher (src/App.tsx), both stay mounted so the replay never resets. Triage queue: replay engine (src/useReplay.ts), queue UI (src/QueueView.tsx). Threshold economics: precomputed per threshold curves and memo builder (src/economics.ts), cockpit with slider, friction assumption, cost curve SVG and printable decision memo (src/CockpitView.tsx). Methods panel (src/MethodsModal.tsx). Seeded generator (scripts/generate-data.mjs) with committed output (src/data/transactions.json). Deploys to GitHub Pages via .github/workflows/deploy.yml on push to main. Vite base is /frauddesk/. Shared formatters live in economics.ts.

## Session conventions

- Every working session ends deployed: build clean, changelog entry dated, push, verify the live URL renders.
- One increment per session, from the backlog in docs/SPEC.md, plus its changelog entry.
- The methods panel is a contract. If a number or behavior changes, the panel changes in the same commit.
- The scorer must never read the fraud label. Evaluation work uses the label offline and reports honestly.
- No backend, no API keys, no user accounts, no analytics services. GitHub repo traffic stats are the only instrumentation.
- UI copy: no em dashes, plain language reason codes, estimates labeled as estimates.

## Next milestone (S3): scenario injection

- Inject typology waves into the replay or the economics view: an official impersonation burst at several times normal volume, a new mule pattern the scorer half misses.
- Show precision decay when the mix shifts, and the SRF floor still catching its slice.
- Before and after comparison of the cost curve under the scenario.
- A governance beat: what deviation triggers retraining and who signs off.
- Changelog 0.3.0. The trained model with an evaluation page remains the milestone after (backlog item 3 in docs/SPEC.md).
