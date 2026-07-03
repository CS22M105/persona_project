import { useEffect, useState } from "react";

import { getPatientState, PatientState } from "../api/state";
import {
  createRealtimeVoiceSession,
  RealtimeSessionResponse,
} from "../api/voice";


type VoiceConnectionStatus =
  | "idle"
  | "loading_state"
  | "connecting"
  | "ready"
  | "disconnected"
  | "error";

type PublicRealtimeSession = Omit<RealtimeSessionResponse, "client_secret">;


export function VoiceRoom() {
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const [voiceSession, setVoiceSession] = useState<PublicRealtimeSession | null>(null);
  const [status, setStatus] = useState<VoiceConnectionStatus>("loading_state");
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    refreshPatientState();
  }, []);

  async function refreshPatientState() {
    setErrorMessage("");

    try {
      const response = await getPatientState();
      setPatientState(response.state);
      setStatus((currentStatus) =>
        currentStatus === "loading_state" ? "idle" : currentStatus,
      );
    } catch {
      setStatus("error");
      setErrorMessage("Patient state failed to load. Make sure the backend is running.");
    }
  }

  async function handleConnectVoice() {
    setStatus("connecting");
    setErrorMessage("");

    try {
      const sessionResponse = await createRealtimeVoiceSession();
      setVoiceSession(toPublicRealtimeSession(sessionResponse));
      setStatus("ready");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Voice session failed to start. Check backend voice setup and API key configuration.",
      );
    }
  }

  function handleDisconnectVoice() {
    setVoiceSession(null);
    setIsMuted(false);
    setStatus("disconnected");
  }

  const canConnect = status !== "connecting" && status !== "ready";
  const canDisconnect = status === "ready";
  const statusLabel = formatStatus(status);

  return (
    <main className="app-shell voice-shell">
      <section className="voice-page" aria-labelledby="voice-title">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Student voice room</p>
            <h1 id="voice-title">AI Patient Voice</h1>
            <p className="lede">
              Sim-room interface for speaking with the COPD/SOB AI patient.
            </p>
          </div>
          <div className="header-actions">
            <a className="header-link" href="/">
              Instructor dashboard
            </a>
            <span className={`voice-status voice-status-${status}`}>
              {statusLabel}
            </span>
          </div>
        </header>

        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        <div className="voice-grid">
          <section className="dashboard-card voice-control-card" aria-labelledby="voice-controls-title">
            <h2 id="voice-controls-title">Voice Controls</h2>
            <div className="voice-control-grid">
              <button
                className="control-button"
                disabled={!canConnect}
                onClick={handleConnectVoice}
                type="button"
              >
                {status === "connecting" ? "Connecting..." : "Connect voice"}
              </button>
              <button
                className="control-button control-button-secondary"
                disabled={!canDisconnect}
                onClick={handleDisconnectVoice}
                type="button"
              >
                Disconnect
              </button>
              <button
                className="control-button"
                disabled={!canDisconnect}
                onClick={() => setIsMuted((currentValue) => !currentValue)}
                type="button"
              >
                {isMuted ? "Unmute mic" : "Mute mic"}
              </button>
              <button
                className="control-button"
                disabled={status === "connecting"}
                onClick={refreshPatientState}
                type="button"
              >
                Refresh state
              </button>
            </div>

            <dl className="voice-session-grid">
              <VoiceDetail label="Connection" value={statusLabel} />
              <VoiceDetail label="Microphone" value={isMuted ? "Muted" : "Ready"} />
              <VoiceDetail
                label="Realtime model"
                value={voiceSession?.model ?? "Not connected"}
              />
              <VoiceDetail
                label="Voice"
                value={voiceSession?.voice ?? "Not connected"}
              />
              <VoiceDetail
                label="Session"
                value={voiceSession?.session_id ?? "Not connected"}
              />
            </dl>

            <p className="dashboard-note">
              Microphone and speaker streaming will be connected in Step 9.6.
            </p>
          </section>

          <section className="dashboard-card voice-state-card" aria-labelledby="voice-state-title">
            <h2 id="voice-state-title">Current Patient State</h2>
            {patientState ? (
              <dl className="state-grid">
                <VoiceDetail label="Stage" value={patientState.stage} />
                <VoiceDetail label="HR" value={`${patientState.vitals.heart_rate} bpm`} />
                <VoiceDetail label="SpO2" value={`${patientState.vitals.spo2}%`} />
                <VoiceDetail
                  label="RR"
                  value={`${patientState.vitals.respiratory_rate}/min`}
                />
                <VoiceDetail
                  label="Breathing effort"
                  value={patientState.symptoms.breathing_effort}
                />
                <VoiceDetail label="Anxiety" value={patientState.emotion.anxiety} />
                <VoiceDetail
                  label="Speech"
                  value={patientState.voice_behavior.speech_pattern}
                />
                <VoiceDetail label="Tone" value={patientState.voice_behavior.tone} />
                <VoiceDetail
                  label="Oxygen"
                  value={formatBoolean(patientState.interventions.oxygen_applied)}
                />
                <VoiceDetail
                  label="Bronchodilator"
                  value={formatBoolean(patientState.interventions.bronchodilator_given)}
                />
              </dl>
            ) : (
              <p className="dashboard-note">Patient state has not loaded yet.</p>
            )}
          </section>

          <section className="dashboard-card voice-transcript-card" aria-labelledby="voice-transcript-title">
            <h2 id="voice-transcript-title">Voice Transcript</h2>
            <ol className="event-list">
              <li>
                <strong>Waiting for voice transcript</strong>
                <span className="report-entry-meta">
                  Transcript persistence will be added after the voice connection is stable.
                </span>
              </li>
            </ol>
          </section>
        </div>
      </section>
    </main>
  );
}


function toPublicRealtimeSession(
  session: RealtimeSessionResponse,
): PublicRealtimeSession {
  return {
    expires_at: session.expires_at,
    session_id: session.session_id,
    model: session.model,
    voice: session.voice,
    scenario_id: session.scenario_id,
    connect_url: session.connect_url,
  };
}


function VoiceDetail({ label, value }: { label: string; value: string }) {
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


function formatStatus(status: VoiceConnectionStatus): string {
  const labels: Record<VoiceConnectionStatus, string> = {
    idle: "Not connected",
    loading_state: "Loading state",
    connecting: "Connecting",
    ready: "Ready",
    disconnected: "Disconnected",
    error: "Needs attention",
  };

  return labels[status];
}

