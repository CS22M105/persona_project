import { API_BASE_URL } from "./client";
import {
  TimelineEventResponse,
  TimelineEventType,
  TranscriptMessageResponse,
} from "./sessions";

export type RealtimeSessionResponse = {
  client_secret: string;
  expires_at: number;
  session_id: string | null;
  model: string;
  voice: string;
  scenario_id: string;
  connect_url: string;
};

export type VoiceInstructionsResponse = {
  instructions: string;
  scenario_id: string;
  patient_state_updated_at: string;
  recent_cue_count: number;
};

export type VoiceTranscriptCreateRequest = {
  speaker: "student" | "patient";
  text: string;
  realtime_event_type: string | null;
};

export type VoiceTimelineEventCreateRequest = {
  event_type: TimelineEventType;
  label: string;
  realtime_session_id: string | null;
  metadata_json?: Record<string, string | number | boolean | null>;
};

export async function createRealtimeVoiceSession(): Promise<RealtimeSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/voice/realtime-session`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Realtime voice session request failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function getCurrentVoiceInstructions(): Promise<VoiceInstructionsResponse> {
  const response = await fetch(`${API_BASE_URL}/voice/instructions`);

  if (!response.ok) {
    throw new Error(
      `Voice instructions request failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function saveVoiceTranscriptMessage(
  request: VoiceTranscriptCreateRequest,
): Promise<TranscriptMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/voice/transcript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(
      `Voice transcript save failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function saveVoiceTimelineEvent(
  request: VoiceTimelineEventCreateRequest,
): Promise<TimelineEventResponse> {
  const response = await fetch(`${API_BASE_URL}/voice/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Voice event save failed with status ${response.status}`);
  }

  return response.json();
}
