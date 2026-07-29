import { FormEvent, ReactNode, useEffect, useState } from "react";

import { getHealth } from "../api/client";
import {
  getPersonaSettings,
  getScenario,
  PatientGender,
  PatientVoice,
  ScenarioDetail,
  updatePersonaSettings,
} from "../api/scenarios";

type BackendStatus = "checking" | "connected" | "unavailable";

type PersonaPageProps = {
  scenarioId: string;
};

type BaselineMetric = {
  label: string;
  value: string;
  unit: string;
  tone: "heart" | "oxygen" | "breathing" | "warning";
  icon: ReactNode;
};

const voiceOptions: { label: string; value: PatientVoice }[] = [
  { label: "Marin - recommended", value: "marin" },
  { label: "Cedar - recommended", value: "cedar" },
  { label: "Alloy", value: "alloy" },
  { label: "Ash", value: "ash" },
  { label: "Ballad", value: "ballad" },
  { label: "Coral", value: "coral" },
  { label: "Echo", value: "echo" },
  { label: "Sage", value: "sage" },
  { label: "Shimmer", value: "shimmer" },
  { label: "Verse", value: "verse" },
];

const voiceAffectOptions = [
  "Breathless, tired, anxious",
  "Calm but short of breath",
  "Very anxious and breathless",
  "Weak, tired, and slow",
  "Alert and cooperative",
];

export function PersonaPage({ scenarioId }: PersonaPageProps) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [isLoadingScenario, setIsLoadingScenario] = useState(true);
  const [patientName, setPatientName] = useState("Patient");
  const [patientAge, setPatientAge] = useState(68);
  const [patientGender, setPatientGender] = useState<PatientGender>("female");
  const [patientVoice, setPatientVoice] = useState<PatientVoice>("marin");
  const [patientVoiceAffect, setPatientVoiceAffect] = useState(
    "Breathless, tired, anxious",
  );
  const [ageInput, setAgeInput] = useState("68");
  const [genderInput, setGenderInput] = useState<PatientGender>("female");
  const [voiceInput, setVoiceInput] = useState<PatientVoice>("marin");
  const [voiceAffectInput, setVoiceAffectInput] = useState(
    "Breathless, tired, anxious",
  );
  const [isSavingAge, setIsSavingAge] = useState(false);
  const [isSavingGender, setIsSavingGender] = useState(false);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isSavingVoiceAffect, setIsSavingVoiceAffect] = useState(false);
  const [ageStatusMessage, setAgeStatusMessage] = useState("");
  const [genderStatusMessage, setGenderStatusMessage] = useState("");
  const [voiceStatusMessage, setVoiceStatusMessage] = useState("");
  const [voiceAffectStatusMessage, setVoiceAffectStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadPersonaPage();
  }, [scenarioId]);

  async function loadPersonaPage() {
    setIsLoadingScenario(true);
    setErrorMessage("");

    try {
      await getHealth();
      const scenarioResponse = await getScenario(scenarioId);
      setBackendStatus("connected");
      setScenario(scenarioResponse);
      hydrateProfileFromScenario(scenarioResponse);
      await loadPersonaSettings(scenarioResponse.scenario_id);
    } catch {
      setBackendStatus("unavailable");
      setScenario(null);
      setErrorMessage("Persona failed to load. Make sure the backend is running.");
    } finally {
      setIsLoadingScenario(false);
    }
  }

  function hydrateProfileFromScenario(scenarioResponse: ScenarioDetail) {
    const profile = scenarioResponse.patient_profile || {};
    const age = profile.age ?? 68;
    const gender = normalizeGender(profile.gender ?? profile.sex ?? "female");

    setPatientName(profile.name ?? "Patient");
    setPatientAge(age);
    setPatientGender(gender);
    setAgeInput(String(age));
    setGenderInput(gender);
  }

  async function loadPersonaSettings(selectedScenarioId: string) {
    try {
      const settings = await getPersonaSettings(selectedScenarioId);
      syncSettings(settings);
      setAgeStatusMessage("");
      setGenderStatusMessage("");
      setVoiceStatusMessage("");
      setVoiceAffectStatusMessage("");
    } catch {
      setAgeStatusMessage("Persona settings failed to load.");
    }
  }

  function syncSettings(settings: {
    patient_name: string;
    age: number;
    gender: PatientGender;
    voice: PatientVoice;
    voice_style: string;
  }) {
    setPatientName(settings.patient_name);
    setPatientAge(settings.age);
    setPatientGender(settings.gender);
    setPatientVoice(settings.voice);
    setPatientVoiceAffect(settings.voice_style);
    setAgeInput(String(settings.age));
    setGenderInput(settings.gender);
    setVoiceInput(settings.voice);
    setVoiceAffectInput(settings.voice_style);
  }

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
      const settings = await updatePersonaSettings(scenarioId, { age: nextAge });
      syncSettings(settings);
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
      const settings = await updatePersonaSettings(scenarioId, { gender: genderInput });
      syncSettings(settings);
      setGenderStatusMessage("Saved. Chat and voice will use this gender.");
    } catch {
      setGenderStatusMessage(
        "Gender could not be saved. Make sure the backend is running.",
      );
    } finally {
      setIsSavingGender(false);
    }
  }

  async function handleVoiceSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingVoice(true);
    setVoiceStatusMessage("");

    try {
      const settings = await updatePersonaSettings(scenarioId, { voice: voiceInput });
      syncSettings(settings);
      setVoiceStatusMessage("Saved. Reconnect voice to hear this voice.");
    } catch {
      setVoiceStatusMessage("Voice could not be saved. Make sure the backend is running.");
    } finally {
      setIsSavingVoice(false);
    }
  }

  async function handleVoiceAffectSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingVoiceAffect(true);
    setVoiceAffectStatusMessage("");

    try {
      const settings = await updatePersonaSettings(scenarioId, {
        voice_style: voiceAffectInput,
      });
      syncSettings(settings);
      setVoiceAffectStatusMessage("Saved. Chat and voice will use this voice affect.");
    } catch {
      setVoiceAffectStatusMessage(
        "Voice affect could not be saved. Make sure the backend is running.",
      );
    } finally {
      setIsSavingVoiceAffect(false);
    }
  }

  const pageTitle = scenario?.scenario_name ?? "Patient Persona";
  const scenarioType = scenario?.card_summary?.scenario_type ?? "Simulation scenario";
  const baselineMetrics = scenario ? buildBaselineMetrics(scenario) : [];

  return (
    <main className="app-shell persona-shell">
      <section className="persona-page" aria-labelledby="persona-page-title">
        <header className="persona-topbar">
          <div className="persona-topbar-left">
            <div className="persona-title-block">
              <p className="eyebrow">Patient persona</p>
              <h1 id="persona-page-title">{pageTitle}</h1>
            </div>
          </div>
          <div className="persona-topbar-actions">
            <a className="header-link persona-back-link" href="/">
              Dashboard
            </a>
            <span
              aria-label={`Backend status: ${formatBackendStatusForScreenReader(
                backendStatus,
              )}`}
              className={`persona-status-dot persona-status-dot-${backendStatus}`}
              title={`Backend status: ${formatBackendStatusForScreenReader(
                backendStatus,
              )}`}
            />
          </div>
        </header>

        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        <div className="persona-content">
          {isLoadingScenario ? (
            <section className="dashboard-card">
              <p className="dashboard-note">Loading persona...</p>
            </section>
          ) : null}

          {scenario ? (
            <div className="persona-brief-grid">
              <section
                className="persona-brief-card persona-summary-card"
                aria-labelledby="patient-summary-title"
              >
                <div className="persona-section-mark" aria-hidden="true">
                  <PatientIcon />
                </div>
                <div>
                  <p className="eyebrow">Patient summary</p>
                  <h2 id="patient-summary-title">{patientName}</h2>
                  <div className="persona-summary-layout">
                    <dl className="persona-fact-list">
                      <PersonaFact
                        label="Age"
                        value={formatAgeSummary(ageInput, patientAge)}
                      />
                      <PersonaFact
                        label="Gender"
                        value={formatGender(genderInput || patientGender)}
                      />
                      <PersonaFact
                        label="Chief complaint"
                        value={scenario.chief_complaint}
                      />
                      <PersonaFact label="Scenario" value={scenarioType} />
                      <PersonaFact
                        label="Voice"
                        value={formatVoiceName(voiceInput || patientVoice)}
                      />
                      <PersonaFact
                        label="Voice affect"
                        value={voiceAffectInput || patientVoiceAffect}
                      />
                    </dl>

                    <PersonaSettingsEditors
                      ageInput={ageInput}
                      ageStatusMessage={ageStatusMessage}
                      genderInput={genderInput}
                      genderStatusMessage={genderStatusMessage}
                      handleAgeSave={handleAgeSave}
                      handleGenderSave={handleGenderSave}
                      handleVoiceAffectSave={handleVoiceAffectSave}
                      handleVoiceSave={handleVoiceSave}
                      isSavingAge={isSavingAge}
                      isSavingGender={isSavingGender}
                      isSavingVoice={isSavingVoice}
                      isSavingVoiceAffect={isSavingVoiceAffect}
                      setAgeInput={setAgeInput}
                      setGenderInput={setGenderInput}
                      setVoiceAffectInput={setVoiceAffectInput}
                      setVoiceInput={setVoiceInput}
                      voiceAffectInput={voiceAffectInput}
                      voiceAffectStatusMessage={voiceAffectStatusMessage}
                      voiceInput={voiceInput}
                      voiceStatusMessage={voiceStatusMessage}
                    />
                  </div>
                </div>
              </section>

              <section className="persona-brief-card" aria-labelledby="condition-title">
                <p className="eyebrow">Starting condition</p>
                <div className="condition-card-header">
                  <div className="condition-title-row">
                    <span className="condition-title-icon" aria-hidden="true">
                      <HeartEcgIcon />
                    </span>
                    <h2 id="condition-title">Baseline state</h2>
                  </div>
                  <a className="persona-start-button" href="/voice">
                    Start Voice Room
                  </a>
                </div>
                <div className="condition-grid">
                  {baselineMetrics.map((metric) => (
                    <ConditionMetric
                      icon={metric.icon}
                      key={metric.label}
                      label={metric.label}
                      tone={metric.tone}
                      unit={metric.unit}
                      value={metric.value}
                    />
                  ))}
                </div>
              </section>

              <section className="persona-brief-card" aria-labelledby="cues-title">
                <p className="eyebrow">Instructor cues</p>
                <h2 id="cues-title">Available changes</h2>
                <div className="persona-cue-list">
                  {scenario.instructor_cues.map((cue) => (
                    <span className="persona-cue-chip" key={cue.cue_id}>
                      {cue.label}
                    </span>
                  ))}
                </div>
              </section>

              <section className="persona-brief-card" aria-labelledby="goals-title">
                <p className="eyebrow">Learning goals</p>
                <h2 id="goals-title">Faculty focus</h2>
                <ol className="persona-goal-list">
                  {scenario.learning_objectives.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ol>
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function PersonaSettingsEditors({
  ageInput,
  ageStatusMessage,
  genderInput,
  genderStatusMessage,
  handleAgeSave,
  handleGenderSave,
  handleVoiceAffectSave,
  handleVoiceSave,
  isSavingAge,
  isSavingGender,
  isSavingVoice,
  isSavingVoiceAffect,
  setAgeInput,
  setGenderInput,
  setVoiceAffectInput,
  setVoiceInput,
  voiceAffectInput,
  voiceAffectStatusMessage,
  voiceInput,
  voiceStatusMessage,
}: {
  ageInput: string;
  ageStatusMessage: string;
  genderInput: PatientGender;
  genderStatusMessage: string;
  handleAgeSave: (event: FormEvent<HTMLFormElement>) => void;
  handleGenderSave: (event: FormEvent<HTMLFormElement>) => void;
  handleVoiceAffectSave: (event: FormEvent<HTMLFormElement>) => void;
  handleVoiceSave: (event: FormEvent<HTMLFormElement>) => void;
  isSavingAge: boolean;
  isSavingGender: boolean;
  isSavingVoice: boolean;
  isSavingVoiceAffect: boolean;
  setAgeInput: (value: string) => void;
  setGenderInput: (value: PatientGender) => void;
  setVoiceAffectInput: (value: string) => void;
  setVoiceInput: (value: PatientVoice) => void;
  voiceAffectInput: string;
  voiceAffectStatusMessage: string;
  voiceInput: PatientVoice;
  voiceStatusMessage: string;
}) {
  return (
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

      <form className="persona-setting-editor" onSubmit={handleGenderSave}>
        <label htmlFor="patient-gender">Adjust gender</label>
        <div className="persona-setting-row">
          <select
            id="patient-gender"
            onChange={(event) => setGenderInput(event.target.value as PatientGender)}
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
          <p className="persona-setting-status">{genderStatusMessage}</p>
        ) : null}
      </form>

      <form className="persona-setting-editor" onSubmit={handleVoiceSave}>
        <label htmlFor="patient-voice">Voice</label>
        <div className="persona-setting-row">
          <select
            id="patient-voice"
            onChange={(event) => setVoiceInput(event.target.value as PatientVoice)}
            value={voiceInput}
          >
            {voiceOptions.map((voiceOption) => (
              <option key={voiceOption.value} value={voiceOption.value}>
                {voiceOption.label}
              </option>
            ))}
          </select>
          <button disabled={isSavingVoice} type="submit">
            {isSavingVoice ? "Saving..." : "Save"}
          </button>
        </div>
        {voiceStatusMessage ? (
          <p className="persona-setting-status">{voiceStatusMessage}</p>
        ) : null}
      </form>

      <form className="persona-setting-editor" onSubmit={handleVoiceAffectSave}>
        <label htmlFor="patient-voice-affect">Voice affect</label>
        <div className="persona-setting-row">
          <select
            id="patient-voice-affect"
            onChange={(event) => setVoiceAffectInput(event.target.value)}
            value={voiceAffectInput}
          >
            {voiceAffectOptions.map((voiceAffectOption) => (
              <option key={voiceAffectOption} value={voiceAffectOption}>
                {voiceAffectOption}
              </option>
            ))}
          </select>
          <button disabled={isSavingVoiceAffect} type="submit">
            {isSavingVoiceAffect ? "Saving..." : "Save"}
          </button>
        </div>
        {voiceAffectStatusMessage ? (
          <p className="persona-setting-status">{voiceAffectStatusMessage}</p>
        ) : null}
      </form>
    </div>
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
  icon,
  label,
  value,
  unit,
  tone,
}: BaselineMetric) {
  return (
    <div className={`condition-metric condition-metric-${tone}`}>
      <span className="condition-label">{label}</span>
      <span className="condition-metric-center-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="condition-value">
        <strong>{value}</strong>
        {unit ? <span className="condition-unit">{unit}</span> : null}
      </div>
    </div>
  );
}

function buildBaselineMetrics(scenario: ScenarioDetail): BaselineMetric[] {
  const vitals = scenario.initial_state.vitals ?? {};
  const symptoms = scenario.initial_state.symptoms ?? {};
  const metrics: BaselineMetric[] = [];

  if (vitals.heart_rate !== undefined) {
    metrics.push({
      icon: <HeartEcgIcon />,
      label: "HR",
      tone: "heart",
      unit: "bpm",
      value: String(vitals.heart_rate),
    });
  }

  if (vitals.spo2 !== undefined) {
    metrics.push({
      icon: <OxygenIcon />,
      label: "SpO2",
      tone: "oxygen",
      unit: "%",
      value: String(vitals.spo2),
    });
  }

  if (vitals.respiratory_rate !== undefined) {
    metrics.push({
      icon: <RespiratoryRateIcon />,
      label: "RR",
      tone: "breathing",
      unit: "/min",
      value: String(vitals.respiratory_rate),
    });
  }

  if (vitals.blood_pressure !== undefined) {
    metrics.push({
      icon: <HeartEcgIcon />,
      label: "BP",
      tone: "warning",
      unit: "",
      value: String(vitals.blood_pressure),
    });
  }

  const breathingEffort = symptoms.breathing_effort;

  if (breathingEffort) {
    metrics.push({
      icon: <BreathingEffortIcon />,
      label: "Breathing",
      tone: "warning",
      unit: "",
      value: formatValue(breathingEffort),
    });
  }

  return metrics.slice(0, 5);
}

function PatientIcon() {
  return (
    <svg
      className="persona-section-icon"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="16" r="8" />
      <path d="M10 40c2.5-8.5 8-13 14-13s11.5 4.5 14 13" />
    </svg>
  );
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

function OxygenIcon() {
  return (
    <svg
      className="baseline-state-icon"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="18" cy="28" r="8" />
      <path d="M30 36h9" />
      <path d="M34.5 20v16" />
      <path d="M30 20h9" />
      <path d="M30 28h7" />
    </svg>
  );
}

function RespiratoryRateIcon() {
  return (
    <svg
      className="baseline-state-icon"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 10v27" />
      <path d="M22 21c-6-8-13-7-15 0-1.8 6.4.4 14 8 15 4.3.6 6.6-2.3 7-7V21Z" />
      <path d="M26 21c6-8 13-7 15 0 1.8 6.4-.4 14-8 15-4.3.6-6.6-2.3-7-7V21Z" />
      <path d="M15 16c2-3 5-5 9-6 4 1 7 3 9 6" />
    </svg>
  );
}

function BreathingEffortIcon() {
  return (
    <svg
      className="baseline-state-icon"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 30c5-8 10-8 15 0s10 8 15 0" />
      <path d="M7 20c5-8 10-8 15 0s10 8 15 0" />
      <path d="M37 15l4 5-4 5" />
      <path d="M37 25l4 5-4 5" />
    </svg>
  );
}

function formatBackendStatusForScreenReader(status: BackendStatus): string {
  if (status === "connected") {
    return "Connected";
  }

  if (status === "unavailable") {
    return "Backend unavailable";
  }

  return "Checking";
}

function normalizeGender(value: string): PatientGender {
  return value.toLowerCase() === "male" ? "male" : "female";
}

function formatGender(gender: string): string {
  return formatValue(gender);
}

function formatAgeSummary(ageInput: string, savedAge: number): string {
  const nextAge = Number(ageInput);

  if (Number.isInteger(nextAge) && nextAge >= 18 && nextAge <= 110) {
    return String(nextAge);
  }

  return String(savedAge);
}

function formatVoiceName(voice: string): string {
  return formatValue(voice);
}

function formatValue(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
