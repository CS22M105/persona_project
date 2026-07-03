import { RefObject, useEffect, useRef, useState } from "react";

import {
  applyInstructorCue,
  endInstructorTakeover,
  getPatientState,
  PatientState,
  pauseAiPatient,
  resumeAiPatient,
  resetPatientState,
  startInstructorTakeover,
} from "../api/state";
import {
  getCurrentSession,
  getSessionTranscript,
  TranscriptMessageResponse,
  TranscriptSpeaker,
} from "../api/sessions";
import {
  createRealtimeVoiceSession,
  getCurrentVoiceInstructions,
  RealtimeSessionResponse,
  saveVoiceTimelineEvent,
  saveVoiceTranscriptMessage,
  VoiceInstructionsResponse,
} from "../api/voice";
import { Chat, ChatMessage } from "./Chat";


type VoiceConnectionStatus =
  | "idle"
  | "loading_state"
  | "requesting_microphone"
  | "connecting"
  | "ready"
  | "disconnected"
  | "error";

type PublicRealtimeSession = Omit<RealtimeSessionResponse, "client_secret">;

type RealtimeTranscriptEvent = {
  type?: string;
  transcript?: string;
  text?: string;
};

const cueButtons = [
  { cueId: "spo2_dropped", label: "SpO2 dropped" },
  { cueId: "hr_increased", label: "HR increased" },
  { cueId: "breathing_worsened", label: "Breathing worsened" },
  { cueId: "oxygen_applied", label: "Oxygen applied" },
  { cueId: "bronchodilator_given", label: "Bronchodilator given" },
  { cueId: "patient_improving", label: "Patient improving" },
];


export function VoiceRoom() {
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const [voiceSession, setVoiceSession] = useState<PublicRealtimeSession | null>(null);
  const [status, setStatus] = useState<VoiceConnectionStatus>("loading_state");
  const [isMuted, setIsMuted] = useState(false);
  const [activeInstructorAction, setActiveInstructorAction] = useState<string | null>(
    null,
  );
  const [lastInstructionSyncAt, setLastInstructionSyncAt] = useState<string | null>(null);
  const [textConversationMessages, setTextConversationMessages] = useState<
    ChatMessage[]
  >([]);
  const [voiceTranscriptMessages, setVoiceTranscriptMessages] = useState<
    TranscriptMessageResponse[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastInstructionStateUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    refreshPatientState();
    refreshTextConversation();

    return () => {
      cleanupVoiceConnection();
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const intervalId = window.setInterval(() => {
      refreshPatientState({ syncVoiceInstructions: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);

  async function refreshPatientState(
    options: { syncVoiceInstructions?: boolean } = {},
  ) {
    setErrorMessage("");

    try {
      const response = await getPatientState();
      setPatientState(response.state);
      setStatus((currentStatus) =>
        currentStatus === "loading_state" ? "idle" : currentStatus,
      );

      if (options.syncVoiceInstructions) {
        await syncVoiceInstructions();
      }
    } catch {
      setStatus("error");
      setErrorMessage("Patient state failed to load. Make sure the backend is running.");
    }
  }

  async function refreshTextConversation() {
    try {
      const currentSessionResponse = await getCurrentSession();

      if (!currentSessionResponse.session) {
        setTextConversationMessages([]);
        return;
      }

      const transcriptResponse = await getSessionTranscript(
        currentSessionResponse.session.session_id,
      );

      setTextConversationMessages(toChatMessages(transcriptResponse.messages));
    } catch {
      setTextConversationMessages([]);
    }
  }

  async function handleConnectVoice() {
    cleanupVoiceConnection();
    setStatus("connecting");
    setErrorMessage("");

    try {
      const sessionResponse = await createRealtimeVoiceSession();
      setStatus("requesting_microphone");
      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStatus("connecting");
      await connectRealtimeWebRtc(sessionResponse, microphoneStream, remoteAudioRef);
      setVoiceSession(toPublicRealtimeSession(sessionResponse));
      setIsMuted(false);
      setStatus("ready");
      await syncVoiceInstructions({ force: true });
      await recordVoiceTimelineEvent(
        "voice_connected",
        "Voice connected",
        sessionResponse.session_id,
      );
    } catch (error) {
      cleanupVoiceConnection();
      setStatus("error");
      setErrorMessage(buildVoiceConnectionErrorMessage(error));
    }
  }

  async function handleDisconnectVoice() {
    await recordVoiceTimelineEvent("voice_disconnected", "Voice disconnected");
    cleanupVoiceConnection();
    setStatus("disconnected");
  }

  async function handleToggleMute() {
    const nextMuted = !isMuted;

    localStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = !nextMuted;
      });

    setIsMuted(nextMuted);
    await recordVoiceTimelineEvent(
      nextMuted ? "voice_muted" : "voice_unmuted",
      nextMuted ? "Voice microphone muted" : "Voice microphone unmuted",
    );
  }

  async function handleResetState() {
    setActiveInstructorAction("reset");
    setErrorMessage("");

    try {
      const response = await resetPatientState();
      setPatientState(response.state);
      setTextConversationMessages([]);
      setVoiceTranscriptMessages([]);
      await syncVoiceInstructions({ force: true });
      await refreshTextConversation();
    } catch {
      setErrorMessage("Patient state failed to reset. Make sure the backend is running.");
    } finally {
      setActiveInstructorAction(null);
    }
  }

  async function handleCueClick(cueId: string) {
    setActiveInstructorAction(cueId);
    setErrorMessage("");

    try {
      const response = await applyInstructorCue(cueId);
      setPatientState(response.state);
      await syncVoiceInstructions({ force: true });
      await refreshTextConversation();
    } catch {
      setErrorMessage("Instructor cue failed. Make sure the backend is running.");
    } finally {
      setActiveInstructorAction(null);
    }
  }

  async function handlePauseAi() {
    await applySafetyControl("pause");
  }

  async function handleResumeAi() {
    await applySafetyControl("resume");
  }

  async function handleStartTakeover() {
    await applySafetyControl("takeover_start");
  }

  async function handleEndTakeover() {
    await applySafetyControl("takeover_end");
  }

  async function applySafetyControl(
    action: "pause" | "resume" | "takeover_start" | "takeover_end",
  ) {
    setErrorMessage("");

    try {
      const response = await runSafetyControl(action);
      setPatientState(response.state);

      if (action === "pause" || action === "takeover_start") {
        cancelCurrentRealtimeResponse();
        setMicrophoneEnabled(false);
        setIsMuted(true);
      }

      if (action === "resume" || action === "takeover_end") {
        setMicrophoneEnabled(true);
        setIsMuted(false);
      }

      await syncVoiceInstructions({ force: true });
    } catch {
      setErrorMessage("Safety control failed. Make sure the backend is running.");
    }
  }

  async function runSafetyControl(
    action: "pause" | "resume" | "takeover_start" | "takeover_end",
  ) {
    if (action === "pause") {
      return pauseAiPatient();
    }

    if (action === "resume") {
      return resumeAiPatient();
    }

    if (action === "takeover_start") {
      return startInstructorTakeover();
    }

    return endInstructorTakeover();
  }

  function setMicrophoneEnabled(isEnabled: boolean) {
    localStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = isEnabled;
      });
  }

  function cancelCurrentRealtimeResponse() {
    sendRealtimeEvent({ type: "response.cancel" });
  }

  function cleanupVoiceConnection() {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    lastInstructionStateUpdatedAtRef.current = null;
    setLastInstructionSyncAt(null);

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setVoiceSession(null);
    setIsMuted(false);
  }

  async function connectRealtimeWebRtc(
    session: RealtimeSessionResponse,
    microphoneStream: MediaStream,
    audioRef: RefObject<HTMLAudioElement | null>,
  ) {
    const peerConnection = new RTCPeerConnection();
    const dataChannel = peerConnection.createDataChannel("oai-events");

    peerConnectionRef.current = peerConnection;
    localStreamRef.current = microphoneStream;
    dataChannelRef.current = dataChannel;
    dataChannel.onmessage = (event) => {
      handleRealtimeDataChannelMessage(event);
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "failed") {
        cleanupVoiceConnection();
        setStatus("error");
        setErrorMessage("Voice connection failed. Disconnect and try again.");
      }

      if (peerConnection.connectionState === "disconnected") {
        cleanupVoiceConnection();
        setStatus("disconnected");
      }
    };

    peerConnection.ontrack = (event) => {
      if (!audioRef.current) {
        return;
      }

      const [remoteStream] = event.streams;
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(() => {
        setErrorMessage("Patient audio is connected, but browser playback was blocked.");
      });
    };

    microphoneStream.getAudioTracks().forEach((track) => {
      peerConnection.addTrack(track, microphoneStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const answerResponse = await fetch(session.connect_url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.client_secret}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });

    if (!answerResponse.ok) {
      throw new Error(
        `Realtime WebRTC connection failed with status ${answerResponse.status}`,
      );
    }

    const answerSdp = await answerResponse.text();
    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: answerSdp,
    });
    await waitForDataChannelOpen(dataChannel);
  }

  async function syncVoiceInstructions(options: { force?: boolean } = {}) {
    const instructionsResponse = await getCurrentVoiceInstructions();

    if (
      !options.force &&
      instructionsResponse.patient_state_updated_at ===
        lastInstructionStateUpdatedAtRef.current
    ) {
      return;
    }

    const updateWasSent = sendSessionUpdate(instructionsResponse);

    if (updateWasSent) {
      lastInstructionStateUpdatedAtRef.current =
        instructionsResponse.patient_state_updated_at;
      setLastInstructionSyncAt(new Date().toLocaleTimeString());
    }
  }

  function sendSessionUpdate(
    instructionsResponse: VoiceInstructionsResponse,
  ): boolean {
    return sendRealtimeEvent({
      type: "session.update",
      session: {
        instructions: instructionsResponse.instructions,
      },
    });
  }

  function sendRealtimeEvent(event: unknown): boolean {
    const dataChannel = dataChannelRef.current;

    if (!dataChannel || dataChannel.readyState !== "open") {
      return false;
    }

    dataChannel.send(JSON.stringify(event));

    return true;
  }

  function waitForDataChannelOpen(dataChannel: RTCDataChannel): Promise<void> {
    if (dataChannel.readyState === "open") {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error("Realtime data channel did not open."));
      }, 5000);

      dataChannel.onopen = () => {
        window.clearTimeout(timeoutId);
        resolve();
      };

      dataChannel.onerror = () => {
        window.clearTimeout(timeoutId);
        reject(new Error("Realtime data channel failed."));
      };
    });
  }

  async function handleRealtimeDataChannelMessage(messageEvent: MessageEvent) {
    const event = parseRealtimeTranscriptEvent(messageEvent.data);

    if (!event) {
      return;
    }

    const speaker = getTranscriptSpeaker(event.type);
    const text = event.transcript ?? event.text;

    if (!speaker || !text?.trim()) {
      return;
    }

    try {
      const savedMessage = await saveVoiceTranscriptMessage({
        speaker,
        text: text.trim(),
        realtime_event_type: event.type ?? null,
      });

      setVoiceTranscriptMessages((messages) => [...messages, savedMessage]);
    } catch {
      setErrorMessage("Voice transcript could not be saved.");
    }
  }

  async function recordVoiceTimelineEvent(
    eventType: "voice_connected" | "voice_disconnected" | "voice_muted" | "voice_unmuted",
    label: string,
    realtimeSessionId = voiceSession?.session_id ?? null,
  ) {
    try {
      await saveVoiceTimelineEvent({
        event_type: eventType,
        label,
        realtime_session_id: realtimeSessionId,
      });
    } catch {
      setErrorMessage("Voice event could not be saved.");
    }
  }

  const canConnect =
    status !== "connecting" &&
    status !== "requesting_microphone" &&
    status !== "ready";
  const canDisconnect = status === "ready";
  const canUseSafetyControls = status === "ready";
  const aiIsPaused = Boolean(patientState?.safety.ai_paused);
  const takeoverIsActive = Boolean(patientState?.safety.instructor_takeover);
  const statusLabel = formatStatus(status);
  const isInstructorActionRunning = activeInstructorAction !== null;

  return (
    <main className="app-shell voice-shell">
      <section className="voice-page" aria-labelledby="voice-title">
        <nav className="voice-nav" aria-label="Voice room navigation">
          <div className="voice-nav-heading">
            <p className="eyebrow">Student voice room</p>
            <h1 id="voice-title">AI Patient Voice</h1>
            <p className="lede">
              Sim-room interface for speaking with the COPD/SOB AI patient.
            </p>
          </div>
          <div className="voice-nav-actions">
            <a className="header-link" href="/">
              Instructor dashboard
            </a>
            <span className={`voice-status voice-status-${status}`}>
              {statusLabel}
            </span>
          </div>
        </nav>

        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        <div className="voice-grid">
          <section className="dashboard-card voice-state-card" aria-labelledby="voice-state-title">
            <h2 id="voice-state-title">Current Patient State</h2>
            {patientState ? (
              <div className="voice-state-grid">
                <StateMetric
                  label="Status"
                  tone="status"
                  value={patientState.status}
                />
                <StateMetric
                  label="Stage"
                  tone="status"
                  value={patientState.stage}
                />
                <StateMetric
                  emphasized
                  label="HR"
                  tone="vital"
                  value={`${patientState.vitals.heart_rate} bpm`}
                />
                <StateMetric
                  emphasized
                  label="SpO2"
                  tone="vital"
                  value={`${patientState.vitals.spo2}%`}
                />
                <StateMetric
                  emphasized
                  label="RR"
                  tone="vital"
                  value={`${patientState.vitals.respiratory_rate}/min`}
                />
                <StateMetric
                  label="BP"
                  tone="vital"
                  value={patientState.vitals.blood_pressure}
                />
                <StateMetric
                  emphasized
                  label="Breathing effort"
                  tone="symptom"
                  value={patientState.symptoms.breathing_effort}
                />
                <StateMetric
                  label="Chest tightness"
                  tone="symptom"
                  value={patientState.symptoms.chest_tightness}
                />
                <StateMetric
                  label="Anxiety"
                  tone="emotion"
                  value={patientState.emotion.anxiety}
                />
                <StateMetric
                  label="Fatigue"
                  tone="emotion"
                  value={patientState.emotion.fatigue}
                />
                <StateMetric
                  label="Speech"
                  tone="voice"
                  value={patientState.voice_behavior.speech_pattern}
                />
                <StateMetric
                  label="Tone"
                  tone="voice"
                  value={patientState.voice_behavior.tone}
                />
                <StateMetric
                  label="Oxygen"
                  tone="intervention"
                  value={formatBoolean(patientState.interventions.oxygen_applied)}
                />
                <StateMetric
                  label="Bronchodilator"
                  tone="intervention"
                  value={formatBoolean(patientState.interventions.bronchodilator_given)}
                />
              </div>
            ) : (
              <p className="dashboard-note">Patient state has not loaded yet.</p>
            )}
          </section>

          <section className="dashboard-card voice-instructor-card" aria-labelledby="voice-instructor-title">
            <h2 id="voice-instructor-title">Instructor Controls</h2>
            <button
              className="control-button control-button-secondary"
              disabled={isInstructorActionRunning}
              onClick={handleResetState}
              type="button"
            >
              {activeInstructorAction === "reset" ? "Resetting..." : "Reset patient state"}
            </button>
            <div className="cue-grid">
              {cueButtons.map((cue) => (
                <button
                  className="control-button"
                  disabled={isInstructorActionRunning}
                  key={cue.cueId}
                  onClick={() => handleCueClick(cue.cueId)}
                  type="button"
                >
                  {activeInstructorAction === cue.cueId ? "Updating..." : cue.label}
                </button>
              ))}
            </div>
            {activeInstructorAction ? (
              <p className="dashboard-note">Updating patient state...</p>
            ) : null}
            <div className="voice-instructor-chat" aria-labelledby="voice-chat-title">
              <h3 id="voice-chat-title">Patient Conversation</h3>
              <Chat
                embedded
                onMessageSent={refreshTextConversation}
                persistedMessages={textConversationMessages}
                statusLabel="Persisted"
              />
            </div>
          </section>

          <section className="dashboard-card voice-control-card" aria-labelledby="voice-controls-title">
            <h2 id="voice-controls-title">Voice Controls</h2>
            <div className="voice-control-grid">
              <button
                className="control-button"
                disabled={!canConnect}
                onClick={handleConnectVoice}
                type="button"
              >
                {status === "connecting" || status === "requesting_microphone"
                  ? "Connecting..."
                  : "Connect voice"}
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
                onClick={handleToggleMute}
                type="button"
              >
                {isMuted ? "Unmute mic" : "Mute mic"}
              </button>
              <button
                className="control-button"
                disabled={status === "connecting" || status === "requesting_microphone"}
                onClick={() => refreshPatientState({ syncVoiceInstructions: true })}
                type="button"
              >
                Refresh state
              </button>
              <button
                className="control-button"
                disabled={!canUseSafetyControls || aiIsPaused}
                onClick={handlePauseAi}
                type="button"
              >
                Pause AI
              </button>
              <button
                className="control-button"
                disabled={!canUseSafetyControls || !aiIsPaused || takeoverIsActive}
                onClick={handleResumeAi}
                type="button"
              >
                Resume AI
              </button>
              <button
                className="control-button"
                disabled={!canUseSafetyControls || takeoverIsActive}
                onClick={handleStartTakeover}
                type="button"
              >
                Start takeover
              </button>
              <button
                className="control-button"
                disabled={!canUseSafetyControls || !takeoverIsActive}
                onClick={handleEndTakeover}
                type="button"
              >
                End takeover
              </button>
            </div>

            <dl className="voice-session-grid">
              <VoiceDetail label="Connection" value={statusLabel} />
              <VoiceDetail label="Microphone" value={isMuted ? "Muted" : "Ready"} />
              <VoiceDetail
                label="State sync"
                value={lastInstructionSyncAt ?? "Waiting"}
              />
              <VoiceDetail
                label="AI paused"
                value={patientState ? formatBoolean(patientState.safety.ai_paused) : "Unknown"}
              />
              <VoiceDetail
                label="Takeover"
                value={
                  patientState
                    ? formatBoolean(patientState.safety.instructor_takeover)
                    : "Unknown"
                }
              />
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
              Use the room microphone for student speech and the room speaker for
              patient voice playback.
            </p>
            <audio
              ref={remoteAudioRef}
              autoPlay
              className="voice-remote-audio"
            />
          </section>

          <section className="dashboard-card voice-transcript-card" aria-labelledby="voice-transcript-title">
            <h2 id="voice-transcript-title">Voice Transcript</h2>
            {voiceTranscriptMessages.length > 0 ? (
              <ol className="event-list">
                {voiceTranscriptMessages.map((message) => (
                  <li key={message.message_id}>
                    <strong>{formatLabel(message.speaker)}:</strong> {message.text}
                    <span className="report-entry-meta">
                      Source: {formatLabel(message.source)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <ol className="event-list">
                <li>
                  <strong>Waiting for voice transcript</strong>
                  <span className="report-entry-meta">
                    Transcript messages will appear here when Realtime transcript
                    events are received.
                  </span>
                </li>
              </ol>
            )}
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


function StateMetric({
  emphasized = false,
  label,
  tone = "default",
  value,
}: {
  emphasized?: boolean;
  label: string;
  tone?: "default" | "emotion" | "intervention" | "status" | "symptom" | "vital" | "voice";
  value: string;
}) {
  return (
    <div
      className={`voice-state-item voice-state-item-${tone}${
        emphasized ? " voice-state-item-emphasized" : ""
      }`}
    >
      <span className="voice-state-label">{label}</span>
      <span className="voice-state-value">{value}</span>
    </div>
  );
}


function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}


function formatStatus(status: VoiceConnectionStatus): string {
  const labels: Record<VoiceConnectionStatus, string> = {
    idle: "Not connected",
    loading_state: "Loading state",
    requesting_microphone: "Requesting microphone",
    connecting: "Connecting",
    ready: "Ready",
    disconnected: "Disconnected",
    error: "Needs attention",
  };

  return labels[status];
}


function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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


function parseRealtimeTranscriptEvent(data: unknown): RealtimeTranscriptEvent | null {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsedData = JSON.parse(data) as RealtimeTranscriptEvent;
    return parsedData;
  } catch {
    return null;
  }
}


function getTranscriptSpeaker(
  eventType: string | undefined,
): "student" | "patient" | null {
  if (!eventType) {
    return null;
  }

  if (
    eventType === "conversation.item.input_audio_transcription.completed" ||
    eventType === "input_audio_transcription.completed"
  ) {
    return "student";
  }

  if (
    eventType === "response.audio_transcript.done" ||
    eventType === "response.output_audio_transcript.done"
  ) {
    return "patient";
  }

  return null;
}


function buildVoiceConnectionErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone permission was blocked. Allow microphone access and try again.";
  }

  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found. Connect a microphone and try again.";
  }

  return "Voice session failed to start. Check backend voice setup, API key configuration, and microphone permissions.";
}
