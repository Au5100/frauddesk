export type TxnType = "PAYMENT" | "TRANSFER" | "CASH_OUT" | "CASH_IN" | "DEBIT";

export interface Txn {
  id: string;
  /** Seconds since simulation start. */
  t: number;
  type: TxnType;
  /** Amount in SGD. */
  amount: number;
  /** Originating account balance before the transaction. */
  balanceBefore: number;
  /** Masked account reference, e.g. "ACC-4821". */
  account: string;
  /** Masked destination reference. */
  dest: string;
  /** True when the destination has never been paid by this account before. */
  destNew: boolean;
  /** Age of the destination account in days. */
  destAgeDays: number;
  /** Risk score 1-99 from the current scorer. */
  score: number;
  /** Human-readable reasons the scorer fired. Empty when score is low. */
  reasons: string[];
  /**
   * True when the transaction meets the MAS Shared Responsibility Framework
   * rapid-draining definition encoded in the generator: balance of S$50,000
   * or more with over half of it leaving within the window. Forces review
   * regardless of score.
   */
  srfHold: boolean;
  /**
   * Ground-truth label carried for later evaluation milestones. The scorer
   * never reads this field.
   */
  fraud: boolean;
  /** Typology tag on fraudulent rows, e.g. "official impersonation". */
  typology: string | null;
}

export interface Alert {
  txn: Txn;
  /** Simulation time when the alert entered the queue, in seconds. */
  enqueuedAt: number;
}
