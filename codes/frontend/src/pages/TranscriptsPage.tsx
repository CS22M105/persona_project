import { useEffect, useState } from "react";

import {
  getCurrentSession,
  getSessionEvents,
  getSessionTranscript,
  SessionResponse,
  TimelineEventResponse,
  TranscriptMessageResponse,
} from "../api/sessions";

export function TranscriptsPage() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [messages, setMessages] = useState<TranscriptMessageResponse[]>([]);
  const [events, setEvents] = useState<TimelineEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSessionRecord();
  }, []);

  async function loadSessionRecord() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const currentSession = await getCurrentSession();

      if (!currentSession.session) {
        setSession(null);
        setMessages([]);
        setEvents([]);
        return;
      }

      const [transcriptResponse, eventsResponse] = await Promise.all([
        getSessionTranscript(currentSession.session.session_id),
        getSessionEvents(currentSession.session.session_id),
      ]);

      setSession(currentSession.session);
      setMessages(transcriptResponse.messages);
      setEvents(eventsResponse.events);
    } catch {
      setErrorMessage("Transcript and timeline failed to load. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownloadDebriefingDraft() {
    if (!session) {
      return;
    }

    const draftText = buildDebriefingDraft(session, messages, events);
    const fileBlob = new Blob([draftText], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(fileBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `debriefing-draft-${session.session_id}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <main className="app-shell transcript-shell">
      <section className="transcript-page" aria-labelledby="transcript-page-title">
        <nav className="voice-nav transcript-nav" aria-label="Transcript navigation">
          <div className="voice-nav-brand">
            <p className="eyebrow">Session record</p>
            <h1 id="transcript-page-title">Transcripts, Timeline and Debriefing</h1>
          </div>
          <div className="voice-nav-actions">
            <a className="header-link" href="/">
              Dashboard
            </a>
            <a className="header-link" href="/personas/copd-sob">
              Persona page
            </a>
            <a className="header-link" href="/voice">
              Voice room
            </a>
            <button className="header-link transcript-refresh-button" onClick={loadSessionRecord} type="button">
              Refresh
            </button>
          </div>
        </nav>

        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        <div className="transcript-content">
          <section className="transcript-summary-strip" aria-label="Session summary">
            <TranscriptSummaryItem
              label="Session"
              value={session?.status ?? "No active session"}
            />
            <TranscriptSummaryItem
              label="Transcript"
              value={`${messages.length} message${messages.length === 1 ? "" : "s"}`}
            />
            <TranscriptSummaryItem
              label="Timeline"
              value={`${events.length} event${events.length === 1 ? "" : "s"}`}
            />
            <TranscriptSummaryItem
              label="Started"
              value={session ? formatDateTime(session.started_at) : "Waiting"}
            />
          </section>

          {isLoading ? <p className="dashboard-note">Loading session record...</p> : null}

          {!isLoading && !session ? (
            <section className="dashboard-card transcript-empty-card">
              <h2>No session record yet</h2>
              <p>
                Start a voice room or text conversation first. Transcript and timeline
                entries will appear here once a session exists.
              </p>
            </section>
          ) : null}

          {session ? (
            <div className="transcript-record-grid">
              <section className="dashboard-card transcript-panel" aria-labelledby="conversation-transcript-title">
                <div className="transcript-panel-heading">
                  <div>
                    <p className="eyebrow">Conversation</p>
                    <h2 id="conversation-transcript-title">Transcript</h2>
                  </div>
                </div>
                {messages.length > 0 ? (
                  <ol className="transcript-message-list">
                    {messages.map((message) => (
                      <li
                        className={`transcript-message transcript-message-${message.speaker}`}
                        key={message.message_id}
                      >
                        <div className="transcript-message-meta">
                          <strong>{formatLabel(message.speaker)}</strong>
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                        <p>{message.text}</p>
                        <span className="report-entry-meta">
                          {formatLabel(message.message_type)} | Source:{" "}
                          {formatLabel(message.source)}
                          {message.cue_id ? ` | Cue: ${formatLabel(message.cue_id)}` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="dashboard-note">No transcript messages yet.</p>
                )}
              </section>

              <section className="dashboard-card transcript-panel" aria-labelledby="event-timeline-title">
                <div className="transcript-panel-heading">
                  <div>
                    <p className="eyebrow">Clinical flow</p>
                    <h2 id="event-timeline-title">Event Timeline</h2>
                  </div>
                </div>
                {events.length > 0 ? (
                  <ol className="timeline-record-list">
                    {events.map((event) => (
                      <li className="timeline-record-item" key={event.event_id}>
                        <div className="timeline-record-time">
                          {formatTime(event.timestamp)}
                        </div>
                        <div>
                          <strong>{event.label ?? formatLabel(event.event_type)}</strong>
                          {formatTimelineVitals(event)}
                          <span className="report-entry-meta">
                            {formatLabel(event.event_type)}
                            {event.cue_id ? ` | Cue: ${formatLabel(event.cue_id)}` : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="dashboard-note">No timeline events yet.</p>
                )}
              </section>

              <section
                className="dashboard-card transcript-panel transcript-debrief-panel"
                aria-labelledby="debriefing-draft-title"
              >
                <div className="transcript-panel-heading">
                  <div>
                    <p className="eyebrow">Debriefing</p>
                    <h2 id="debriefing-draft-title">Downloadable Debriefing Draft</h2>
                  </div>
                  <button
                    className="transcript-download-button"
                    disabled={messages.length === 0 && events.length === 0}
                    onClick={handleDownloadDebriefingDraft}
                    type="button"
                  >
                    Download
                  </button>
                </div>
                <div className="debrief-scroll-area">
                  <p className="debrief-placeholder">
                    This is a minimal draft export based on the current transcript and
                    timeline. The structured debriefing algorithm will be added later.
                  </p>
                  <div className="debrief-summary-list">
                    <TranscriptSummaryItem
                      label="Session status"
                      value={formatLabel(session.status)}
                    />
                    <TranscriptSummaryItem
                      label="Conversation entries"
                      value={String(messages.length)}
                    />
                    <TranscriptSummaryItem
                      label="Timeline events"
                      value={String(events.length)}
                    />
                    <TranscriptSummaryItem
                      label="Started"
                      value={formatDateTime(session.started_at)}
                    />
                  </div>
                  <section className="debrief-preview-section">
                    <h3>Recent Conversation</h3>
                    {messages.length > 0 ? (
                      <ol className="debrief-preview-list">
                        {messages.slice(-4).map((message) => (
                          <li key={message.message_id}>
                            <strong>{formatLabel(message.speaker)}:</strong>{" "}
                            {message.text}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>No transcript messages recorded yet.</p>
                    )}
                  </section>
                  <section className="debrief-preview-section">
                    <h3>Recent Timeline</h3>
                    {events.length > 0 ? (
                      <ol className="debrief-preview-list">
                        {events.slice(-5).map((event) => (
                          <li key={event.event_id}>
                            <strong>{formatTime(event.timestamp)}:</strong>{" "}
                            {event.label ?? formatLabel(event.event_type)}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>No timeline events recorded yet.</p>
                    )}
                  </section>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function TranscriptSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="transcript-summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildDebriefingDraft(
  session: SessionResponse,
  messages: TranscriptMessageResponse[],
  events: TimelineEventResponse[],
): string {
  const transcriptLines =
    messages.length > 0
      ? messages.map(
          (message) =>
            `- ${formatTime(message.timestamp)} | ${formatLabel(message.speaker)}: ${message.text}`,
        )
      : ["- No transcript messages recorded."];

  const eventLines =
    events.length > 0
      ? events.map(
          (event) =>
            `- ${formatTime(event.timestamp)} | ${event.label ?? formatLabel(event.event_type)}`,
        )
      : ["- No timeline events recorded."];

  return [
    "AI Patient Voice - Debriefing Draft",
    "",
    "Note: This is a basic export placeholder. The selected debriefing algorithm will be added later.",
    "",
    "Session",
    `- Session ID: ${session.session_id}`,
    `- Scenario ID: ${session.scenario_id}`,
    `- Status: ${session.status}`,
    `- Started: ${formatDateTime(session.started_at)}`,
    session.ended_at ? `- Ended: ${formatDateTime(session.ended_at)}` : "- Ended: Not ended",
    "",
    "Transcript",
    ...transcriptLines,
    "",
    "Event Timeline",
    ...eventLines,
    "",
    "Debriefing Algorithm",
    "- Pending instructor-selected algorithm.",
  ].join("\n");
}

function formatTimelineVitals(event: TimelineEventResponse) {
  const snapshot = event.state_snapshot_json;

  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const vitals = snapshot["vitals"];

  if (!vitals || typeof vitals !== "object") {
    return null;
  }

  const heartRate = "heart_rate" in vitals ? vitals.heart_rate : null;
  const spo2 = "spo2" in vitals ? vitals.spo2 : null;

  if (heartRate === null && spo2 === null) {
    return null;
  }

  return (
    <p className="timeline-vitals">
      HR {String(heartRate ?? "n/a")} | SpO2 {String(spo2 ?? "n/a")}%
    </p>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
