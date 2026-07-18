# FraudDesk in plain terms

**Live demo:** [au5100.github.io/frauddesk](https://au5100.github.io/frauddesk/)

## The short version

FraudDesk is a working simulation of the screen a bank's fraud team stares at all day: the alert queue. It replays one invented banking day, 2,255 synthetic transactions from 09:00 to 15:00, through a risk scorer. Anything scoring above the review threshold, or tripping a regulatory rule, becomes an alert that one of three simulated analysts must clear. While it runs, the page shows what the operation costs: how many alerts are open, how old the oldest one is against a 30 minute service target, and roughly how much money the reviewing itself burns per hour.

No real data is involved anywhere. Every transaction comes from a seeded script committed in this repository, so anyone can regenerate the exact same day.

## The problem it illustrates

Fraud detection sounds like a technology problem. Day to day, it is mostly an operations problem. Industry sources put the false positive rate of transaction monitoring at 90 to 95 percent, meaning nine in ten alerts turn out to be innocent, and each one still costs an estimated S$25 to S$50 of analyst time to check. Tighten the detection threshold and you catch more fraud but bury your team and inconvenience good customers. Loosen it and the queue calms down while losses grow.

That threshold is therefore a management decision about money, people, and customer experience, not a modelling metric. FraudDesk exists to make that tradeoff visible and concrete.

## What you are looking at on screen

- **The queue.** Each row is an alert: time, score, transaction type, amount, account, and the signals that fired. Click a row for the full picture.
- **Scores and reason codes.** The score is 1 to 99. Every alert lists the exact rules that raised it, in plain language, for example "Cash out of 94% of balance" or "First payment to this destination". Nothing is a black box.
- **SRF hold tags.** Singapore's Shared Responsibility Framework, in force since 16 June 2025, requires banks to detect rapid account draining: an account holding S$50,000 or more where over half the balance leaves within 24 hours. FraudDesk applies a simplified per transaction version of that rule on top of the score. Rule hits are held for review no matter what the model thinks, which is how real systems layer regulation over models.
- **The counters.** Open alerts, oldest alert against the SLA, alerts per hour, and estimated review cost per hour. The line below them tracks everything screened, cleared, and resolved by the three-analyst shift.
- **Speed controls.** Run the day at 1x, 5x, or 20x, pause it, or restart it.

## Use cases

1. **A teaching and communication aid.** If you need to explain alert fatigue, false positive economics, or "why can't we just catch all the fraud" to a committee, a class, or a new joiner, this shows it live in two minutes without exposing anyone's real data.
2. **A sandbox for operational questions.** The simulation makes staffing and policy questions tangible: what happens to the queue when volume outruns three analysts, when does the SLA start breaking, what does an hour of reviewing cost. The planned threshold view extends this into a full what-if tool.
3. **A reference pattern.** The repo demonstrates a few patterns worth copying: plain language reason codes on every alert, regulatory rules layered over model scores rather than mixed into them, and a methods panel that separates real numbers from estimates from simulation.
4. **A demonstration project.** It was built to show operational judgment around fraud tooling, and it is honest about being a simulation. It is not a product and does not pretend to be one.

## How something like this would integrate into a real system

FraudDesk itself is not integration ready, by design. Its scorer is a transparent heuristic that runs once, offline, and the app replays the result. But the architecture it simulates maps directly onto how real fraud scoring is deployed:

1. **Feature pipeline.** Each incoming transaction is turned into a set of computed signals: balance ratios, payee history, account age, velocity counters. This pipeline, not the model, is usually the hardest integration work.
2. **Scoring service.** The trained model is packaged behind an internal API that returns a score plus reason codes within a strict latency budget, called by the payments flow before or just after authorisation.
3. **Decision engine.** The score never acts alone. A rules layer applies business thresholds and mandatory regulatory rules (the SRF hold in this simulation) and picks an action: allow, hold, step up verification, or route to review.
4. **Case management.** Routed alerts land in a queue for human analysts, with SLAs, capacity, and cost. This is the layer FraudDesk simulates.
5. **Governance loop.** Outcomes feed monitoring for drift, periodic validation, and controlled retraining, with audit trails throughout. A bank integrates a governed scoring service, never a bare model.

What transfers from this project into a real setting is the decision layer thinking: reason codes a human can act on, rules layered over scores, and the economics of the queue. What would not transfer is the model itself, which is trained on nothing real and says so.

## What is real and what is simulated

Real and cited: the MAS Shared Responsibility Framework rapid draining definition, the Singapore Police Force 2025 scam typologies used to shape fraudulent rows (official impersonation, investment scams, job scams, mule cash outs), and the industry estimates for review cost and false positive rates. Simulated: every transaction, account, analyst, and outcome. Placeholder: the scorer, until a trained model with a proper evaluation page ships. The in-app "Methods and sources" panel is the authoritative version of this list.

## Current limits

One simulated day, uniform arrival pattern, a fixed three-analyst shift, a 30 minute SLA chosen for the demo, and a simplified per transaction reading of the SRF rule. Measured on its own data the queue runs at about an 84 percent false positive share, slightly better than the industry range, because the day is small and the heuristic is tuned to it.

## Where it goes next

The roadmap in [SPEC.md](SPEC.md): a threshold economics view that prices fraud caught against review cost, customer friction, and analyst headcount as you move the slider, a one page decision memo generated from the chosen position, scenario injection for typology shifts, and a trained model evaluated honestly against this heuristic. Progress lands in [CHANGELOG.md](../CHANGELOG.md).
