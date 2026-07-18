import { useMemo, useState } from "react";
import { Button, ContentSwitcher, Switch, Tag } from "@carbon/react";
import type { Txn } from "./types";
import {
  ANALYSTS_ON_SHIFT,
  SLA_TARGET_SEC,
  formatAge,
  formatSimClock,
  useReplay,
} from "./useReplay";

const SPEEDS = [1, 5, 20] as const;
const MAX_ROWS = 40;

const num = new Intl.NumberFormat("en-SG");
const sgd = { format: (n: number) => `S$${num.format(Math.round(n))}` };

function ScoreTag({ txn }: { txn: Txn }) {
  const type = txn.score >= 85 ? "red" : txn.score >= 70 ? "magenta" : "gray";
  return (
    <Tag type={type} size="sm" className="fd-score-tag">
      {txn.score}
    </Tag>
  );
}

export default function QueueView({ txns }: { txns: Txn[] }) {
  const [speedIndex, setSpeedIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const snap = useReplay(txns, SPEEDS[speedIndex], paused, resetKey);
  const slaBreached = snap.oldestAgeSec !== null && snap.oldestAgeSec > SLA_TARGET_SEC;
  const rows = useMemo(() => snap.open.slice(0, MAX_ROWS), [snap.open]);
  const hidden = snap.open.length - rows.length;

  return (
    <section aria-label="Fraud triage queue">
      <div className="fd-controls">
        <span className="fd-clock" aria-label="Simulated clock">
          Sim clock {formatSimClock(snap.simTime)}
        </span>
        <ContentSwitcher
          size="sm"
          selectedIndex={speedIndex}
          onChange={({ index }) => typeof index === "number" && setSpeedIndex(index)}
          className="fd-speed"
        >
          {SPEEDS.map((s) => (
            <Switch key={s} name={`${s}x`} text={`${s}x`} />
          ))}
        </ContentSwitcher>
        <Button kind="ghost" size="sm" onClick={() => setPaused((p) => !p)}>
          {paused ? "Resume" : "Pause"}
        </Button>
        {snap.finished && (
          <Button
            kind="tertiary"
            size="sm"
            onClick={() => {
              setResetKey((k) => k + 1);
              setExpandedId(null);
            }}
          >
            Restart replay
          </Button>
        )}
      </div>

      <div className="fd-stats" role="group" aria-label="Queue statistics">
        <div className="fd-stat">
          <span className="fd-stat-label">Open alerts</span>
          <span className="fd-stat-value">{num.format(snap.open.length)}</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Oldest alert</span>
          <span className={`fd-stat-value${slaBreached ? " fd-sla-breach" : ""}`}>
            {snap.oldestAgeSec === null ? "0:00" : formatAge(snap.oldestAgeSec)}
          </span>
          <span className="fd-stat-note">SLA target 30:00</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Alerts per hour</span>
          <span className="fd-stat-value">{num.format(snap.alertsLastHour)}</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Est. review cost per hour</span>
          <span className="fd-stat-value">{sgd.format(snap.costLastHour)}</span>
          <span className="fd-stat-note">at S$37 per alert, cited midpoint</span>
        </div>
      </div>

      <p className="fd-throughput">
        {num.format(snap.screened)} transactions screened, {num.format(snap.autoCleared)} cleared
        below threshold, {num.format(snap.resolved)} resolved by {ANALYSTS_ON_SHIFT} analysts on
        shift.
      </p>

      {rows.length === 0 ? (
        <p className="fd-empty">
          {snap.finished ? "Replay complete. Restart to run the day again." : "Screening transactions, first alerts arrive shortly."}
        </p>
      ) : (
        <table className="fd-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Score</th>
              <th scope="col">Type</th>
              <th scope="col" className="fd-right">
                Amount
              </th>
              <th scope="col">Account</th>
              <th scope="col">Signals</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ txn, enqueuedAt }) => {
              const expanded = expandedId === txn.id;
              return (
                <FragmentRow
                  key={txn.id}
                  txn={txn}
                  enqueuedAt={enqueuedAt}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : txn.id)}
                />
              );
            })}
          </tbody>
        </table>
      )}
      {hidden > 0 && <p className="fd-more">{num.format(hidden)} more alerts in queue.</p>}
    </section>
  );
}

function FragmentRow({
  txn,
  enqueuedAt,
  expanded,
  onToggle,
}: {
  txn: Txn;
  enqueuedAt: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="fd-row"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        aria-expanded={expanded}
      >
        <td className="fd-mono">{formatSimClock(enqueuedAt)}</td>
        <td>
          <ScoreTag txn={txn} />
          {txn.srfHold && (
            <Tag type="high-contrast" size="sm">
              SRF hold
            </Tag>
          )}
        </td>
        <td>{txn.type.replace("_", " ")}</td>
        <td className="fd-right fd-mono">{sgd.format(txn.amount)}</td>
        <td className="fd-mono">{txn.account}</td>
        <td className="fd-signals">
          {txn.reasons[0] ?? "Rule hold"}
          {txn.reasons.length > 1 && (
            <span className="fd-more-signals"> +{txn.reasons.length - 1}</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="fd-detail">
          <td colSpan={6}>
            <div className="fd-detail-grid">
              <div>
                <span className="fd-stat-label">Balance before</span>
                <span className="fd-mono">{sgd.format(txn.balanceBefore)}</span>
              </div>
              <div>
                <span className="fd-stat-label">Share of balance</span>
                <span className="fd-mono">
                  {Math.round((txn.amount / Math.max(txn.balanceBefore, 1)) * 100)}%
                </span>
              </div>
              <div>
                <span className="fd-stat-label">Destination</span>
                <span className="fd-mono">
                  {txn.dest}
                  {txn.destNew ? ", first payment" : ""}
                </span>
              </div>
              <div>
                <span className="fd-stat-label">Destination account age</span>
                <span className="fd-mono">{txn.destAgeDays} days</span>
              </div>
            </div>
            <ul className="fd-reasons">
              {txn.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
              {txn.srfHold && <li>Meets the SRF rapid draining definition, mandatory hold</li>}
            </ul>
            <p className="fd-detail-note">
              Outcome labels stay hidden during triage. Scoring reasons above are the exact rules
              that fired.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
