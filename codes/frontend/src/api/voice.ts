import { API_BASE_URL } from "./client";

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
