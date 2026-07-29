import { useEffect, useState } from "react";

import { getHealth } from "../api/client";
import { getScenarios, ScenarioSummary } from "../api/scenarios";

type BackendStatus = "checking" | "connected" | "unavailable";

export function Dashboard() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setIsLoadingScenarios(true);
    setErrorMessage("");

    try {
      await getHealth();
      const scenarioResponse = await getScenarios();
      setBackendStatus("connected");
      setScenarios(scenarioResponse.scenarios);
    } catch {
      setBackendStatus("unavailable");
      setScenarios([]);
      setErrorMessage("Persona list failed to load. Make sure the backend is running.");
    } finally {
      setIsLoadingScenarios(false);
    }
  }

  return (
    <main className="app-shell dashboard-shell">
      <section className="dashboard-page" aria-labelledby="dashboard-title">
        <header className="dashboard-topbar">
          <a className="dashboard-brand" href="/" aria-label="AI Patient Voice dashboard">
            AI Patient Voice
          </a>
          <div className="dashboard-topbar-actions">
            <span className={`connection-pill connection-pill-${backendStatus}`}>
              {formatBackendStatus(backendStatus)}
            </span>
          </div>
        </header>

        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <p className="eyebrow">Instructor workspace</p>
          <h1 id="dashboard-title">Select a patient persona</h1>
          <p className="lede">
            Choose a simulation patient to review the scenario and start a live
            voice room.
          </p>
        </section>

        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        <section className="persona-grid" aria-label="Available patient personas">
          {isLoadingScenarios ? (
            <article className="persona-select-card">
              <div className="persona-card-mark" aria-hidden="true">
                ...
              </div>
              <div>
                <h2>Loading personas</h2>
                <p className="persona-type">Connecting to scenario registry</p>
                <p className="persona-summary">
                  Patient personas will appear here when the backend responds.
                </p>
              </div>
            </article>
          ) : null}

          {!isLoadingScenarios && scenarios.length === 0 && !errorMessage ? (
            <article className="persona-select-card">
              <div className="persona-card-mark" aria-hidden="true">
                0
              </div>
              <div>
                <h2>No personas available</h2>
                <p className="persona-type">Scenario registry is empty</p>
                <p className="persona-summary">
                  Add a scenario JSON file and register it in the backend scenario
                  registry.
                </p>
              </div>
            </article>
          ) : null}

          {!isLoadingScenarios && scenarios.map((scenario) => (
            <article
              className={`persona-select-card${
                scenario.is_available ? " persona-select-card-active" : ""
              }`}
              key={scenario.scenario_id}
            >
              <div className="persona-card-mark" aria-hidden="true">
                {shouldUseHeartEcgIcon(scenario) ? (
                  <HeartEcgIcon />
                ) : (
                  getPersonaInitials(scenario.scenario_name)
                )}
              </div>
              <div>
                <h2>{scenario.scenario_name}</h2>
                <p className="persona-type">{scenario.scenario_type}</p>
                <p className="persona-summary">{scenario.summary}</p>
              </div>
              <div className="persona-chip-row" aria-label="Scenario details">
                <span className={`persona-chip ${getDifficultyClass(scenario.difficulty)}`}>
                  {scenario.difficulty}
                </span>
                <span className="persona-chip">{scenario.duration}</span>
                <span className="persona-chip">{formatClinicalArea(scenario.clinical_area)}</span>
              </div>
              {scenario.is_available ? (
                <a
                  className="persona-action persona-action-primary"
                  href={`/personas/${scenario.scenario_id}`}
                >
                  Open Persona
                  <span aria-hidden="true">&gt;</span>
                </a>
              ) : (
                <button className="persona-action" disabled type="button">
                  Coming Soon
                </button>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
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

function getPersonaInitials(name: string): string {
  return name
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");
}

function getDifficultyClass(difficulty: string): string {
  return `persona-chip-${difficulty.toLowerCase().replace(/\s+/g, "-")}`;
}

function shouldUseHeartEcgIcon(scenario: ScenarioSummary): boolean {
  return (
    scenario.clinical_area.toLowerCase().includes("cardiac") ||
    scenario.scenario_id.toLowerCase().includes("chest")
  );
}

function formatClinicalArea(clinicalArea: string): string {
  return clinicalArea
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function HeartEcgIcon() {
  return (
    <svg
      className="heart-ecg-icon"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 40s-15-8.9-18.4-20.2C3.4 12.5 7.7 7 14.2 7c3.8 0 7.1 2.1 9.8 5.7C26.7 9.1 30 7 33.8 7c6.5 0 10.8 5.5 8.6 12.8C39 31.1 24 40 24 40Z" />
      <path d="M10 23h7l3-6 5.5 13 4-8h8.5" />
    </svg>
  );
}
