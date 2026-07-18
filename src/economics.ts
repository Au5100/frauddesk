import rawTxns from "./data/transactions.json";
import type { Txn } from "./types";

export const txns = rawTxns as Txn[];

/** Cited industry band for analyst time per alert reviewed. */
export const REVIEW_COST_LOW = 25;
export const REVIEW_COST_HIGH = 50;
export const REVIEW_COST_MID = 37;
/** One analyst clears about 8 alerts an hour across a 6 hour shift. */
export const ALERTS_PER_ANALYST_DAY = 48;
/** The threshold the live triage queue runs at. */
export const LIVE_THRESHOLD = 60;
/** Default assumption for the cost of holding one legitimate payment. */
export const DEFAULT_FRICTION = 15;

export const num = new Intl.NumberFormat("en-SG");
export const sgd = { format: (n: number) => `S$${num.format(Math.round(n))}` };

/** Percent text that never rounds a partial catch up to 100. */
export function pctText(p: number): string {
  if (p >= 99.95) return "100";
  return p > 99 ? p.toFixed(1) : p.toFixed(0);
}

export interface StaticPoint {
  theta: number;
  alerts: number;
  fraudAlerts: number;
  falsePositives: number;
  caughtValue: number;
  missedValue: number;
}

const fraudRows = txns.filter((t) => t.fraud);
export const TOTAL_FRAUD_VALUE = fraudRows.reduce((s, t) => s + t.amount, 0);
export const TOTAL_FRAUD_ROWS = fraudRows.length;
export const SRF_HOLDS = txns.filter((t) => t.srfHold).length;

/**
 * Static per-threshold aggregates, computed once from the committed dataset.
 * SRF holds count as alerts at every threshold: the rule layer does not move
 * with the slider.
 */
export const points: StaticPoint[] = (() => {
  const out: StaticPoint[] = [];
  for (let theta = 1; theta <= 99; theta += 1) {
    let alerts = 0;
    let fraudAlerts = 0;
    let caughtValue = 0;
    for (const t of txns) {
      if (t.score >= theta || t.srfHold) {
        alerts += 1;
        if (t.fraud) {
          fraudAlerts += 1;
          caughtValue += t.amount;
        }
      }
    }
    out.push({
      theta,
      alerts,
      fraudAlerts,
      falsePositives: alerts - fraudAlerts,
      caughtValue,
      missedValue: TOTAL_FRAUD_VALUE - caughtValue,
    });
  }
  return out;
})();

export interface Costs {
  theta: number;
  alerts: number;
  fraudAlerts: number;
  falsePositives: number;
  caughtValue: number;
  missedValue: number;
  caughtPct: number;
  fpShare: number;
  reviewLow: number;
  reviewMid: number;
  reviewHigh: number;
  frictionCost: number;
  total: number;
  analysts: number;
}

export function costsAt(theta: number, friction: number): Costs {
  const p = points[Math.min(Math.max(Math.round(theta), 1), 99) - 1];
  const reviewMid = p.alerts * REVIEW_COST_MID;
  const frictionCost = p.falsePositives * friction;
  return {
    theta: p.theta,
    alerts: p.alerts,
    fraudAlerts: p.fraudAlerts,
    falsePositives: p.falsePositives,
    caughtValue: p.caughtValue,
    missedValue: p.missedValue,
    caughtPct: TOTAL_FRAUD_VALUE > 0 ? (p.caughtValue / TOTAL_FRAUD_VALUE) * 100 : 0,
    fpShare: p.alerts > 0 ? (p.falsePositives / p.alerts) * 100 : 0,
    reviewLow: p.alerts * REVIEW_COST_LOW,
    reviewMid,
    reviewHigh: p.alerts * REVIEW_COST_HIGH,
    frictionCost,
    total: p.missedValue + reviewMid + frictionCost,
    analysts: Math.max(1, Math.ceil(p.alerts / ALERTS_PER_ANALYST_DAY)),
  };
}

export function totalCostAt(theta: number, friction: number): number {
  const p = points[theta - 1];
  return p.missedValue + p.alerts * REVIEW_COST_MID + p.falsePositives * friction;
}

export function minCost(friction: number): { theta: number; total: number } {
  let best = { theta: 1, total: Number.POSITIVE_INFINITY };
  for (const p of points) {
    const total = p.missedValue + p.alerts * REVIEW_COST_MID + p.falsePositives * friction;
    if (total < best.total) best = { theta: p.theta, total };
  }
  return best;
}

/**
 * The decision memo: deterministic prose regenerated from the chosen
 * threshold and the friction assumption. Plain language, no verdict hiding.
 */
export function buildMemo(theta: number, friction: number): string[] {
  const c = costsAt(theta, friction);
  const best = minCost(friction);
  const atBest = costsAt(best.theta, friction);
  const delta = c.total - best.total;

  const p1 =
    `Position. At a review threshold of ${c.theta}, the day produces ` +
    `${num.format(c.alerts)} alerts, needing ${c.analysts} analyst${c.analysts === 1 ? "" : "s"} ` +
    `for same day clearance. The queue intercepts ${sgd.format(c.caughtValue)} of ` +
    `${sgd.format(TOTAL_FRAUD_VALUE)} in fraudulent transaction value (${pctText(c.caughtPct)}%), ` +
    `missing ${sgd.format(c.missedValue)}. Review runs ${sgd.format(c.reviewLow)} to ` +
    `${sgd.format(c.reviewHigh)} in analyst time. At the assumed ${sgd.format(friction)} per held ` +
    `legitimate payment, customer friction adds ${sgd.format(c.frictionCost)} across ` +
    `${num.format(c.falsePositives)} false positives. Total daily cost of the operation at this ` +
    `position: ${sgd.format(c.total)}.`;

  let p2: string;
  if (Math.abs(c.theta - best.theta) <= 3 || (best.total > 0 && delta / best.total < 0.05)) {
    p2 =
      `Recommendation. Hold at ${c.theta}. The cost minimum on this data sits at ${best.theta}, ` +
      `and the difference (${sgd.format(Math.abs(delta))} per day) is inside the noise of the ` +
      `assumptions. Spend attention on the watch items below rather than tuning further.`;
  } else if (c.theta < best.theta) {
    p2 =
      `Recommendation. Consider raising the threshold toward ${best.theta}. On this data it cuts ` +
      `total daily cost by ${sgd.format(delta)} (to ${sgd.format(best.total)}), trading ` +
      `${sgd.format(atBest.missedValue - c.missedValue)} more missed fraud value for ` +
      `${num.format(c.alerts - atBest.alerts)} fewer reviews and ` +
      `${num.format(c.falsePositives - atBest.falsePositives)} fewer held customers. Whether that ` +
      `trade is acceptable is a risk appetite call, not an analytics one; this memo prices it.`;
  } else {
    p2 =
      `Recommendation. Consider lowering the threshold toward ${best.theta}. On this data it cuts ` +
      `total daily cost by ${sgd.format(delta)} (to ${sgd.format(best.total)}): the extra ` +
      `${num.format(atBest.alerts - c.alerts)} reviews and ` +
      `${num.format(atBest.falsePositives - c.falsePositives)} held customers cost less than the ` +
      `${sgd.format(c.missedValue - atBest.missedValue)} of fraud value currently slipping ` +
      `through. Staffing must move with it: ${atBest.analysts} analysts at the new position.`;
  }

  const p3 =
    `Floors and watch items. ${SRF_HOLDS} transactions meet the SRF rapid draining definition and ` +
    `are held at any threshold; the slider cannot trade those away. The current scorer ` +
    `under detects small ticket job scam transfers at every position, so the missed value line ` +
    `understates that typology until the trained model ships. Escalate and revisit this memo if ` +
    `the false positive share holds above 90 percent for a week, or if daily alerts exceed same ` +
    `day analyst capacity three days running.`;

  const p4 =
    `Basis. All figures come from one committed synthetic day (${num.format(txns.length)} ` +
    `transactions, ${TOTAL_FRAUD_ROWS} fraudulent). Review cost uses the cited S$${REVIEW_COST_LOW} ` +
    `to S$${REVIEW_COST_HIGH} industry band. The friction figure is an explicit assumption, set it ` +
    `in the cockpit. Nothing here is real customer data.`;

  return [p1, p2, p3, p4];
}
