import { useEffect, useState } from "react";

import { getHealth } from "../api/client";

type BackendStatus = "checking" | "connected" | "unavailable";

const availableCues = [
  "HR increase",
  "SpO2 drop",
  "Breathing worsens",
  "Oxygen applied",
  "Bronchodilator",
  "Patient improving",
];

const learningGoals = [
  "Assess and prioritize respiratory status.",
  "Communicate clearly with a short-of-breath patient.",
  "Recognize deterioration and choose appropriate interventions.",
];

export function PersonaPage() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    getHealth()
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("unavailable"));
  }, []);

  return (
    <main className="app-shell persona-shell">
      <section className="persona-page" aria-labelledby="persona-page-title">
        <header className="persona-topbar">
          <a className="header-link persona-back-link" href="/">
            Dashboard
          </a>
          <div className="persona-title-block">
            <p className="eyebrow">Patient persona</p>
            <h1 id="persona-page-title">COPD / Shortness of Breath</h1>
          </div>
          <div className="persona-topbar-actions">
            <span className={`connection-pill connection-pill-${backendStatus}`}>
              {formatBackendStatus(backendStatus)}
            </span>
            <a className="persona-start-button" href="/voice">
              Start Voice Room
            </a>
          </div>
        </header>

        <div className="persona-brief-grid">
          <section
            className="persona-brief-card persona-summary-card"
            aria-labelledby="patient-summary-title"
          >
            <div className="persona-section-mark" aria-hidden="true">
              MT
            </div>
            <div>
              <p className="eyebrow">Patient summary</p>
              <h2 id="patient-summary-title">Maria Thompson</h2>
              <dl className="persona-fact-list">
                <PersonaFact label="Age" value="68" />
                <PersonaFact label="Chief complaint" value="Shortness of breath" />
                <PersonaFact label="Scenario" value="COPD exacerbation" />
                <PersonaFact label="Affect" value="Anxious, tired, breathless" />
              </dl>
            </div>
          </section>

          <section className="persona-brief-card" aria-labelledby="condition-title">
            <p className="eyebrow">Starting condition</p>
            <h2 id="condition-title">Baseline state</h2>
            <div className="condition-grid">
              <ConditionMetric label="HR" value="104" unit="bpm" tone="heart" />
              <ConditionMetric label="SpO2" value="91" unit="%" tone="oxygen" />
              <ConditionMetric label="RR" value="24" unit="/min" tone="breathing" />
              <ConditionMetric label="Breathing" value="Labored" unit="" tone="warning" />
            </div>
          </section>

          <section className="persona-brief-card" aria-labelledby="cues-title">
            <p className="eyebrow">Instructor cues</p>
            <h2 id="cues-title">Available changes</h2>
            <div className="persona-cue-list">
              {availableCues.map((cue) => (
                <span className="persona-cue-chip" key={cue}>
                  {cue}
                </span>
              ))}
            </div>
          </section>

          <section className="persona-brief-card" aria-labelledby="goals-title">
            <p className="eyebrow">Learning goals</p>
            <h2 id="goals-title">Faculty focus</h2>
            <ol className="persona-goal-list">
              {learningGoals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="persona-page-footer">
          <p>Use the voice room to run the live patient interaction.</p>
          <a className="persona-start-button" href="/voice">
            Start Voice Room
          </a>
        </footer>
      </section>
    </main>
  );
}

function PersonaFact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function ConditionMetric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "heart" | "oxygen" | "breathing" | "warning";
}) {
  return (
    <div className={`condition-metric condition-metric-${tone}`}>
      <span className="condition-label">{label}</span>
      <strong>{value}</strong>
      {unit ? <span className="condition-unit">{unit}</span> : null}
    </div>
  );
}

function formatBackendStatus(status: BackendStatus): string {
  if (status === "connected") {
    return "Connected";
  }

  if (status === "unavailable") {
    return "Backend unavailable";
  }

  return "Checking";
}
