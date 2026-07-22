import { FormEvent, ReactNode, useEffect, useState } from "react";

import { getHealth } from "../api/client";
import {
  getCopdSobPersonaSettings,
  PatientGender,
  PatientVoice,
  updateCopdSobPersonaAge,
  updateCopdSobPersonaGender,
  updateCopdSobPersonaVoice,
  updateCopdSobPersonaVoiceAffect,
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

export function PersonaPage() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [patientName, setPatientName] = useState("Linda Thompson");
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

  useEffect(() => {
    getHealth()
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("unavailable"));

    getCopdSobPersonaSettings()
      .then((settings) => {
        setPatientName(settings.patient_name);
        setPatientAge(settings.age);
        setPatientGender(settings.gender);
        setPatientVoice(settings.voice);
        setPatientVoiceAffect(settings.voice_style);
        setAgeInput(String(settings.age));
        setGenderInput(settings.gender);
        setVoiceInput(settings.voice);
        setVoiceAffectInput(settings.voice_style);
        setAgeStatusMessage("");
        setGenderStatusMessage("");
        setVoiceStatusMessage("");
        setVoiceAffectStatusMessage("");
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
      setPatientVoice(settings.voice);
      setPatientVoiceAffect(settings.voice_style);
      setAgeInput(String(settings.age));
      setGenderInput(settings.gender);
      setVoiceInput(settings.voice);
      setVoiceAffectInput(settings.voice_style);
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
      setPatientAge(settings.age);
      setPatientGender(settings.gender);
      setPatientVoice(settings.voice);
      setPatientVoiceAffect(settings.voice_style);
      setAgeInput(String(settings.age));
      setGenderInput(settings.gender);
      setVoiceInput(settings.voice);
      setVoiceAffectInput(settings.voice_style);
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
      const settings = await updateCopdSobPersonaVoice(voiceInput);
      setPatientName(settings.patient_name);
      setPatientAge(settings.age);
      setPatientGender(settings.gender);
      setPatientVoice(settings.voice);
      setPatientVoiceAffect(settings.voice_style);
      setAgeInput(String(settings.age));
      setGenderInput(settings.gender);
      setVoiceInput(settings.voice);
      setVoiceAffectInput(settings.voice_style);
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
      const settings = await updateCopdSobPersonaVoiceAffect(voiceAffectInput);
      setPatientName(settings.patient_name);
      setPatientAge(settings.age);
      setPatientGender(settings.gender);
      setPatientVoice(settings.voice);
      setPatientVoiceAffect(settings.voice_style);
      setAgeInput(String(settings.age));
      setGenderInput(settings.gender);
      setVoiceInput(settings.voice);
      setVoiceAffectInput(settings.voice_style);
      setVoiceAffectStatusMessage("Saved. Chat and voice will use this voice affect.");
    } catch {
      setVoiceAffectStatusMessage(
        "Voice affect could not be saved. Make sure the backend is running.",
      );
    } finally {
      setIsSavingVoiceAffect(false);
    }
  }

  return (
    <main className="app-shell persona-shell">
      <section className="persona-page" aria-labelledby="persona-page-title">
        <header className="persona-topbar">
          <div className="persona-topbar-left">
            <div className="persona-title-block">
              <p className="eyebrow">Patient persona</p>
              <h1 id="persona-page-title">COPD / Shortness of Breath</h1>
            </div>
          </div>
          <div className="persona-topbar-actions">
            <a className="header-link persona-back-link" href="/">
              Dashboard
            </a>
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
                    <PersonaFact label="Age" value={formatAgeSummary(ageInput, patientAge)} />
                    <PersonaFact label="Gender" value={formatGender(genderInput)} />
                    <PersonaFact label="Voice" value={formatVoiceName(voiceInput)} />
                    <PersonaFact
                      label="Voice affect"
                      value={voiceAffectInput || patientVoiceAffect}
                    />
                    <PersonaFact label="Chief complaint" value="Shortness of breath" />
                    <PersonaFact label="Scenario" value="COPD exacerbation" />
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
                          onChange={(event) => {
                            setGenderInput(event.target.value as PatientGender);
                          }}
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
                    <form className="persona-setting-editor" onSubmit={handleVoiceSave}>
                      <label htmlFor="patient-voice">Voice</label>
                      <div className="persona-setting-row">
                        <select
                          id="patient-voice"
                          onChange={(event) => {
                            setVoiceInput(event.target.value as PatientVoice);
                          }}
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
                    <form
                      className="persona-setting-editor"
                      onSubmit={handleVoiceAffectSave}
                    >
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
                        <p className="persona-setting-status">
                          {voiceAffectStatusMessage}
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
                <ConditionMetric
                  icon={<HeartEcgIcon />}
                  label="HR"
                  value="104"
                  unit="bpm"
                  tone="heart"
                />
                <ConditionMetric
                  icon={<OxygenIcon />}
                  label="SpO2"
                  value="91"
                  unit="%"
                  tone="oxygen"
                />
                <ConditionMetric
                  icon={<RespiratoryRateIcon />}
                  label="RR"
                  value="24"
                  unit="/min"
                  tone="breathing"
                />
                <ConditionMetric
                  icon={<BreathingEffortIcon />}
                  label="Breathing"
                  value="Labored"
                  unit=""
                  tone="warning"
                />
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
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  tone: "heart" | "oxygen" | "breathing" | "warning";
}) {
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

function formatAgeSummary(ageInput: string, savedAge: number): string {
  const nextAge = Number(ageInput);

  if (Number.isInteger(nextAge) && nextAge >= 18 && nextAge <= 110) {
    return String(nextAge);
  }

  return String(savedAge);
}

function formatVoiceName(voice: string): string {
  return voice.charAt(0).toUpperCase() + voice.slice(1);
}
