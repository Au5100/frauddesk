import { useMemo, useState } from "react";
import { Button, NumberInput, Slider } from "@carbon/react";
import {
  DEFAULT_FRICTION,
  LIVE_THRESHOLD,
  buildMemo,
  costsAt,
  minCost,
  num,
  pctText,
  sgd,
  totalCostAt,
} from "./economics";

const ACCENT = "#4589ff";

function kFormat(n: number): string {
  return n >= 1000 ? `S$${Math.round(n / 1000)}k` : `S$${Math.round(n)}`;
}

function CostChart({
  theta,
  friction,
  onSetTheta,
}: {
  theta: number;
  friction: number;
  onSetTheta: (t: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const { path, yOf, xOf, yMin, yMax, best } = useMemo(() => {
    const totals: number[] = [];
    for (let t = 1; t <= 99; t += 1) totals.push(totalCostAt(t, friction));
    const lo = Math.min(...totals);
    const hi = Math.max(...totals);
    const pad = (hi - lo) * 0.08;
    const yMinV = lo - pad;
    const yMaxV = hi + pad;
    const xOfF = (t: number) => 46 + ((t - 1) / 98) * 574;
    const yOfF = (v: number) => 196 - ((v - yMinV) / (yMaxV - yMinV)) * 176;
    const d = totals
      .map((v, i) => `${i === 0 ? "M" : "L"}${xOfF(i + 1).toFixed(1)},${yOfF(v).toFixed(1)}`)
      .join(" ");
    return { path: d, yOf: yOfF, xOf: xOfF, yMin: yMinV, yMax: yMaxV, best: minCost(friction) };
  }, [friction]);

  const thetaFromEvent = (e: { clientX: number; currentTarget: SVGSVGElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 640;
    return Math.min(99, Math.max(1, Math.round(1 + ((x - 46) / 574) * 98)));
  };

  const gridVals = [0.25, 0.5, 0.75].map((f) => yMin + (yMax - yMin) * f);
  const cur = totalCostAt(theta, friction);

  return (
    <figure className="fd-chart" aria-label="Total daily cost against review threshold">
      <figcaption className="fd-chart-title">
        Total daily cost against threshold, at {sgd.format(friction)} friction per held payment.
        Click the curve to move the threshold.
      </figcaption>
      <svg
        viewBox="0 0 640 230"
        role="img"
        aria-label={`Cost curve. Current threshold ${theta}, total ${sgd.format(cur)}. Minimum at threshold ${best.theta}, ${sgd.format(best.total)}.`}
        onPointerMove={(e) => setHover(thetaFromEvent(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => onSetTheta(thetaFromEvent(e))}
      >
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={46} x2={620} y1={yOf(v)} y2={yOf(v)} className="fd-grid" />
            <text x={40} y={yOf(v) + 3} className="fd-axis-label" textAnchor="end">
              {kFormat(v)}
            </text>
          </g>
        ))}
        <line x1={46} x2={620} y1={196} y2={196} className="fd-axis" />
        {[1, 25, 50, 75, 99].map((t) => (
          <text key={t} x={xOf(t)} y={212} className="fd-axis-label" textAnchor="middle">
            {t}
          </text>
        ))}
        <text x={333} y={228} className="fd-axis-label" textAnchor="middle">
          Review threshold
        </text>

        <path d={path} fill="none" stroke={ACCENT} strokeWidth={2} />

        {hover !== null && hover !== theta && (
          <g>
            <line
              x1={xOf(hover)}
              x2={xOf(hover)}
              y1={20}
              y2={196}
              className="fd-ghost"
            />
            <text x={xOf(hover) < 333 ? 620 : 52} y={16} className="fd-hover-label" textAnchor={xOf(hover) < 333 ? "end" : "start"}>
              {hover}: {sgd.format(totalCostAt(hover, friction))}
            </text>
          </g>
        )}

        <g>
          <circle cx={xOf(best.theta)} cy={yOf(best.total)} r={5} fill="none" stroke={ACCENT} strokeWidth={2} />
          <text
            x={xOf(best.theta)}
            y={yOf(best.total) - 10}
            className="fd-point-label"
            textAnchor="middle"
          >
            min {kFormat(best.total)} at {best.theta}
          </text>
        </g>

        <g>
          <line x1={xOf(theta)} x2={xOf(theta)} y1={20} y2={196} className="fd-current-line" />
          <circle cx={xOf(theta)} cy={yOf(cur)} r={6} fill={ACCENT} stroke="var(--cds-background)" strokeWidth={2} />
          <text
            x={xOf(theta)}
            y={yOf(cur) + 20}
            className="fd-point-label"
            textAnchor="middle"
          >
            now {kFormat(cur)}
          </text>
        </g>
      </svg>
    </figure>
  );
}

export default function CockpitView() {
  const [theta, setTheta] = useState(LIVE_THRESHOLD);
  const [friction, setFriction] = useState(DEFAULT_FRICTION);
  const c = costsAt(theta, friction);
  const best = minCost(friction);
  const memo = buildMemo(theta, friction);

  return (
    <section aria-label="Threshold economics">
      <div className="fd-cockpit-controls">
        <div className="fd-slider">
          <Slider
            labelText="Review threshold"
            min={1}
            max={99}
            value={theta}
            onChange={({ value }) => setTheta(value)}
          />
        </div>
        <NumberInput
          id="friction"
          label="Friction per held legitimate payment (S$, assumption)"
          min={0}
          max={500}
          step={5}
          value={friction}
          onChange={(_e, { value }) => {
            const v = typeof value === "number" ? value : parseInt(String(value), 10);
            if (!Number.isNaN(v)) setFriction(Math.min(500, Math.max(0, v)));
          }}
        />
        <div className="fd-cockpit-actions">
          <Button kind="tertiary" size="sm" onClick={() => setTheta(best.theta)}>
            Set to cost minimum
          </Button>
          <Button kind="ghost" size="sm" onClick={() => setTheta(LIVE_THRESHOLD)}>
            Back to live setting (60)
          </Button>
        </div>
      </div>

      <div className="fd-stats fd-stats-wide" role="group" aria-label="Economics at this threshold">
        <div className="fd-stat">
          <span className="fd-stat-label">Total daily cost</span>
          <span className="fd-stat-value">{sgd.format(c.total)}</span>
          <span className="fd-stat-note">missed fraud + review + friction</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Fraud value caught</span>
          <span className="fd-stat-value">{sgd.format(c.caughtValue)}</span>
          <span className="fd-stat-note">{pctText(c.caughtPct)}% of {sgd.format(c.caughtValue + c.missedValue)}</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Fraud value missed</span>
          <span className="fd-stat-value">{sgd.format(c.missedValue)}</span>
          <span className="fd-stat-note">slips through at this setting</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Analysts needed</span>
          <span className="fd-stat-value">{c.analysts}</span>
          <span className="fd-stat-note">same day clearance, 48 alerts each</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Alerts per day</span>
          <span className="fd-stat-value">{num.format(c.alerts)}</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Review cost</span>
          <span className="fd-stat-value">{sgd.format(c.reviewMid)}</span>
          <span className="fd-stat-note">{sgd.format(c.reviewLow)} to {sgd.format(c.reviewHigh)} band</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Customer friction</span>
          <span className="fd-stat-value">{sgd.format(c.frictionCost)}</span>
          <span className="fd-stat-note">{num.format(c.falsePositives)} held x {sgd.format(friction)}</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">False positive share</span>
          <span className="fd-stat-value">{c.fpShare.toFixed(0)}%</span>
        </div>
      </div>

      <CostChart theta={theta} friction={friction} onSetTheta={setTheta} />

      <section className="fd-memo" aria-label="Decision memo">
        <div className="fd-memo-head">
          <h3>Decision memo</h3>
          <Button kind="ghost" size="sm" onClick={() => window.print()}>
            Print memo
          </Button>
        </div>
        {memo.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </section>
    </section>
  );
}
