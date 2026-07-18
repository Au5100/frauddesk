import { useState } from "react";
import {
  ContentSwitcher,
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderName,
  Switch,
  Theme,
} from "@carbon/react";
import { Information } from "@carbon/icons-react";
import QueueView from "./QueueView";
import CockpitView from "./CockpitView";
import MethodsModal from "./MethodsModal";
import { txns } from "./economics";

export default function App() {
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [view, setView] = useState(0);

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
            A simulated fraud operations desk for a retail bank. One day of synthetic transactions
            replays through a scored triage queue, and the economics view prices where the
            threshold sits. Open the methods panel for what is real, what is estimated, and what
            is placeholder.
          </p>
          <ContentSwitcher
            className="fd-view-switch"
            selectedIndex={view}
            onChange={({ index }) => typeof index === "number" && setView(index)}
          >
            <Switch name="queue" text="Triage queue" />
            <Switch name="economics" text="Threshold economics" />
          </ContentSwitcher>
          <div hidden={view !== 0}>
            <QueueView txns={txns} />
          </div>
          <div hidden={view !== 1}>
            <CockpitView />
          </div>
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
