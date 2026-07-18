import { useState } from "react";
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderName,
  Theme,
} from "@carbon/react";
import { Information } from "@carbon/icons-react";
import QueueView from "./QueueView";
import MethodsModal from "./MethodsModal";
import rawTxns from "./data/transactions.json";
import type { Txn } from "./types";

const txns = rawTxns as Txn[];

export default function App() {
  const [methodsOpen, setMethodsOpen] = useState(false);

  return (
    <Theme theme="g100" className="fd-root">
      <Header aria-label="FraudDesk">
        <HeaderName href="#" prefix="">
          FraudDesk
        </HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label="Methods and sources"
            tooltipAlignment="end"
            onClick={() => setMethodsOpen(true)}
          >
            <Information size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <main className="fd-shell">
        <div className="fd-container">
          <p className="fd-lede">
            A simulated fraud triage queue for a retail bank. One day of synthetic transactions
            replays through a scored queue while three analysts work it. Open the methods panel for
            what is real, what is estimated, and what is placeholder.
          </p>
          <QueueView txns={txns} />
        </div>
      </main>
      <footer className="fd-footer">
        <div className="fd-container">
          <span>All transactions are synthetic. Cost figures are cited industry estimates.</span>
          <button type="button" className="fd-link" onClick={() => setMethodsOpen(true)}>
            Methods and sources
          </button>
        </div>
      </footer>
      <MethodsModal open={methodsOpen} onClose={() => setMethodsOpen(false)} />
    </Theme>
  );
}
