import { useEffect, useRef, useState } from "react";
import type { Alert, Txn } from "./types";

export const REVIEW_THRESHOLD = 60;
export const ANALYSTS_ON_SHIFT = 3;
/** Cited industry estimate: S$25 to S$50 of analyst time per alert. Midpoint used. */
export const COST_PER_ALERT_SGD = 37;
/** Queue service-level target for the oldest open alert, in seconds. */
export const SLA_TARGET_SEC = 30 * 60;
/** The simulated day starts at 09:00. */
export const SIM_START_HOUR = 9;

export interface Snapshot {
  simTime: number;
  open: Alert[];
  screened: number;
  autoCleared: number;
  resolved: number;
  alertsLastHour: number;
  costLastHour: number;
  oldestAgeSec: number | null;
  finished: boolean;
}

interface Engine {
  i: number;
  simTime: number;
  open: Alert[];
  screened: number;
  autoCleared: number;
  resolved: number;
  alertTimes: number[];
  analystFreeAt: number[];
  finished: boolean;
}

function freshEngine(): Engine {
  return {
    i: 0,
    simTime: 0,
    open: [],
    screened: 0,
    autoCleared: 0,
    resolved: 0,
    alertTimes: [],
    analystFreeAt: new Array(ANALYSTS_ON_SHIFT).fill(0),
    finished: false,
  };
}

/** Deterministic 5 to 10 minute handling time per resolved alert. */
function handleSec(n: number): number {
  return 300 + ((n * 97) % 300);
}

export function useReplay(txns: Txn[], speed: number, paused: boolean, resetKey: number): Snapshot {
  const engine = useRef<Engine>(freshEngine());
  const [snap, setSnap] = useState<Snapshot>(() => ({
    simTime: 0,
    open: [],
    screened: 0,
    autoCleared: 0,
    resolved: 0,
    alertsLastHour: 0,
    costLastHour: 0,
    oldestAgeSec: null,
    finished: false,
  }));

  useEffect(() => {
    engine.current = freshEngine();
  }, [resetKey, txns]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const e = engine.current;
      if (e.finished) return;
      e.simTime += 0.25 * speed;

      while (e.i < txns.length && txns[e.i].t <= e.simTime) {
        const txn = txns[e.i];
        e.i += 1;
        e.screened += 1;
        if (txn.score >= REVIEW_THRESHOLD || txn.srfHold) {
          e.open.push({ txn, enqueuedAt: txn.t });
          e.alertTimes.push(txn.t);
        } else {
          e.autoCleared += 1;
        }
      }

      for (let a = 0; a < e.analystFreeAt.length; a += 1) {
        while (e.open.length > 0 && e.analystFreeAt[a] <= e.simTime) {
          const alert = e.open.shift()!;
          const start = Math.max(e.analystFreeAt[a], alert.enqueuedAt);
          e.analystFreeAt[a] = start + handleSec(e.resolved);
          e.resolved += 1;
        }
      }

      const hourAgo = e.simTime - 3600;
      while (e.alertTimes.length > 0 && e.alertTimes[0] < hourAgo) {
        e.alertTimes.shift();
      }

      if (e.i >= txns.length && e.open.length === 0) {
        e.finished = true;
      }

      setSnap({
        simTime: e.simTime,
        open: [...e.open],
        screened: e.screened,
        autoCleared: e.autoCleared,
        resolved: e.resolved,
        alertsLastHour: e.alertTimes.length,
        costLastHour: e.alertTimes.length * COST_PER_ALERT_SGD,
        oldestAgeSec: e.open.length > 0 ? e.simTime - e.open[0].enqueuedAt : null,
        finished: e.finished,
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [txns, speed, paused, resetKey]);

  return snap;
}

export function formatSimClock(simTime: number): string {
  const total = SIM_START_HOUR * 3600 + Math.floor(simTime);
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatAge(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
