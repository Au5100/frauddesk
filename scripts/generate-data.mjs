// Deterministic synthetic transaction generator for FraudDesk.
// Writes src/data/transactions.json. No external data sources, no downloads.
// Schema loosely follows PaySim conventions (type, amount, balances).
// The scorer below is a transparent heuristic. It never reads the fraud label.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SEED = 20260718;
const SIM_SECONDS = 6 * 3600; // 09:00 to 15:00
const MEAN_GAP_SEC = 9.8;
const REVIEW_THRESHOLD = 60;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const expGap = () => -Math.log(1 - rand()) * MEAN_GAP_SEC;
const lognorm = (median, sigma) => {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return median * Math.exp(sigma * z);
};

const TYPE_WEIGHTS = [
  ["PAYMENT", 0.55, 80, 0.9],
  ["TRANSFER", 0.2, 600, 1.0],
  ["CASH_OUT", 0.12, 900, 0.9],
  ["CASH_IN", 0.08, 1200, 0.8],
  ["DEBIT", 0.05, 60, 0.7],
];
const TYPICAL = Object.fromEntries(TYPE_WEIGHTS.map(([t, , med]) => [t, med]));

function drawType() {
  let r = rand();
  for (const [t, w] of TYPE_WEIGHTS) {
    if (r < w) return t;
    r -= w;
  }
  return "PAYMENT";
}

const accounts = Array.from({ length: 420 }, (_, i) => ({
  id: `ACC-${1000 + i}`,
  balance: Math.min(Math.max(lognorm(14000, 1.1), 800), 480000),
  recent: [],
}));
const legitDests = Array.from({ length: 600 }, (_, i) => ({
  id: `DST-${2000 + i}`,
  age: rand() < 0.12 ? Math.floor(5 + rand() * 50) : Math.floor(60 + rand() * 2800),
}));
let muleSeq = 0;
const newMuleDest = () => ({ id: `DST-${9000 + muleSeq++}`, age: Math.floor(3 + rand() * 42) });

const knownPairs = new Set();
function destFor(account, wantNew) {
  if (!wantNew && rand() < 0.72) {
    for (let k = 0; k < 3; k += 1) {
      const d = pick(legitDests);
      if (knownPairs.has(`${account.id}:${d.id}`)) return { d, isNew: false };
    }
  }
  const d = pick(legitDests);
  const key = `${account.id}:${d.id}`;
  const isNew = !knownPairs.has(key);
  knownPairs.add(key);
  return { d, isNew };
}

function score(txn, velocityCount) {
  let s = 10 + rand() * 14;
  const reasons = [];
  const share = txn.amount / Math.max(txn.balanceBefore, 1);

  if (txn.type === "CASH_OUT" && share > 0.85) {
    s += 36;
    reasons.push(`Cash out of ${Math.round(share * 100)}% of balance`);
  } else if (txn.type === "TRANSFER" && share > 0.45) {
    s += 20;
    reasons.push(`Transfer of ${Math.round(share * 100)}% of balance`);
  }

  const typical = TYPICAL[txn.type];
  if (txn.amount > typical * 5) {
    s += 20;
    reasons.push(`Amount ${Math.round(txn.amount / typical)}x typical for ${txn.type.toLowerCase().replace("_", " ")}`);
    if (txn.amount > typical * 12) {
      s += 12;
    }
  }

  if (txn.destNew && txn.amount > 800) {
    if (txn.amount > 3500) {
      s += 34;
      reasons.push("Large first payment to this destination");
    } else {
      s += 20;
      reasons.push("First payment to this destination");
    }
  }
  if (txn.destAgeDays < 45 && txn.amount > 500) {
    s += 16;
    reasons.push(`Destination account ${txn.destAgeDays} days old`);
  }
  if (velocityCount >= 3) {
    s += 18;
    reasons.push(`${velocityCount} transfers from this account in 10 minutes`);
  }

  return { score: Math.max(1, Math.min(99, Math.round(s))), reasons };
}

// Fraud scripts, shaped on the typologies in SPF's Mid Year Scam Brief 2025.
function planFraud() {
  const events = [];
  const slot = () => 600 + rand() * (SIM_SECONDS - 1200);
  for (let i = 0; i < 8; i += 1) {
    // Official impersonation: one large transfer draining most of the balance.
    const account = pick(accounts);
    account.balance = Math.max(account.balance, 20000 + rand() * 160000);
    events.push({
      t: slot(),
      account,
      type: "TRANSFER",
      shareOfBalance: 0.6 + rand() * 0.35,
      dest: newMuleDest(),
      typology: "official impersonation",
    });
  }
  for (let i = 0; i < 7; i += 1) {
    // Investment scam: three growing transfers to the same destination.
    const account = pick(accounts);
    const dest = newMuleDest();
    const t0 = slot();
    let amt = 1400 + rand() * 2600;
    for (let k = 0; k < 3; k += 1) {
      events.push({
        t: t0 + k * (180 + rand() * 240),
        account,
        type: "TRANSFER",
        amount: amt,
        dest,
        typology: "investment scam",
      });
      amt *= 1.9 + rand();
    }
  }
  for (let i = 0; i < 5; i += 1) {
    // Job scam: two small transfers to a fresh destination.
    const account = pick(accounts);
    const dest = newMuleDest();
    const t0 = slot();
    for (let k = 0; k < 2; k += 1) {
      events.push({
        t: t0 + k * (300 + rand() * 600),
        account,
        type: "TRANSFER",
        amount: 200 + rand() * 700,
        dest,
        typology: "job scam",
      });
    }
  }
  for (let i = 0; i < 6; i += 1) {
    // Mule cash out: draining a freshly funded account.
    const account = pick(accounts);
    events.push({
      t: slot(),
      account,
      type: "CASH_OUT",
      shareOfBalance: 0.85 + rand() * 0.13,
      dest: newMuleDest(),
      typology: "mule cash out",
    });
  }
  return events.sort((a, b) => a.t - b.t);
}

const fraudEvents = planFraud();
const txns = [];
let t = 0;
let id = 0;
let fraudIdx = 0;

function pushTxn({ time, account, type, amount, dest, destAge, destNew, typology }) {
  const balanceBefore = Math.max(account.balance, amount * 1.01);
  account.balance = Math.max(balanceBefore - (type === "CASH_IN" ? -amount : amount), 50);
  account.recent = account.recent.filter((x) => time - x <= 600);
  account.recent.push(time);
  const velocity = type === "TRANSFER" || type === "CASH_OUT" ? account.recent.length : 0;

  const base = {
    id: `T${String(id++).padStart(5, "0")}`,
    t: Math.round(time),
    type,
    amount: Math.round(amount),
    balanceBefore: Math.round(balanceBefore),
    account: account.id,
    dest,
    destNew,
    destAgeDays: destAge,
    fraud: Boolean(typology),
    typology: typology ?? null,
  };
  const { score: s, reasons } = score(base, velocity);
  const srfHold =
    balanceBefore >= 50000 && amount > 0.5 * balanceBefore && type !== "CASH_IN";
  txns.push({ ...base, score: s, reasons, srfHold });
}

while (t < SIM_SECONDS) {
  t += expGap();
  while (fraudIdx < fraudEvents.length && fraudEvents[fraudIdx].t <= t) {
    const f = fraudEvents[fraudIdx++];
    const amount = f.amount ?? f.shareOfBalance * Math.max(f.account.balance, 1000);
    pushTxn({
      time: f.t,
      account: f.account,
      type: f.type,
      amount,
      dest: f.dest.id,
      destAge: f.dest.age,
      destNew: true,
      typology: f.typology,
    });
  }
  if (t >= SIM_SECONDS) break;

  const account = pick(accounts);
  const type = drawType();
  const [, , median, sigma] = TYPE_WEIGHTS.find(([ty]) => ty === type);
  let amount = Math.max(2, lognorm(median, sigma));
  // Fat tail days: a slice of legitimate traffic looks unusual, which is
  // where real false positives come from.
  if (rand() < 0.1) {
    amount *= 5 + rand() * 10;
  }
  if (type === "CASH_IN") {
    account.balance += amount;
  }
  const { d, isNew } = destFor(account, rand() < 0.18);
  pushTxn({
    time: t,
    account,
    type,
    amount,
    dest: d.id,
    destAge: d.age,
    destNew: isNew && type !== "CASH_IN",
    typology: null,
  });
}

txns.sort((a, b) => a.t - b.t);

const alerts = txns.filter((x) => x.score >= REVIEW_THRESHOLD || x.srfHold);
const fraudAlerts = alerts.filter((x) => x.fraud);
const summary = {
  transactions: txns.length,
  fraudRows: txns.filter((x) => x.fraud).length,
  alerts: alerts.length,
  alertRate: `${((alerts.length / txns.length) * 100).toFixed(1)}%`,
  falsePositiveShareOfAlerts: `${(((alerts.length - fraudAlerts.length) / Math.max(alerts.length, 1)) * 100).toFixed(1)}%`,
  fraudCaught: fraudAlerts.length,
  srfHolds: txns.filter((x) => x.srfHold).length,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "transactions.json"), JSON.stringify(txns));
console.log(JSON.stringify(summary, null, 2));
