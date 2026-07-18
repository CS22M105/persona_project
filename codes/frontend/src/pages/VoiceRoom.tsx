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

type AudioDeviceOption = {
  deviceId: string;
  label: string;
};

type AudioDeviceType = "built_in" | "external";

type AudioContextWithSink = AudioContext & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

type AudioElementWithSink = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

type ControlIconName =
  | "activity"
  | "air"
  | "anxiety"
  | "chest"
  | "fatigue"
  | "heart"
  | "mic"
  | "micOff"
  | "oxygen"
  | "pause"
  | "play"
  | "plug"
  | "plugOff"
  | "pressure"
  | "refresh"
  | "reset"
  | "shield"
  | "speech"
  | "stage"
  | "status"
  | "therapy"
  | "tone"
  | "trendUp";

const cueButtons: {
  cueId: string;
  icon: ControlIconName;
  label: string;
  stateUpdates: Record<string, unknown>;
}[] = [
  {
    cueId: "spo2_dropped",
    label: "SpO2 dropped",
    icon: "oxygen",
    stateUpdates: {
      vitals: { spo2: 88 },
      symptoms: { breathing_effort: "severe" },
      emotion: { anxiety: "high" },
      voice_behavior: {
        speech_pattern: "very short phrases",
        tone: "more anxious and breathless",
      },
    },
  },
  {
    cueId: "hr_increased",
    label: "HR increased",
    icon: "heart",
    stateUpdates: {
      vitals: { heart_rate: 128 },
      emotion: { anxiety: "high" },
    },
  },
  {
    cueId: "breathing_worsened",
    label: "Breathing worsened",
    icon: "air",
    stateUpdates: {
      stage: "worsening",
      symptoms: {
        breathing_effort: "severe",
        chest_tightness: "moderate",
      },
      voice_behavior: {
        speech_pattern: "very short phrases",
        tone: "fearful and breathless",
      },
    },
  },
  {
    cueId: "oxygen_applied",
    label: "Oxygen applied",
    icon: "activity",
    stateUpdates: {
      interventions: { oxygen_applied: true },
    },
  },
  {
    cueId: "bronchodilator_given",
    label: "Bronchodilator given",
    icon: "therapy",
    stateUpdates: {
      interventions: { bronchodilator_given: true },
    },
  },
  {
    cueId: "patient_improving",
    label: "Patient improving",
    icon: "trendUp",
    stateUpdates: {
      stage: "partial_improvement",
      vitals: {
        heart_rate: 104,
        spo2: 93,
        respiratory_rate: 22,
      },
      symptoms: { breathing_effort: "mild" },
      emotion: { anxiety: "mild" },
      voice_behavior: {
        speech_pattern: "short but more comfortable phrases",
        tone: "calmer",
      },
    },
  },
];

const allStateMetricKeys = [
  "status",
  "stage",
  "heart_rate",
  "spo2",
  "respiratory_rate",
  "blood_pressure",
  "breathing_effort",
  "chest_tightness",
  "anxiety",
  "fatigue",
  "speech_pattern",
  "tone",
  "oxygen_applied",
  "bronchodilator_given",
];


export function VoiceRoom() {
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const [voiceSession, setVoiceSession] = useState<PublicRealtimeSession | null>(null);
  const [status, setStatus] = useState<VoiceConnectionStatus>("loading_state");
  const [isMuted, setIsMuted] = useState(false);
  const [activeInstructorAction, setActiveInstructorAction] = useState<string | null>(
    null,
  );
  const [highlightedStateKeys, setHighlightedStateKeys] = useState<string[]>([]);
  const [lastInstructionSyncAt, setLastInstructionSyncAt] = useState<string | null>(null);
  const [textConversationMessages, setTextConversationMessages] = useState<
    ChatMessage[]
  >([]);
  const [audioInputDevices, setAudioInputDevices] = useState<AudioDeviceOption[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedMicrophoneType, setSelectedMicrophoneType] =
    useState<AudioDeviceType>("built_in");
  const [selectedSpeakerType, setSelectedSpeakerType] =
    useState<AudioDeviceType>("built_in");
  const [audioSetupMessage, setAudioSetupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastInstructionStateUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    refreshPatientState();
    refreshTextConversation();
    loadAudioDevices();

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

  useEffect(() => {
    if (status === "ready") {
      applySelectedSpeaker();
    }
  }, [audioOutputDevices, selectedSpeakerType, status]);

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
      const microphoneDeviceId = resolveSelectedAudioDeviceId(
        audioInputDevices,
        selectedMicrophoneType,
      );

      if (selectedMicrophoneType === "external" && !microphoneDeviceId) {
        setAudioSetupMessage(
          "Pair or connect an external microphone to this laptop first.",
        );
        throw new Error("External microphone is not available.");
      }

      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(microphoneDeviceId
            ? { deviceId: { exact: microphoneDeviceId } }
            : {}),
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStatus("connecting");
      await connectRealtimeWebRtc(sessionResponse, microphoneStream, remoteAudioRef);
      await loadAudioDevices();
      await applySelectedSpeaker();
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

  async function loadAudioDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setAudioSetupMessage("Audio device selection is not supported in this browser.");
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }));
      const speakers = devices
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${index + 1}`,
        }));

      setAudioInputDevices(microphones);
      setAudioOutputDevices(speakers);
    } catch {
      setAudioSetupMessage("Audio devices could not be loaded.");
    }
  }

  async function handleTestMicrophone() {
    setAudioSetupMessage("");

    try {
      const microphoneDeviceId = resolveSelectedAudioDeviceId(
        audioInputDevices,
        selectedMicrophoneType,
      );

      if (selectedMicrophoneType === "external" && !microphoneDeviceId) {
        setAudioSetupMessage(
          "Pair or connect an external microphone to this laptop first.",
        );
        return;
      }

      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: microphoneDeviceId
          ? { deviceId: { exact: microphoneDeviceId } }
          : true,
      });
      testStream.getTracks().forEach((track) => track.stop());
      await loadAudioDevices();
      setAudioSetupMessage("Microphone test passed.");
    } catch {
      setAudioSetupMessage("Microphone test failed. Check browser permission.");
    }
  }

  async function handleTestSpeaker() {
    setAudioSetupMessage("");

    try {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextConstructor) {
        setAudioSetupMessage("Speaker test is not supported in this browser.");
        return;
      }

      const audioContext = new AudioContextConstructor() as AudioContextWithSink;
      const speakerDeviceId = resolveSelectedAudioDeviceId(
        audioOutputDevices,
        selectedSpeakerType,
      );

      if (selectedSpeakerType === "external" && !speakerDeviceId) {
        setAudioSetupMessage(
          "Pair or connect an external speaker to this laptop first.",
        );
        await audioContext.close();
        return;
      }

      if (speakerDeviceId && audioContext.setSinkId) {
        await audioContext.setSinkId(speakerDeviceId);
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = 660;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      window.setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 260);
      setAudioSetupMessage("Speaker test played.");
    } catch {
      setAudioSetupMessage("Speaker test failed in this browser.");
    }
  }

  async function applySelectedSpeaker() {
    const remoteAudio = remoteAudioRef.current as AudioElementWithSink | null;
    const speakerDeviceId = resolveSelectedAudioDeviceId(
      audioOutputDevices,
      selectedSpeakerType,
    );

    if (selectedSpeakerType === "external" && !speakerDeviceId) {
      setAudioSetupMessage("Pair or connect an external speaker to this laptop first.");
      return;
    }

    if (!remoteAudio || !speakerDeviceId || !remoteAudio.setSinkId) {
      return;
    }

    try {
      await remoteAudio.setSinkId(speakerDeviceId);
    } catch {
      setAudioSetupMessage("Speaker selection could not be applied.");
    }
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
    showChangedStateHighlights(allStateMetricKeys);

    try {
      const response = await resetPatientState();
      setPatientState(response.state);
      setTextConversationMessages([]);
      await syncVoiceInstructions({ force: true });
      await refreshTextConversation();
    } catch {
      setErrorMessage("Patient state failed to reset. Make sure the backend is running.");
    } finally {
      setActiveInstructorAction(null);
    }
  }

  async function handleCueClick(cueId: string) {
    const cue = cueButtons.find((button) => button.cueId === cueId);

    setActiveInstructorAction(cueId);
    setErrorMessage("");
    showChangedStateHighlights(cue ? getChangedStateKeys(cue.stateUpdates) : []);
    setPatientState((currentState) =>
      currentState && cue
        ? applyOptimisticStateUpdates(currentState, cue.stateUpdates)
        : currentState,
    );

    try {
      const response = await applyInstructorCue(cueId);
      setPatientState(response.state);
      await syncVoiceInstructions({ force: true });
      appendAutoPatientMessage(response.auto_patient_message);
      triggerRealtimeCueReaction(
        cue?.label ?? "Patient condition changed",
        response.auto_patient_message?.text ?? null,
        response.state,
      );
    } catch {
      await refreshPatientState({ syncVoiceInstructions: true });
      setErrorMessage("Instructor cue failed. Make sure the backend is running.");
    } finally {
      setActiveInstructorAction(null);
    }
  }

  function showChangedStateHighlights(stateKeys: string[]) {
    setHighlightedStateKeys([]);
    window.requestAnimationFrame(() => {
      setHighlightedStateKeys(stateKeys);
    });
  }

  function appendAutoPatientMessage(
    autoPatientMessage: { message_id: string; text: string } | null,
  ) {
    if (!autoPatientMessage) {
      return;
    }

    setTextConversationMessages((messages) => {
      const messageAlreadyExists = messages.some(
        (message) => message.id === autoPatientMessage.message_id,
      );

      if (messageAlreadyExists) {
        return messages;
      }

      return [
        ...messages,
        {
          id: autoPatientMessage.message_id,
          speaker: "patient",
          text: autoPatientMessage.text,
        },
      ];
    });
  }

  function triggerRealtimeCueReaction(
    cueLabel: string,
    patientUtterance: string | null,
    updatedState: PatientState,
  ) {
    if (status !== "ready") {
      return;
    }

    if (updatedState.safety.ai_paused || updatedState.safety.instructor_takeover) {
      return;
    }

    cancelCurrentRealtimeResponse();
    sendRealtimeEvent({
      type: "response.create",
      response: {
        modalities: ["audio"],
        instructions: buildCueReactionInstructions(cueLabel, patientUtterance),
      },
    });
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
      await saveVoiceTranscriptMessage({
        speaker,
        text: text.trim(),
        realtime_event_type: event.type ?? null,
      });
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

  return (
    <main className="app-shell voice-shell">
      <section className="voice-page" aria-labelledby="voice-title">
        <nav className="voice-nav" aria-label="Voice room navigation">
          <div className="voice-nav-brand">
            <p className="eyebrow">Student voice room</p>
            <h1 id="voice-title">AI Patient Voice: COPD/SOB</h1>
            <p>Sim-room interface for speaking</p>
          </div>
          <div className="voice-nav-actions">
            <a className="header-link" href="/personas/copd-sob">
              Persona page
            </a>
            <a className="header-link" href="/">
              Dashboard
            </a>
            <a className="header-link" href="/transcripts">
              Transcripts
            </a>
            <span className={`voice-status voice-status-${status}`}>
              {statusLabel}
            </span>
          </div>
        </nav>

        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        <div className="voice-grid">
          <section
            className="dashboard-card voice-state-card"
            id="voice-state-section"
            aria-labelledby="voice-state-title"
          >
            <h2 id="voice-state-title">Current Patient State</h2>
            {patientState ? (
              <div className="voice-state-grid">
                <StateMetric
                  highlighted={highlightedStateKeys.includes("status")}
                  icon="status"
                  label="Status"
                  tone="status"
                  value={patientState.status}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("stage")}
                  icon="stage"
                  label="Stage"
                  tone="status"
                  value={patientState.stage}
                />
                <StateMetric
                  emphasized
                  highlighted={highlightedStateKeys.includes("heart_rate")}
                  icon="heart"
                  label="HR"
                  tone="vital"
                  value={`${patientState.vitals.heart_rate} bpm`}
                />
                <StateMetric
                  emphasized
                  highlighted={highlightedStateKeys.includes("spo2")}
                  icon="oxygen"
                  label="SpO2"
                  tone="vital"
                  value={`${patientState.vitals.spo2}%`}
                />
                <StateMetric
                  emphasized
                  highlighted={highlightedStateKeys.includes("respiratory_rate")}
                  icon="air"
                  label="RR"
                  tone="vital"
                  value={`${patientState.vitals.respiratory_rate}/min`}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("blood_pressure")}
                  icon="pressure"
                  label="BP"
                  tone="vital"
                  value={patientState.vitals.blood_pressure}
                />
                <StateMetric
                  emphasized
                  highlighted={highlightedStateKeys.includes("breathing_effort")}
                  icon="air"
                  label="Breathing effort"
                  tone="symptom"
                  value={patientState.symptoms.breathing_effort}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("chest_tightness")}
                  icon="chest"
                  label="Chest tightness"
                  tone="symptom"
                  value={patientState.symptoms.chest_tightness}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("anxiety")}
                  icon="anxiety"
                  label="Anxiety"
                  tone="emotion"
                  value={patientState.emotion.anxiety}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("fatigue")}
                  icon="fatigue"
                  label="Fatigue"
                  tone="emotion"
                  value={patientState.emotion.fatigue}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("speech_pattern")}
                  icon="speech"
                  label="Speech"
                  tone="voice"
                  value={patientState.voice_behavior.speech_pattern}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("tone")}
                  icon="tone"
                  label="Tone"
                  tone="voice"
                  value={patientState.voice_behavior.tone}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("oxygen_applied")}
                  icon="oxygen"
                  label="Oxygen"
                  tone="intervention"
                  value={formatBoolean(patientState.interventions.oxygen_applied)}
                />
                <StateMetric
                  highlighted={highlightedStateKeys.includes("bronchodilator_given")}
                  icon="therapy"
                  label="Bronchodilator"
                  tone="intervention"
                  value={formatBoolean(patientState.interventions.bronchodilator_given)}
                />
              </div>
            ) : (
              <p className="dashboard-note">Patient state has not loaded yet.</p>
            )}
          </section>

          <section
            className="dashboard-card voice-instructor-card"
            id="voice-instructor-section"
            aria-labelledby="voice-instructor-title"
          >
            <div className="control-panel-heading">
              <div>
                <h2 id="voice-instructor-title">Patient State Controls</h2>
              </div>
              <button
                className="heading-reset-button"
                disabled={activeInstructorAction === "reset"}
                onClick={handleResetState}
                type="button"
              >
                <span className="heading-reset-icon" aria-hidden="true">
                  <ControlIcon name="reset" />
                </span>
                <span>Reset patient state</span>
                {activeInstructorAction === "reset" ? (
                  <span className="button-spinner" aria-hidden="true" />
                ) : null}
              </button>
            </div>
            <div className="instructor-control-grid">
              {cueButtons.map((cue) => (
                <ControlTile
                  disabled={activeInstructorAction === cue.cueId}
                  isLoading={activeInstructorAction === cue.cueId}
                  key={cue.cueId}
                  label={cue.label}
                  onClick={() => handleCueClick(cue.cueId)}
                  icon={cue.icon}
                />
              ))}
            </div>
            <div className="voice-session-status-block">
              <h3>Voice Session Status</h3>
              <p className="voice-session-guidance">
                Use the room microphone for student speech and the room speaker for
                patient voice playback.
              </p>
              <dl className="voice-session-grid">
                <VoiceDetail label="Connection" value={statusLabel} />
                <VoiceDetail label="Microphone" value={isMuted ? "Muted" : "Ready"} />
                <VoiceDetail
                  label="State sync"
                  value={lastInstructionSyncAt ?? "Waiting"}
                />
                <VoiceDetail
                  label="AI paused"
                  value={
                    patientState
                      ? formatBoolean(patientState.safety.ai_paused)
                      : "Unknown"
                  }
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
                <VoiceDetail label="Voice" value={voiceSession?.voice ?? "Not connected"} />
                <VoiceDetail
                  label="Session"
                  value={voiceSession?.session_id ?? "Not connected"}
                />
              </dl>
            </div>
          </section>

          <section
            className="dashboard-card voice-chat-card"
            id="voice-chat-section"
            aria-labelledby="voice-chat-title"
          >
            <h2 id="voice-chat-title">Patient Conversation</h2>
            <div className="voice-instructor-chat">
              <Chat
                embedded
                onMessageSent={refreshTextConversation}
                persistedMessages={textConversationMessages}
                statusLabel="Persisted"
              />
            </div>
          </section>

          <section
            className="dashboard-card voice-control-card"
            id="voice-controls-section"
            aria-labelledby="voice-controls-title"
          >
            <div className="control-panel-heading">
              <div>
                <h2 id="voice-controls-title">Voice Controls</h2>
              </div>
            </div>
            <div className="audio-setup-panel" aria-label="Audio setup">
              <label htmlFor="voice-microphone">Microphone</label>
              <div className="audio-device-row">
                <select
                  id="voice-microphone"
                  onChange={(event) =>
                    setSelectedMicrophoneType(event.target.value as AudioDeviceType)
                  }
                  value={selectedMicrophoneType}
                >
                  <option value="built_in">Built-in</option>
                  <option value="external">External Bluetooth / USB</option>
                </select>
                <button onClick={handleTestMicrophone} type="button">
                  Test Mic
                </button>
              </div>

              <label htmlFor="voice-speaker">Speaker</label>
              <div className="audio-device-row">
                <select
                  id="voice-speaker"
                  onChange={(event) =>
                    setSelectedSpeakerType(event.target.value as AudioDeviceType)
                  }
                  value={selectedSpeakerType}
                >
                  <option value="built_in">Built-in</option>
                  <option value="external">External Bluetooth / USB</option>
                </select>
                <button onClick={handleTestSpeaker} type="button">
                  Test Speaker
                </button>
              </div>

              <p className="audio-setup-hint">
                External devices must be paired or connected to this laptop before
                starting the voice session.
              </p>
              {audioSetupMessage ? (
                <p className="audio-setup-message">{audioSetupMessage}</p>
              ) : null}
            </div>
            <div className="voice-control-grid">
              <ControlTile
                disabled={!canConnect}
                icon="plug"
                label={
                  status === "connecting" || status === "requesting_microphone"
                    ? "Connecting"
                    : "Connect"
                }
                onClick={handleConnectVoice}
                tone="success"
              />
              <ControlTile
                disabled={!canDisconnect}
                icon="plugOff"
                label="Disconnect"
                onClick={handleDisconnectVoice}
                tone="danger"
              />
              <ControlTile
                disabled={!canDisconnect}
                icon={isMuted ? "mic" : "micOff"}
                label={isMuted ? "Unmute" : "Mute"}
                onClick={handleToggleMute}
              />
              <ControlTile
                disabled={status === "connecting" || status === "requesting_microphone"}
                icon="refresh"
                label="Refresh"
                onClick={() => refreshPatientState({ syncVoiceInstructions: true })}
              />
              <ControlTile
                disabled={!canUseSafetyControls || aiIsPaused}
                icon="pause"
                label="Pause AI"
                onClick={handlePauseAi}
                tone="warning"
              />
              <ControlTile
                disabled={!canUseSafetyControls || !aiIsPaused || takeoverIsActive}
                icon="play"
                label="Resume AI"
                onClick={handleResumeAi}
                tone="success"
              />
              <ControlTile
                disabled={!canUseSafetyControls || takeoverIsActive}
                icon="shield"
                label="Takeover"
                onClick={handleStartTakeover}
                tone="warning"
              />
              <ControlTile
                disabled={!canUseSafetyControls || !takeoverIsActive}
                icon="reset"
                label="Release"
                onClick={handleEndTakeover}
              />
            </div>

            <audio
              ref={remoteAudioRef}
              autoPlay
              className="voice-remote-audio"
            />
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


function ControlTile({
  disabled,
  icon,
  isLoading = false,
  label,
  onClick,
  symbol = "",
  tone = "default",
}: {
  disabled: boolean;
  icon?: ControlIconName;
  isLoading?: boolean;
  label: string;
  onClick: () => void;
  symbol?: string;
  tone?: "default" | "danger" | "secondary" | "success" | "warning";
}) {
  return (
    <button
      className={`control-tile control-tile-${tone}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="control-tile-symbol" aria-hidden="true">
        {icon ? <ControlIcon name={icon} /> : symbol}
      </span>
      <span className="control-tile-label">{label}</span>
      {isLoading ? <span className="button-spinner" aria-hidden="true" /> : null}
    </button>
  );
}


function ControlIcon({ name }: { name: ControlIconName }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (name === "reset") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M4 7v5h5" />
        <path d="M5.7 16.4A7 7 0 1 0 6 7.8L4 12" />
      </svg>
    );
  }

  if (name === "oxygen") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <circle cx="9" cy="12" r="4" />
        <path d="M16 9h4l-4 6h4" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z" />
      </svg>
    );
  }

  if (name === "plug") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M9 7V3" />
        <path d="M15 7V3" />
        <path d="M7 7h10v4a5 5 0 0 1-10 0Z" />
        <path d="M12 16v5" />
      </svg>
    );
  }

  if (name === "plugOff") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M9 7V3" />
        <path d="M15 7V3" />
        <path d="M7 7h10v4a5 5 0 0 1-1.4 3.5" />
        <path d="M12 16v5" />
        <path d="M4 4l16 16" />
      </svg>
    );
  }

  if (name === "mic") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    );
  }

  if (name === "micOff") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M9.5 4.5A3 3 0 0 1 15 6v5" />
        <path d="M9 9v2a3 3 0 0 0 4.4 2.7" />
        <path d="M5 11a7 7 0 0 0 10.4 6.1" />
        <path d="M12 18v3" />
        <path d="M4 4l16 16" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M20 11a8 8 0 0 0-14.7-4" />
        <path d="M5 3v4h4" />
        <path d="M4 13a8 8 0 0 0 14.7 4" />
        <path d="M19 21v-4h-4" />
      </svg>
    );
  }

  if (name === "pause") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M8 5v14" />
        <path d="M16 5v14" />
      </svg>
    );
  }

  if (name === "play") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="m8 5 11 7-11 7Z" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (name === "status") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }

  if (name === "stage") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M4 6h16" />
        <path d="M4 12h10" />
        <path d="M4 18h6" />
      </svg>
    );
  }

  if (name === "pressure") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M5 19a8 8 0 1 1 14 0" />
        <path d="m12 13 4-4" />
        <path d="M12 19v-2" />
      </svg>
    );
  }

  if (name === "chest") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M8 20V9a4 4 0 0 1 8 0v11" />
        <path d="M8 12H5" />
        <path d="M16 12h3" />
        <path d="M12 9v11" />
      </svg>
    );
  }

  if (name === "anxiety") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
        <path d="M9 16c1.5-1 4.5-1 6 0" />
      </svg>
    );
  }

  if (name === "fatigue") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M4 14c2-4 14-4 16 0" />
        <path d="M7 17h10" />
        <path d="M9 7h6" />
      </svg>
    );
  }

  if (name === "speech") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M5 5h14v10H8l-3 3Z" />
        <path d="M8 9h8" />
        <path d="M8 12h5" />
      </svg>
    );
  }

  if (name === "tone") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M4 14v-4" />
        <path d="M8 17V7" />
        <path d="M12 20V4" />
        <path d="M16 17V7" />
        <path d="M20 14v-4" />
      </svg>
    );
  }

  if (name === "air") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M4 8h10a3 3 0 1 0-3-3" />
        <path d="M4 12h15" />
        <path d="M4 16h10a3 3 0 1 1-3 3" />
      </svg>
    );
  }

  if (name === "activity") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M4 12h4l2-6 4 12 2-6h4" />
      </svg>
    );
  }

  if (name === "therapy") {
    return (
      <svg className="control-tile-icon" {...commonProps}>
        <path d="M10 21h4" />
        <path d="M12 17v4" />
        <path d="M8 3h8v8a4 4 0 0 1-8 0Z" />
        <path d="M8 8h8" />
      </svg>
    );
  }

  return (
    <svg className="control-tile-icon" {...commonProps}>
      <path d="M4 17 10 11l4 4 6-8" />
      <path d="M15 7h5v5" />
    </svg>
  );
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
  highlighted = false,
  icon,
  label,
  tone = "default",
  value,
}: {
  emphasized?: boolean;
  highlighted?: boolean;
  icon: ControlIconName;
  label: string;
  tone?: "default" | "emotion" | "intervention" | "status" | "symptom" | "vital" | "voice";
  value: string;
}) {
  return (
    <div
      className={`voice-state-item voice-state-item-${tone}${
        emphasized ? " voice-state-item-emphasized" : ""
      }${highlighted ? " voice-state-item-highlighted" : ""
      }`}
    >
      <span className="voice-state-topline">
        <span className="voice-state-icon" aria-hidden="true">
          <ControlIcon name={icon} />
        </span>
        <span className="voice-state-label">{label}</span>
      </span>
      <span className="voice-state-value">{value}</span>
      {highlighted ? <span className="voice-state-updated-badge">Updated</span> : null}
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


function applyOptimisticStateUpdates(
  patientState: PatientState,
  updates: Record<string, unknown>,
): PatientState {
  return {
    ...deepMergePatientState(patientState, updates),
    last_updated_at: new Date().toISOString(),
  };
}


function deepMergePatientState<T extends Record<string, unknown>>(
  target: T,
  updates: Record<string, unknown>,
): T {
  const merged = { ...target } as Record<string, unknown>;

  Object.entries(updates).forEach(([key, value]) => {
    const currentValue = merged[key];

    if (isPlainObject(currentValue) && isPlainObject(value)) {
      merged[key] = deepMergePatientState(currentValue, value);
      return;
    }

    merged[key] = value;
  });

  return merged as T;
}


function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


function resolveSelectedAudioDeviceId(
  devices: AudioDeviceOption[],
  selectedType: AudioDeviceType,
): string {
  if (devices.length === 0) {
    return "";
  }

  if (selectedType === "external") {
    return devices.find((device) => !isBuiltInAudioDevice(device))?.deviceId ?? "";
  }

  return (
    devices.find(isBuiltInAudioDevice)?.deviceId ??
    devices.find((device) => device.deviceId === "default")?.deviceId ??
    devices[0]?.deviceId ??
    ""
  );
}


function isBuiltInAudioDevice(device: AudioDeviceOption): boolean {
  const label = device.label.toLowerCase();

  return (
    device.deviceId === "default" ||
    label.includes("built-in") ||
    label.includes("builtin") ||
    label.includes("macbook") ||
    label.includes("internal") ||
    label.includes("default")
  );
}


function buildCueReactionInstructions(
  cueLabel: string,
  patientUtterance: string | null,
): string {
  if (patientUtterance?.trim()) {
    return [
      `The simulated patient's condition just changed: ${cueLabel}.`,
      `Speak this patient reaction now, naturally and with the current patient voice: "${patientUtterance.trim()}"`,
      "Do not mention the instructor, dashboard, cue, simulation, AI, or vital-sign numbers.",
    ].join(" ");
  }

  return [
    `The simulated patient's condition just changed: ${cueLabel}.`,
    "React immediately as the patient in one short spoken sentence.",
    "Describe only what you feel in the room.",
    "Do not mention the instructor, dashboard, cue, simulation, AI, or vital-sign numbers.",
  ].join(" ");
}


function getChangedStateKeys(updates: Record<string, unknown>): string[] {
  const changedKeys = new Set<string>();

  Object.entries(updates).forEach(([key, value]) => {
    if (!isPlainObject(value)) {
      changedKeys.add(key);
      return;
    }

    Object.keys(value).forEach((nestedKey) => {
      changedKeys.add(nestedKey);
    });
  });

  return Array.from(changedKeys);
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
