import { Modal } from "@carbon/react";

export default function MethodsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      passiveModal
      modalHeading="Methods and sources"
      size="md"
    >
      <div className="fd-methods">
        <h4>What this is</h4>
        <p>
          FraudDesk simulates the triage queue a bank fraud operations team works from. A scored
          stream of transactions plays back through the queue, a small analyst pool clears alerts,
          and the counters show what that costs. Everything on screen is synthetic. No real
          customer, account, or bank data is involved.
        </p>

        <h4>The data</h4>
        <p>
          Transactions come from a seeded generator in this repository
          (scripts/generate-data.mjs). The schema loosely follows the conventions of the public
          PaySim research dataset: transaction type, amount, and account balances. Fraudulent rows
          carry a typology from Singapore's 2025 scam mix, as categorised in the Singapore Police
          Force Mid Year Scam and Cybercrime Brief 2025: official impersonation, investment scams,
          job scams, and mule cash outs.
        </p>

        <h4>The numbers</h4>
        <p>
          Review cost uses the midpoint of S$25 to S$50 of analyst time per alert, an industry
          estimate cited by AML technology firms such as Facctum and FluxForce. The same industry
          sources put false positive rates for transaction monitoring at 90 to 95 percent. Measured on
          its own data, this queue runs at about 84 percent at the current threshold. The 30 minute SLA target and
          the three analyst shift are demo assumptions, chosen to make capacity visible.
        </p>

        <h4>The SRF rule</h4>
        <p>
          Since 16 June 2025, MAS's Shared Responsibility Framework requires real time detection of
          rapid account draining: a protected account holding S$50,000 or more where over half the
          balance leaves within 24 hours must be held or verified. The queue applies a simplified
          per transaction version of that definition and tags matching rows "SRF hold". The rule
          fires regardless of the model score, which is the point: rules and models layer.
        </p>
        <p>
          <a
            href="https://www.mas.gov.sg/regulation/guidelines/guidelines-on-shared-responsibility-framework"
            target="_blank"
            rel="noreferrer"
          >
            MAS Shared Responsibility Framework guidelines
          </a>
        </p>

        <h4>The scorer</h4>
        <p>
          The current risk score is a transparent heuristic with fixed weights, not a trained
          model. Every signal shown on an alert is a rule that actually fired. The generator stores
          a hidden outcome label for future evaluation work, and the scorer never reads it. A
          trained model with a proper evaluation page, precision recall rather than accuracy, is a
          planned milestone.
        </p>

        <h4>What comes next</h4>
        <p>
          The roadmap in the repository covers a threshold economics view that prices the tradeoff
          between fraud caught, review cost, and customer friction, a decision memo generated from
          the chosen threshold, and scenario injection for typology shifts. Progress is tracked in
          CHANGELOG.md.
        </p>
      </div>
    </Modal>
  );
}
