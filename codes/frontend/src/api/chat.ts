import { API_BASE_URL } from "./client";

export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  reply: string;
  scenario_id: string;
  speaker: "patient";
};

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const requestBody: ChatRequest = { message };

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }

  return response.json();
}
