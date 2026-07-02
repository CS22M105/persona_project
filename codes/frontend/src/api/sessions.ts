import { API_BASE_URL } from "./client";

export type PersistedSessionStatus = "active" | "paused" | "takeover" | "ended";

export type SessionResponse = {
  session_id: string;
  scenario_id: string;
  status: PersistedSessionStatus;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CurrentSessionResponse = {
  session: SessionResponse | null;
};

export type TranscriptSpeaker = "student" | "patient" | "system" | "instructor";

export type TranscriptMessageType =
  | "student_question"
  | "patient_reply"
  | "auto_patient_reaction"
  | "system_note";

export type TranscriptSource = "manual" | "openai" | "mock_fallback" | "system";

export type TranscriptMessageResponse = {
  message_id: string;
  session_id: string;
  timestamp: string;
  speaker: TranscriptSpeaker;
  message_type: TranscriptMessageType;
  text: string;
  source: TranscriptSource;
  cue_id: string | null;
  state_event_id: string | null;
};

export type TranscriptResponse = {
  session_id: string;
  messages: TranscriptMessageResponse[];
};

export type TimelineEventType =
  | "session_started"
  | "student_message"
  | "patient_response"
  | "instructor_cue"
  | "auto_patient_response"
  | "pause"
  | "resume"
  | "takeover_started"
  | "takeover_ended"
  | "intervention"
  | "session_ended";

export type TimelineEventResponse = {
  event_id: string;
  session_id: string;
  timestamp: string;
  event_type: TimelineEventType;
  label: string | null;
  cue_id: string | null;
  state_snapshot_json: Record<string, unknown> | null;
  metadata_json: Record<string, unknown> | null;
};

export type TimelineResponse = {
  session_id: string;
  events: TimelineEventResponse[];
};

export async function startSession(
  scenarioId = "copd-sob",
): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scenario_id: scenarioId }),
  });

  if (!response.ok) {
    throw new Error(`Session start failed with status ${response.status}`);
  }

  return response.json();
}

export async function getCurrentSession(): Promise<CurrentSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/current`);

  if (!response.ok) {
    throw new Error(`Current session request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getSessionTranscript(
  sessionId: string,
): Promise<TranscriptResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/transcript`);

  if (!response.ok) {
    throw new Error(`Transcript request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getSessionEvents(
  sessionId: string,
): Promise<TimelineResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/events`);

  if (!response.ok) {
    throw new Error(`Session events request failed with status ${response.status}`);
  }

  return response.json();
}
