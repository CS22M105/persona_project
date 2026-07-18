import { FormEvent, useEffect, useState } from "react";

import { getHealth } from "../api/client";
import {
  getCopdSobPersonaSettings,
  PatientGender,
  updateCopdSobPersonaAge,
  updateCopdSobPersonaGender,
} from "../api/scenarios";

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
  const [patientName, setPatientName] = useState("Linda Thompson");
  const [patientAge, setPatientAge] = useState(68);
  const [patientGender, setPatientGender] = useState<PatientGender>("female");
  const [ageInput, setAgeInput] = useState("68");
  const [genderInput, setGenderInput] = useState<PatientGender>("female");
  const [isSavingAge, setIsSavingAge] = useState(false);
  const [isSavingGender, setIsSavingGender] = useState(false);
  const [ageStatusMessage, setAgeStatusMessage] = useState("");
  const [genderStatusMessage, setGenderStatusMessage] = useState("");

  useEffect(() => {
    getHealth()
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("unavailable"));

    getCopdSobPersonaSettings()
      .then((settings) => {
        setPatientName(settings.patient_name);
        setPatientAge(settings.age);
        setPatientGender(settings.gender);
        setAgeInput(String(settings.age));
        setGenderInput(settings.gender);
        setAgeStatusMessage("");
        setGenderStatusMessage("");
      })
      .catch(() => {
        setAgeStatusMessage("Persona settings failed to load.");
      });
  }, []);

  async function handleAgeSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextAge = Number(ageInput);

    if (!Number.isInteger(nextAge) || nextAge < 18 || nextAge > 110) {
      setAgeStatusMessage("Enter an age from 18 to 110.");
      return;
    }

    setIsSavingAge(true);
    setAgeStatusMessage("");

    try {
      const settings = await updateCopdSobPersonaAge(nextAge);
      setPatientName(settings.patient_name);
      setPatientAge(settings.age);
      setPatientGender(settings.gender);
      setAgeInput(String(settings.age));
      setGenderInput(settings.gender);
      setAgeStatusMessage("Saved. Chat and voice will use this age.");
    } catch {
      setAgeStatusMessage("Age could not be saved. Make sure the backend is running.");
    } finally {
      setIsSavingAge(false);
    }
  }

  async function handleGenderSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingGender(true);
    setGenderStatusMessage("");

    try {
      const settings = await updateCopdSobPersonaGender(genderInput);
      setPatientName(settings.patient_name);
      setPatientGender(settings.gender);
      setGenderInput(settings.gender);
      setGenderStatusMessage("Saved. Chat and voice will use this gender.");
    } catch {
      setGenderStatusMessage(
        "Gender could not be saved. Make sure the backend is running.",
      );
    } finally {
      setIsSavingGender(false);
    }
  }

  return (
    <main className="app-shell persona-shell">
      <section className="persona-page" aria-labelledby="persona-page-title">
        <header className="persona-topbar">
          <div className="persona-topbar-left">
            <a className="header-link persona-back-link" href="/">
              Dashboard
            </a>
            <div className="persona-title-block">
              <p className="eyebrow">Patient persona</p>
              <h1 id="persona-page-title">COPD / Shortness of Breath</h1>
            </div>
          </div>
          <div className="persona-topbar-actions">
            <span className={`connection-pill connection-pill-${backendStatus}`}>
              {formatBackendStatus(backendStatus)}
            </span>
          </div>
        </header>

        <div className="persona-content">
          <div className="persona-brief-grid">
            <section
              className="persona-brief-card persona-summary-card"
              aria-labelledby="patient-summary-title"
            >
              <div className="persona-section-mark" aria-hidden="true">
                <svg
                  className="persona-section-icon"
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="24" cy="16" r="8" />
                  <path d="M10 40c2.5-8.5 8-13 14-13s11.5 4.5 14 13" />
                </svg>
              </div>
              <div>
                <p className="eyebrow">Patient summary</p>
                <h2 id="patient-summary-title">{patientName}</h2>
                <div className="persona-summary-layout">
                  <dl className="persona-fact-list">
                    <PersonaFact label="Age" value={String(patientAge)} />
                    <PersonaFact label="Gender" value={formatGender(patientGender)} />
                    <PersonaFact label="Chief complaint" value="Shortness of breath" />
                    <PersonaFact label="Scenario" value="COPD exacerbation" />
                    <PersonaFact label="Affect" value="Anxious, tired, breathless" />
                  </dl>
                  <div className="persona-settings-grid">
                    <form className="persona-setting-editor" onSubmit={handleAgeSave}>
                      <label htmlFor="patient-age">Adjust age</label>
                      <div className="persona-setting-row">
                        <input
                          id="patient-age"
                          inputMode="numeric"
                          max="110"
                          min="18"
                          onChange={(event) => setAgeInput(event.target.value)}
                          type="number"
                          value={ageInput}
                        />
                        <button disabled={isSavingAge} type="submit">
                          {isSavingAge ? "Saving..." : "Save"}
                        </button>
                      </div>
                      {ageStatusMessage ? (
                        <p className="persona-setting-status">{ageStatusMessage}</p>
                      ) : null}
                    </form>
                    <form
                      className="persona-setting-editor"
                      onSubmit={handleGenderSave}
                    >
                      <label htmlFor="patient-gender">Adjust gender</label>
                      <div className="persona-setting-row">
                        <select
                          id="patient-gender"
                          onChange={(event) =>
                            setGenderInput(event.target.value as PatientGender)
                          }
                          value={genderInput}
                        >
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                        </select>
                        <button disabled={isSavingGender} type="submit">
                          {isSavingGender ? "Saving..." : "Save"}
                        </button>
                      </div>
                      {genderStatusMessage ? (
                        <p className="persona-setting-status">
                          {genderStatusMessage}
                        </p>
                      ) : null}
                    </form>
                  </div>
                </div>
              </div>
            </section>

            <section className="persona-brief-card" aria-labelledby="condition-title">
              <p className="eyebrow">Starting condition</p>
              <div className="condition-card-header">
                <h2 id="condition-title">Baseline state</h2>
                <a className="persona-start-button" href="/voice">
                  Start Voice Room
                </a>
              </div>
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

        </div>
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
      <div className="condition-value">
        <strong>{value}</strong>
        {unit ? <span className="condition-unit">{unit}</span> : null}
      </div>
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

function formatGender(gender: PatientGender): string {
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}
