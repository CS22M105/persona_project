import { useEffect, useState } from "react";

import { getHealth } from "../api/client";

type BackendStatus = "checking" | "connected" | "unavailable";

type PersonaCard = {
  id: string;
  name: string;
  scenarioType: string;
  summary: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  isAvailable: boolean;
};

const personas: PersonaCard[] = [
  {
    id: "copd-sob",
    name: "COPD / Shortness of Breath",
    scenarioType: "Respiratory distress scenario",
    summary: "Adult patient with worsening dyspnea, anxiety, and low oxygen saturation.",
    difficulty: "Beginner",
    duration: "10-15 min",
    isAvailable: true,
  },
  {
    id: "post-op-pain",
    name: "Post-op Pain",
    scenarioType: "Post-operative assessment",
    summary: "Pain reassessment and communication after a surgical procedure.",
    difficulty: "Intermediate",
    duration: "10-15 min",
    isAvailable: false,
  },
  {
    id: "sepsis-concern",
    name: "Sepsis Concern",
    scenarioType: "Early recognition scenario",
    summary: "Focused escalation practice for infection-related deterioration.",
    difficulty: "Intermediate",
    duration: "15-20 min",
    isAvailable: false,
  },
  {
    id: "chest-pain",
    name: "Chest Pain",
    scenarioType: "Cardiac assessment scenario",
    summary: "Assessment and communication for acute chest discomfort.",
    difficulty: "Advanced",
    duration: "15-20 min",
    isAvailable: false,
  },
];

export function Dashboard() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    getHealth()
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("unavailable"));
  }, []);

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

        <section className="persona-grid" aria-label="Available patient personas">
          {personas.map((persona) => (
            <article
              className={`persona-select-card${
                persona.isAvailable ? " persona-select-card-active" : ""
              }`}
              key={persona.id}
            >
              <div className="persona-card-mark" aria-hidden="true">
                {shouldUseHeartEcgIcon(persona.id) ? (
                  <HeartEcgIcon />
                ) : (
                  getPersonaInitials(persona.name)
                )}
              </div>
              <div>
                <h2>{persona.name}</h2>
                <p className="persona-type">{persona.scenarioType}</p>
                <p className="persona-summary">{persona.summary}</p>
              </div>
              <div className="persona-chip-row" aria-label="Scenario details">
                <span className={`persona-chip ${getDifficultyClass(persona.difficulty)}`}>
                  {persona.difficulty}
                </span>
                <span className="persona-chip">{persona.duration}</span>
              </div>
              {persona.isAvailable ? (
                <a
                  className="persona-action persona-action-primary"
                  href="/personas/copd-sob"
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

function getDifficultyClass(difficulty: PersonaCard["difficulty"]): string {
  return `persona-chip-${difficulty.toLowerCase()}`;
}

function shouldUseHeartEcgIcon(personaId: string): boolean {
  return personaId === "post-op-pain" || personaId === "chest-pain";
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
