import { API_BASE_URL } from "./client";

export type SessionStatus =
  | "not_started"
  | "active"
  | "paused"
  | "takeover"
  | "ended";

export type StateEventType =
  | "state_reset"
  | "instructor_cue"
  | "pause"
  | "resume"
  | "takeover_started"
  | "takeover_ended";

export type Vitals = {
  heart_rate: number;
  spo2: number;
  respiratory_rate: number;
  blood_pressure: string;
};

export type Symptoms = {
  breathing_effort: string;
  chest_tightness: string;
  cough: string;
  dizziness: string;
};

export type Emotion = {
  anxiety: string;
  fatigue: string;
};

export type VoiceBehavior = {
  speech_pattern: string;
  tone: string;
};

export type Interventions = {
  oxygen_applied: boolean;
  bronchodilator_given: boolean;
  provider_notified: boolean;
  patient_repositioned: boolean;
};

export type SafetyControls = {
  ai_paused: boolean;
  instructor_takeover: boolean;
};

export type PatientState = {
  scenario_id: string;
  status: SessionStatus;
  stage: string;
  vitals: Vitals;
  symptoms: Symptoms;
  emotion: Emotion;
  voice_behavior: VoiceBehavior;
  interventions: Interventions;
  safety: SafetyControls;
  last_updated_at: string;
};

export type StateEvent = {
  event_id: string;
  event_type: StateEventType;
  timestamp: string;
  state_after: PatientState;
  cue_id: string | null;
  label: string | null;
};

export type AutoPatientMessage = {
  message_id: string;
  speaker: "patient";
  text: string;
  trigger: "instructor_cue";
  cue_id: string;
  cue_label: string | null;
};

export type PatientStateResponse = {
  state: PatientState;
  auto_patient_message: AutoPatientMessage | null;
};

export type StateEventsResponse = {
  events: StateEvent[];
};

export async function getPatientState(): Promise<PatientStateResponse> {
  const response = await fetch(`${API_BASE_URL}/state`);

  if (!response.ok) {
    throw new Error(`State request failed with status ${response.status}`);
  }

  return response.json();
}

export async function resetPatientState(): Promise<PatientStateResponse> {
  const response = await fetch(`${API_BASE_URL}/state/reset`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`State reset failed with status ${response.status}`);
  }

  return response.json();
}

export async function applyInstructorCue(
  cueId: string,
): Promise<PatientStateResponse> {
  const response = await fetch(`${API_BASE_URL}/state/cues/${cueId}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Cue request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getStateEvents(): Promise<StateEventsResponse> {
  const response = await fetch(`${API_BASE_URL}/state/events`);

  if (!response.ok) {
    throw new Error(`State events request failed with status ${response.status}`);
  }

  return response.json();
}

export async function pauseAiPatient(): Promise<PatientStateResponse> {
  return postStateSafetyControl("/state/safety/pause", "AI pause");
}

export async function resumeAiPatient(): Promise<PatientStateResponse> {
  return postStateSafetyControl("/state/safety/resume", "AI resume");
}

export async function startInstructorTakeover(): Promise<PatientStateResponse> {
  return postStateSafetyControl(
    "/state/safety/takeover/start",
    "Instructor takeover start",
  );
}

export async function endInstructorTakeover(): Promise<PatientStateResponse> {
  return postStateSafetyControl(
    "/state/safety/takeover/end",
    "Instructor takeover end",
  );
}

async function postStateSafetyControl(
  path: string,
  label: string,
): Promise<PatientStateResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`${label} request failed with status ${response.status}`);
  }

  return response.json();
}
