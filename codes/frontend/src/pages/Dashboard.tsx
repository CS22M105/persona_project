import { useEffect, useState } from "react";

import {
  applyInstructorCue,
  getPatientState,
  PatientState,
  resetPatientState,
} from "../api/state";
import {
  getSessionEvents,
  getSessionTranscript,
  SessionResponse,
  startSession,
  TimelineEventResponse,
  TranscriptMessageResponse,
  TranscriptSpeaker,
} from "../api/sessions";
import { Chat, ChatMessage } from "./Chat";

const cueButtons = [
  { cueId: "spo2_dropped", label: "SpO2 dropped" },
  { cueId: "hr_increased", label: "HR increased" },
  { cueId: "breathing_worsened", label: "Breathing worsened" },
  { cueId: "oxygen_applied", label: "Oxygen applied" },
  { cueId: "bronchodilator_given", label: "Bronchodilator given" },
  { cueId: "patient_improving", label: "Patient improving" },
];

export function Dashboard() {
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [transcriptMessages, setTranscriptMessages] = useState<
    TranscriptMessageResponse[]
  >([]);
  const [events, setEvents] = useState<TimelineEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const stateResponse = await getPatientState();
        const sessionResponse = await startSession(stateResponse.state.scenario_id);

        setPatientState(stateResponse.state);
        setSession(sessionResponse);
        await refreshPersistedSessionData(sessionResponse.session_id);
        setErrorMessage("");
      } catch {
        setErrorMessage("Dashboard data failed to load. Make sure the backend is running.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  async function refreshPersistedSessionData(sessionId = session?.session_id) {
    if (!sessionId) {
      return;
    }

    const [transcriptResponse, eventsResponse] = await Promise.all([
      getSessionTranscript(sessionId),
      getSessionEvents(sessionId),
    ]);

    setTranscriptMessages(transcriptResponse.messages);
    setEvents(eventsResponse.events);
  }

  async function handleResetState() {
    setActiveAction("reset");
    setErrorMessage("");

    try {
      const stateResponse = await resetPatientState();
      setPatientState(stateResponse.state);
      await refreshPersistedSessionData();
    } catch {
      setErrorMessage("Patient state failed to reset. Make sure the backend is running.");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCueClick(cueId: string) {
    setActiveAction(cueId);
    setErrorMessage("");

    try {
      const stateResponse = await applyInstructorCue(cueId);
      setPatientState(stateResponse.state);
      await refreshPersistedSessionData();
    } catch {
      setErrorMessage("Instructor cue failed. Make sure the backend is running.");
    } finally {
      setActiveAction(null);
    }
  }

  const isActionRunning = activeAction !== null;

  return (
    <main className="app-shell dashboard-shell">
      <section className="dashboard-page" aria-labelledby="dashboard-title">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Instructor dashboard</p>
            <h1 id="dashboard-title">COPD/SOB Control View</h1>
          </div>
          {patientState ? (
            <span className="scenario-badge">Session: {patientState.status}</span>
          ) : null}
          {session ? (
            <span className="scenario-badge">Record: {session.status}</span>
          ) : null}
        </header>

        {isLoading ? <p>Loading patient state...</p> : null}
        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        {patientState ? (
          <div className="dashboard-grid">
            <section className="dashboard-card state-card" aria-labelledby="state-title">
              <h2 id="state-title">Current State</h2>
              <dl className="state-grid">
                <StateRow label="Status" value={patientState.status} />
                <StateRow label="Stage" value={patientState.stage} />
                <StateRow label="HR" value={`${patientState.vitals.heart_rate} bpm`} />
                <StateRow label="SpO2" value={`${patientState.vitals.spo2}%`} />
                <StateRow
                  label="RR"
                  value={`${patientState.vitals.respiratory_rate}/min`}
                />
                <StateRow label="BP" value={patientState.vitals.blood_pressure} />
                <StateRow
                  label="Breathing effort"
                  value={patientState.symptoms.breathing_effort}
                />
                <StateRow
                  label="Chest tightness"
                  value={patientState.symptoms.chest_tightness}
                />
                <StateRow label="Anxiety" value={patientState.emotion.anxiety} />
                <StateRow label="Fatigue" value={patientState.emotion.fatigue} />
                <StateRow
                  label="Oxygen applied"
                  value={formatBoolean(patientState.interventions.oxygen_applied)}
                />
                <StateRow
                  label="Bronchodilator given"
                  value={formatBoolean(patientState.interventions.bronchodilator_given)}
                />
                <StateRow
                  label="AI paused"
                  value={formatBoolean(patientState.safety.ai_paused)}
                />
                <StateRow
                  label="Instructor takeover"
                  value={formatBoolean(patientState.safety.instructor_takeover)}
                />
              </dl>
            </section>

            <section className="dashboard-card controls-card" aria-labelledby="controls-title">
              <h2 id="controls-title">Instructor Controls</h2>
              <button
                className="control-button control-button-secondary"
                disabled={isActionRunning}
                onClick={handleResetState}
                type="button"
              >
                {activeAction === "reset" ? "Resetting..." : "Reset patient state"}
              </button>
              <div className="cue-grid">
                {cueButtons.map((cue) => (
                  <button
                    className="control-button"
                    disabled={isActionRunning}
                    key={cue.cueId}
                    onClick={() => handleCueClick(cue.cueId)}
                    type="button"
                  >
                    {activeAction === cue.cueId ? "Updating..." : cue.label}
                  </button>
                ))}
              </div>
              {activeAction ? (
                <p className="dashboard-note">Updating patient state...</p>
              ) : null}
            </section>

            <section className="dashboard-card timeline-card" aria-labelledby="events-title">
              <h2 id="events-title">Event Timeline</h2>
              {events.length > 0 ? (
                <ol className="event-list">
                  {events.map((event) => (
                    <li key={event.event_id}>
                      <strong>{event.label ?? event.event_type}</strong>
                      {formatTimelineDetails(event)}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No state events yet.</p>
              )}
            </section>

            <section className="dashboard-card chat-card" aria-labelledby="dashboard-chat-title">
              <h2 id="dashboard-chat-title">Patient Conversation</h2>
              <Chat
                embedded
                onMessageSent={() => refreshPersistedSessionData()}
                persistedMessages={toChatMessages(transcriptMessages)}
                statusLabel="Persisted"
              />
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

type StateRowProps = {
  label: string;
  value: string;
};

function StateRow({ label, value }: StateRowProps) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function toChatMessages(messages: TranscriptMessageResponse[]): ChatMessage[] {
  return messages
    .filter(
      (
        message,
      ): message is TranscriptMessageResponse & { speaker: "student" | "patient" } =>
        isChatSpeaker(message.speaker),
    )
    .map((message) => ({
      id: message.message_id,
      speaker: message.speaker,
      text: message.text,
    }));
}

function isChatSpeaker(
  speaker: TranscriptSpeaker,
): speaker is "student" | "patient" {
  return speaker === "student" || speaker === "patient";
}

function formatTimelineDetails(event: TimelineEventResponse) {
  const stateSnapshot = event.state_snapshot_json;

  if (!stateSnapshot || typeof stateSnapshot !== "object") {
    return null;
  }

  const vitals = stateSnapshot["vitals"];

  if (!vitals || typeof vitals !== "object") {
    return null;
  }

  const heartRate = "heart_rate" in vitals ? vitals.heart_rate : null;
  const spo2 = "spo2" in vitals ? vitals.spo2 : null;

  if (heartRate === null && spo2 === null) {
    return null;
  }

  return (
    <span>
      {" "}
      - HR {String(heartRate ?? "n/a")}, SpO2 {String(spo2 ?? "n/a")}
    </span>
  );
}
