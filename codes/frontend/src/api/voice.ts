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
