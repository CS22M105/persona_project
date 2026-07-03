import { useEffect, useState } from "react";

import {
  applyInstructorCue,
  getPatientState,
  PatientState,
  resetPatientState,
} from "../api/state";
import {
  endSession,
  FinalDebriefReport,
  getSessionEvents,
  getSessionReport,
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
  const [report, setReport] = useState<FinalDebriefReport | null>(null);
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
      setReport(null);
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
      setReport(null);
      await refreshPersistedSessionData();
    } catch {
      setErrorMessage("Instructor cue failed. Make sure the backend is running.");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleEndSession() {
    if (!session) {
      return;
    }

    setActiveAction("end-session");
    setErrorMessage("");

    try {
      setReport(null);
      const endedSession = await endSession(session.session_id);
      setSession(endedSession);
      await refreshPersistedSessionData(endedSession.session_id);
    } catch {
      setErrorMessage("Session failed to end. Make sure the backend is running.");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleGenerateReport() {
    if (!session) {
      return;
    }

    setActiveAction("generate-report");
    setErrorMessage("");

    try {
      await refreshPersistedSessionData(session.session_id);
      const reportResponse = await getSessionReport(session.session_id);
      setReport(reportResponse);
    } catch {
      setErrorMessage("Report failed to generate. Make sure the backend is running.");
    } finally {
      setActiveAction(null);
    }
  }

  const isActionRunning = activeAction !== null;
  const isSessionEnded = session?.status === "ended";
  const canEndSession = Boolean(session && session.status !== "ended");
  const canGenerateReport = Boolean(session && isSessionEnded);

  return (
    <main className="app-shell dashboard-shell">
      <section className="dashboard-page" aria-labelledby="dashboard-title">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Instructor dashboard</p>
            <h1 id="dashboard-title">COPD/SOB Control View</h1>
          </div>
          <div className="header-actions">
            <a className="header-link" href="/voice">
              Open voice room
            </a>
            {patientState ? (
              <span className="scenario-badge">Session: {patientState.status}</span>
            ) : null}
            {session ? (
              <span className="scenario-badge">Record: {session.status}</span>
            ) : null}
          </div>
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
              <div className="session-action-grid">
                <button
                  className="control-button"
                  disabled={isActionRunning || !canEndSession}
                  onClick={handleEndSession}
                  type="button"
                >
                  {activeAction === "end-session" ? "Ending..." : "End session"}
                </button>
                <button
                  className="control-button"
                  disabled={isActionRunning || !canGenerateReport}
                  onClick={handleGenerateReport}
                  type="button"
                >
                  {activeAction === "generate-report"
                    ? "Generating..."
                    : "Generate report"}
                </button>
              </div>
              {session && !isSessionEnded ? (
                <p className="dashboard-note">
                  End the session before generating the final report.
                </p>
              ) : null}
              <div className="cue-grid">
                {cueButtons.map((cue) => (
                  <button
                    className="control-button"
                    disabled={isActionRunning || isSessionEnded}
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

            <section className="dashboard-card report-card" aria-labelledby="report-title">
              <h2 id="report-title">Final Debrief Report</h2>
              {report ? <ReportView report={report} /> : <ReportEmptyState />}
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ReportEmptyState() {
  return (
    <p className="dashboard-note">
      End the session, then generate the final debrief report from the persisted
      transcript and timeline.
    </p>
  );
}

function ReportView({ report }: { report: FinalDebriefReport }) {
  return (
    <article className="report-document" aria-label={report.report_title}>
      <header className="report-header">
        <div>
          <p className="eyebrow">{report.report_length_target}</p>
          <h3>{report.report_title}</h3>
        </div>
        <span className="scenario-badge">{report.session.status}</span>
      </header>

      <p className="report-disclaimer">{report.disclaimer}</p>
      <p className="report-summary">{report.summary}</p>

      <dl className="report-meta">
        <ReportMeta label="Scenario" value={report.session.scenario_name} />
        <ReportMeta
          label="Transcript"
          value={`${report.session.transcript_message_count} messages`}
        />
        <ReportMeta
          label="Timeline"
          value={`${report.session.timeline_event_count} events`}
        />
        <ReportMeta label="Started" value={formatDateTime(report.session.started_at)} />
        <ReportMeta
          label="Ended"
          value={report.session.ended_at ? formatDateTime(report.session.ended_at) : "Not ended"}
        />
        <ReportMeta label="Session ID" value={report.session.session_id} />
      </dl>

      <div className="report-section-grid">
        <section>
          <h4>Transcript Excerpt</h4>
          <ol className="compact-list">
            {report.transcript_excerpt.map((message) => (
              <li key={`${message.timestamp}-${message.speaker}-${message.text}`}>
                <strong>{formatLabel(message.speaker)}:</strong> {message.text}
                <span className="report-entry-meta">
                  {formatDateTime(message.timestamp)} | {formatLabel(message.message_type)} |
                  Source: {formatLabel(message.source)}
                  {message.cue_id ? ` | Cue: ${formatLabel(message.cue_id)}` : ""}
                </span>
              </li>
            ))}
          </ol>
          {report.transcript_omitted_count > 0 ? (
            <p className="report-small">
              {report.transcript_omitted_count} additional transcript message(s)
              omitted for report length.
            </p>
          ) : null}
        </section>

        <section>
          <h4>Event Timeline</h4>
          <ol className="compact-list">
            {report.timeline_excerpt.map((event) => (
              <li key={`${event.timestamp}-${event.event_type}-${event.label}`}>
                <strong>{event.label}</strong>
                {formatReportVitals(event)}
                <span className="report-entry-meta">
                  {formatDateTime(event.timestamp)} | {formatLabel(event.event_type)}
                  {event.cue_id ? ` | Cue: ${formatLabel(event.cue_id)}` : ""}
                </span>
              </li>
            ))}
          </ol>
          {report.timeline_omitted_count > 0 ? (
            <p className="report-small">
              {report.timeline_omitted_count} additional event(s) omitted for report
              length.
            </p>
          ) : null}
        </section>

        <section>
          <h4>Faculty Review Checklist</h4>
          <ul className="compact-list">
            {report.assessment_checklist.map((item) => (
              <li key={item.item_id}>
                {item.label}
                <span className="report-entry-meta">{item.review_status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4>Debrief Focus</h4>
          <ul className="compact-list">
            {report.communication_observations.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>

          <h4>Prompts</h4>
          <ul className="compact-list">
            {report.suggested_debrief_prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </section>
      </div>

      <p className="report-small">{report.instructor_notes_placeholder}</p>
    </article>
  );
}

type StateRowProps = {
  label: string;
  value: string;
};

function ReportMeta({ label, value }: StateRowProps) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatReportVitals(event: {
  heart_rate: number | null;
  spo2: number | null;
  respiratory_rate: number | null;
  breathing_effort: string | null;
  anxiety: string | null;
  oxygen_applied: boolean | null;
  bronchodilator_given: boolean | null;
}) {
  const details = [
    event.heart_rate !== null ? `HR ${event.heart_rate}` : null,
    event.spo2 !== null ? `SpO2 ${event.spo2}%` : null,
    event.respiratory_rate !== null ? `RR ${event.respiratory_rate}` : null,
    event.breathing_effort ? `effort ${event.breathing_effort}` : null,
    event.anxiety ? `anxiety ${event.anxiety}` : null,
    event.oxygen_applied !== null ? `oxygen ${formatBoolean(event.oxygen_applied)}` : null,
    event.bronchodilator_given !== null
      ? `bronchodilator ${formatBoolean(event.bronchodilator_given)}`
      : null,
  ].filter(Boolean);

  if (details.length === 0) {
    return null;
  }

  return <span> - {details.join(", ")}</span>;
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
