import { useEffect, useState } from "react";

import {
  getPatientState,
  getStateEvents,
  PatientState,
  StateEvent,
} from "../api/state";
import { Chat } from "./Chat";

const cueButtons = [
  { cueId: "spo2_dropped", label: "SpO2 dropped" },
  { cueId: "hr_increased", label: "HR increased" },
  { cueId: "breathing_worsened", label: "Breathing worsened" },
  { cueId: "oxygen_applied", label: "Oxygen applied" },
  { cueId: "bronchodilator_given", label: "Bronchodilator given" },
  { cueId: "patient_improving", label: "Patient improving" },
];

export function Dashboard() {
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const [events, setEvents] = useState<StateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [stateResponse, eventsResponse] = await Promise.all([
          getPatientState(),
          getStateEvents(),
        ]);

        setPatientState(stateResponse.state);
        setEvents(eventsResponse.events);
        setErrorMessage("");
      } catch {
        setErrorMessage("Dashboard data failed to load. Make sure the backend is running.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <main className="app-shell">
      <section className="status-panel" aria-labelledby="dashboard-title">
        <p className="eyebrow">Instructor dashboard</p>
        <h1 id="dashboard-title">COPD/SOB Control View</h1>
        <p className="lede">
          Current patient state, instructor cues, and state event timeline.
        </p>

        {isLoading ? <p>Loading patient state...</p> : null}
        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        {patientState ? (
          <>
            <section aria-labelledby="state-title">
              <h2 id="state-title">Current State</h2>
              <dl>
                <StateRow label="Status" value={patientState.status} />
                <StateRow label="Stage" value={patientState.stage} />
                <StateRow label="HR" value={`${patientState.vitals.heart_rate} bpm`} />
                <StateRow label="SpO2" value={`${patientState.vitals.spo2}%`} />
                <StateRow
                  label="RR"
                  value={`${patientState.vitals.respiratory_rate}/min`}
                />
                <StateRow label="BP" value={patientState.vitals.blood_pressure} />
                <StateRow
                  label="Breathing effort"
                  value={patientState.symptoms.breathing_effort}
                />
                <StateRow
                  label="Chest tightness"
                  value={patientState.symptoms.chest_tightness}
                />
                <StateRow label="Anxiety" value={patientState.emotion.anxiety} />
                <StateRow label="Fatigue" value={patientState.emotion.fatigue} />
                <StateRow
                  label="Oxygen applied"
                  value={formatBoolean(patientState.interventions.oxygen_applied)}
                />
                <StateRow
                  label="Bronchodilator given"
                  value={formatBoolean(patientState.interventions.bronchodilator_given)}
                />
                <StateRow
                  label="AI paused"
                  value={formatBoolean(patientState.safety.ai_paused)}
                />
                <StateRow
                  label="Instructor takeover"
                  value={formatBoolean(patientState.safety.instructor_takeover)}
                />
              </dl>
            </section>

            <section aria-labelledby="controls-title">
              <h2 id="controls-title">Instructor Controls</h2>
              <button disabled type="button">
                Reset patient state
              </button>
              <div>
                {cueButtons.map((cue) => (
                  <button disabled key={cue.cueId} type="button">
                    {cue.label}
                  </button>
                ))}
              </div>
              <p>
                Buttons are visible in this substep and will be connected to the
                backend in Substep 5.6.
              </p>
            </section>

            <section aria-labelledby="events-title">
              <h2 id="events-title">Event Timeline</h2>
              {events.length > 0 ? (
                <ol>
                  {events.map((event) => (
                    <li key={event.event_id}>
                      <strong>{event.label ?? event.event_type}</strong>
                      <span>
                        {" "}
                        - HR {event.state_after.vitals.heart_rate}, SpO2{" "}
                        {event.state_after.vitals.spo2}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No state events yet.</p>
              )}
            </section>

            <section aria-labelledby="dashboard-chat-title">
              <h2 id="dashboard-chat-title">Patient Conversation</h2>
              <Chat embedded />
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

type StateRowProps = {
  label: string;
  value: string;
};

function StateRow({ label, value }: StateRowProps) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}
