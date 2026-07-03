import { RefObject, useEffect, useRef, useState } from "react";

import { getPatientState, PatientState } from "../api/state";
import { TranscriptMessageResponse } from "../api/sessions";
import {
  createRealtimeVoiceSession,
  getCurrentVoiceInstructions,
  RealtimeSessionResponse,
  saveVoiceTimelineEvent,
  saveVoiceTranscriptMessage,
  VoiceInstructionsResponse,
} from "../api/voice";


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


export function VoiceRoom() {
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const [voiceSession, setVoiceSession] = useState<PublicRealtimeSession | null>(null);
  const [status, setStatus] = useState<VoiceConnectionStatus>("loading_state");
  const [isMuted, setIsMuted] = useState(false);
  const [lastInstructionSyncAt, setLastInstructionSyncAt] = useState<string | null>(null);
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
    const dataChannel = dataChannelRef.current;

    if (!dataChannel || dataChannel.readyState !== "open") {
      return false;
    }

    dataChannel.send(
      JSON.stringify({
        type: "session.update",
        session: {
          instructions: instructionsResponse.instructions,
        },
      }),
    );

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
            </div>

            <dl className="voice-session-grid">
              <VoiceDetail label="Connection" value={statusLabel} />
              <VoiceDetail label="Microphone" value={isMuted ? "Muted" : "Ready"} />
              <VoiceDetail
                label="State sync"
                value={lastInstructionSyncAt ?? "Waiting"}
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
