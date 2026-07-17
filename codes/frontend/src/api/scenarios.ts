import { API_BASE_URL } from "./client";

export type PersonaSettings = {
  scenario_id: string;
  patient_name: string;
  age: number;
};

export async function getCopdSobPersonaSettings(): Promise<PersonaSettings> {
  const response = await fetch(`${API_BASE_URL}/scenarios/copd-sob/persona-settings`);

  if (!response.ok) {
    throw new Error(`Persona settings request failed with status ${response.status}`);
  }

  return response.json();
}

export async function updateCopdSobPersonaAge(age: number): Promise<PersonaSettings> {
  const response = await fetch(`${API_BASE_URL}/scenarios/copd-sob/persona-settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ age }),
  });

  if (!response.ok) {
    throw new Error(`Persona age update failed with status ${response.status}`);
  }

  return response.json();
}
