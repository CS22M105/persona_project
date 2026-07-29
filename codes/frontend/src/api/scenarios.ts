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

export type ScenarioSummary = {
  scenario_id: string;
  scenario_name: string;
  status: string;
  clinical_area: string;
  patient_name: string;
  chief_complaint: string;
  scenario_type: string;
  difficulty: string;
  duration: string;
  summary: string;
  is_available: boolean;
};

export type ScenarioListResponse = {
  scenarios: ScenarioSummary[];
};

export type ScenarioDetail = {
  scenario_id: string;
  scenario_name: string;
  version: string;
  status: string;
  clinical_area: string;
  card_summary?: {
    scenario_type?: string;
    difficulty?: string;
    duration?: string;
    summary?: string;
    is_available?: boolean;
  };
  patient_profile: {
    name?: string;
    age?: number;
    sex?: string;
    gender?: string;
    pronouns?: string;
    background?: string[];
  };
  chief_complaint: string;
  learning_objectives: string[];
  initial_state: {
    stage?: string;
    vitals?: Record<string, string | number>;
    symptoms?: Record<string, string>;
    emotion?: Record<string, string>;
    voice_behavior?: Record<string, string>;
    interventions?: Record<string, boolean>;
  };
  instructor_cues: Array<{
    cue_id: string;
    label: string;
    state_updates?: Record<string, unknown>;
  }>;
};

export async function getScenarios(): Promise<ScenarioListResponse> {
  const response = await fetch(`${API_BASE_URL}/scenarios`);

  if (!response.ok) {
    throw new Error(`Scenario list request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getScenario(scenarioId: string): Promise<ScenarioDetail> {
  const response = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}`);

  if (!response.ok) {
    throw new Error(`Scenario request failed with status ${response.status}`);
  }

  return response.json();
}

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
