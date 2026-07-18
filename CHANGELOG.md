# Changelog

## 0.1.0, 2026-07-18

First public version.

- Streaming triage queue replaying one simulated day (09:00 to 15:00) of synthetic transactions
- Transparent heuristic scorer with plain language reason codes on every alert
- SRF rule layer: rapid draining definition from MAS's Shared Responsibility Framework applied on top of the score as a mandatory hold
- Three analyst shift simulation: queue depth, oldest alert SLA, throughput and estimated review cost per hour
- Methods panel covering data provenance, cited estimates, and known limits
- Deterministic dataset generator (seeded, committed output, no external data)
- Plain language overview with use cases and integration notes in docs/OVERVIEW.md
