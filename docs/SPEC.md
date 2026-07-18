# FraudDesk spec (condensed)

## Premise

Fraud detection portfolio pieces usually ship a classifier and stop. The operating decision that matters in a real bank is downstream of the model: where to set the review threshold, what that does to alert volume, analyst headcount, review spend, customer friction, and what a committee needs to sign off on it. FraudDesk makes that decision legible.

## Views

1. **Triage queue** (shipped in 0.1.0). Streaming replay of scored synthetic transactions. Reason codes in plain language, SRF rule holds layered over the score, analyst pool clearing alerts, SLA and cost counters.
2. **Threshold economics** (next). One slider, four dollar lines: fraud caught, fraud missed, review cost, customer friction from blocked legitimate payments. Analyst headcount implied by volume. A generated one page decision memo that updates with the slider position and prints cleanly.
3. **Scenarios** (after). Inject typology shifts, for example an official impersonation wave, and watch score precision decay while the SRF rule keeps catching its slice. A governance beat: what triggers retraining and who signs off.

## Data rules

- Generator is seeded and committed; its JSON output is committed too. Reproducible by anyone.
- No external data downloads, no accounts, no keys, ever.
- Schema loosely follows PaySim conventions. PaySim's known traps are avoided deliberately: no naive flag column is used as a feature and the scorer never reads the outcome label.
- Real world numbers that appear in the UI are cited to their sources in the methods panel and marked as estimates where they are estimates.
- Bundle stays under 10 MB.

## Design rules

- IBM Carbon, g100, IBM Plex. Mono digits for all numbers.
- One interactive accent (Carbon blue). Red and orange strictly for severity semantics.
- No em dashes anywhere in UI copy. No decorative dots, no fake precision, no marketing verbs.
- Full states everywhere: loading, empty, finished.
- Reduced motion respected.

## Architecture

Static Vite + React site. All computation client side. Scores precomputed at generation time; the replay engine only schedules, queues, and aggregates. Deploys to GitHub Pages from a workflow on push to main.

## Backlog (ordered)

1. Threshold economics view plus decision memo
2. Scenario injection with typology shifts
3. Trained model (offline) with an evaluation page: precision recall curves, calibration, and honest comparison against the heuristic
4. Capacity planner: backlog projection under reduced headcount
5. Trade surveillance skin reusing the same engine
