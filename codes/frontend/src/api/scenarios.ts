import { API_BASE_URL } from "./client";

export type PersonaSettings = {
  scenario_id: string;
  patient_name: string;
  age: number;
  gender: PatientGender;
  voice: PatientVoice;
  voice_style: string;
};

export type PatientGender = "female" | "male";
export type PatientVoice =
  | "marin"
  | "cedar"
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "sage"
  | "shimmer"
  | "verse";

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

export async function updateCopdSobPersonaGender(
  gender: PatientGender,
): Promise<PersonaSettings> {
  const response = await fetch(`${API_BASE_URL}/scenarios/copd-sob/persona-settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gender }),
  });

  if (!response.ok) {
    throw new Error(`Persona gender update failed with status ${response.status}`);
  }

  return response.json();
}

export async function updateCopdSobPersonaVoice(
  voice: PatientVoice,
): Promise<PersonaSettings> {
  const response = await fetch(`${API_BASE_URL}/scenarios/copd-sob/persona-settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ voice }),
  });

  if (!response.ok) {
    throw new Error(`Persona voice update failed with status ${response.status}`);
  }

  return response.json();
}

export async function updateCopdSobPersonaVoiceAffect(
  voiceAffect: string,
): Promise<PersonaSettings> {
  const response = await fetch(`${API_BASE_URL}/scenarios/copd-sob/persona-settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ voice_style: voiceAffect }),
  });

  if (!response.ok) {
    throw new Error(`Persona voice affect update failed with status ${response.status}`);
  }

  return response.json();
}
