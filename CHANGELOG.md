# Changelog

## 0.2.0, 2026-07-18

The threshold economics view and the decision memo.

- Slider over the review threshold, with total daily cost framed as missed fraud value plus review cost plus customer friction
- Friction (cost per held legitimate payment) is an adjustable input, labeled as an assumption in the UI and named in the memo
- Cost curve against threshold with current position and cost minimum marked; hover to read the curve, click it to move the threshold
- Analyst headcount for same day clearance, review cost band, false positive share, fraud value caught and missed at any position
- Decision memo regenerated live from the chosen position: position, recommendation with the trade priced, floors and watch items, basis; print styled so it exports as a one pager
- Queue and economics views switch without resetting the running replay
- Methods panel section covering the economics assumptions

## 0.1.0, 2026-07-18

First public version.

- Streaming triage queue replaying one simulated day (09:00 to 15:00) of synthetic transactions
- Transparent heuristic scorer with plain language reason codes on every alert
- SRF rule layer: rapid draining definition from MAS's Shared Responsibility Framework applied on top of the score as a mandatory hold
- Three analyst shift simulation: queue depth, oldest alert SLA, throughput and estimated review cost per hour
- Methods panel covering data provenance, cited estimates, and known limits
- Deterministic dataset generator (seeded, committed output, no external data)
- Plain language overview with use cases and integration notes in docs/OVERVIEW.md
