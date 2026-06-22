# Phase 1 Build Steps: Instructor-Cued AI Patient Voice Demo

## Phase 1 Goal

Build a standalone instructor-cued AI patient voice demo with no Laerdal/LLEAP/SimCapture integration. The instructor controls the manikin separately and manually updates the AI patient condition through the AI dashboard.

Recommended project location:

```text
codes/
  frontend/
  backend/
  docs/
  README.md
```

Recommended stack:

- Frontend: React + TypeScript
- Backend: FastAPI
- Database for first demo: PostgreSQL
- Voice: OpenAI Realtime after text mode is working

---

## 1. Project Setup

Create the basic frontend/backend structure.

Main tasks:

- Create `frontend/` for the React dashboard and voice UI.
- Create `backend/` for FastAPI routes, session logic, and AI calls.
- Create `docs/` for notes, scenario definitions, and demo instructions.
- Add a top-level `README.md` explaining how to run the demo.

Success criteria:

- Frontend can start locally.
- Backend can start locally.
- Frontend can call a simple backend health endpoint.

---

## 2. Define the First Scenario

Start with one scenario only:

**Adult COPD / Shortness of Breath**

Define:

- patient name
- age and background
- chief complaint
- initial symptoms
- hidden information
- allowed disclosures
- initial vitals/state
- possible instructor cues
- safety rules

Example initial state:

```text
HR: 92
SpO2: 91%
RR: 24
Breathing effort: moderate
Anxiety: mild
Speech pattern: short phrases
Stage: initial assessment
```

Success criteria:

- Scenario exists as a structured config.
- Persona instructions are clear enough for text-only testing.
- Safety rules state that the AI speaks only as the patient.

---

## 3. Build Text-Only Persona First

Before voice, build a text chatbot version.

Flow:

```text
student typed question
        |
        v
backend persona logic
        |
        v
AI patient text response
```

Main tasks:

- Add a simple chat UI.
- Send student text to the backend.
- Backend sends scenario, persona, safety rules, and current state to the AI model.
- Show AI patient response in the UI.

Success criteria:

- Student can type a question.
- AI answers as the COPD patient.
- AI does not act as nurse, doctor, instructor, or evaluator.

---

## 4. Build the Patient State Manager

Create the live patient state object that controls how the persona responds.

Core state fields:

```text
HR
SpO2
RR
BP
breathing effort
chest tightness
anxiety
fatigue
stage
oxygen applied
bronchodilator given
provider notified
AI paused
instructor takeover
```

Main tasks:

- Store current session state in the backend.
- Add state update actions for instructor cues.
- Log each state update as an event.
- Make the next AI response use the newest state.

Success criteria:

- Clicking `SpO2 dropped` updates state.
- Clicking `HR increased` updates state.
- The next AI response reflects the updated condition.

---

## 5. Build the Instructor Dashboard

Add scenario-specific controls for the instructor.

Required controls:

- start session
- pause AI
- resume AI
- instructor takeover
- end session
- HR increased
- SpO2 dropped
- breathing worsened
- anxiety increased
- oxygen applied
- bronchodilator given
- patient improving

Dashboard should show:

- current patient state
- session status
- transcript
- event timeline
- instructor notes

Success criteria:

- Instructor can update patient condition with one click.
- Current state is always visible.
- Pause/takeover controls are always visible.

---

## 6. Add Voice Interaction

Add voice only after text mode, state manager, and dashboard are working.

Voice flow:

```text
student speech
        |
        v
OpenAI Realtime voice session
        |
        v
AI patient voice response
        |
        v
speaker or manikin room audio
```

Main tasks:

- Backend creates short-lived Realtime credentials.
- Frontend connects to OpenAI Realtime through WebRTC.
- Student microphone streams audio.
- AI patient voice plays through selected speaker.
- Instructor state changes update the Realtime session context.

Security rule:

- The OpenAI API key must stay on the backend.
- The frontend should receive only temporary Realtime credentials.

Success criteria:

- Student can speak to the AI patient.
- AI responds by voice.
- Instructor cue changes affect the next AI response.

---

## 7. Add Transcript and Event Timeline

Store the important record of the session.

Transcript should include:

- student questions
- AI patient responses
- timestamps
- speaker labels

Event timeline should include:

- session started
- instructor cues
- pause/resume/takeover events
- interventions
- session ended

Success criteria:

- Transcript is visible during the session.
- State changes appear in the event timeline.
- Transcript and events are available after the session ends.

---

## 8. Add Final Report

Generate a debrief-support report after the session.

Report sections:

- session metadata
- short summary
- transcript
- event timeline
- assessment checklist
- communication observations
- suggested debrief prompts
- instructor notes

Important rule:

- The report supports faculty debriefing but does not grade students independently.

Success criteria:

- Instructor can generate a report after ending the session.
- Report includes transcript and state-event timeline.
- Report clearly labels AI analysis as debrief support.

---

## 9. Add Safety Controls

Safety controls are required before any realistic pilot.

AI must:

- speak only as the simulated patient
- follow the current instructor-cued state
- stop when paused or takeover is active
- keep responses short when respiratory distress is high
- avoid clinical teaching during the live scenario

AI must not:

- control the manikin
- give treatment orders
- tell students the correct intervention
- reveal the diagnosis too early
- grade students
- use real patient information

Success criteria:

- Pause stops AI responses.
- Instructor takeover stops AI responses.
- AI stays in patient role during testing.

---

## 10. Test with a Mock Simulation

Run a complete COPD/SOB mock session.

Test script:

1. Start COPD scenario.
2. Student asks what brought the patient in.
3. Student asks about chest tightness.
4. Instructor clicks `SpO2 dropped`.
5. AI becomes more breathless.
6. Instructor clicks `HR increased`.
7. AI reports heart racing or panic.
8. Instructor clicks `oxygen applied`.
9. AI improves only if instructor cues improvement.
10. Instructor ends session.
11. Generate report.

Success criteria:

- State changes work during a live session.
- AI responses match the current state.
- Transcript and report are generated.
- Instructor can pause or take over at any time.

---

## 11. Prepare Final Internship Demo

The final demo should show the value of the project clearly.

Demo sequence:

- Show instructor dashboard.
- Start COPD/SOB scenario.
- Ask the AI patient assessment questions.
- Trigger a condition change from the dashboard.
- Show that the AI response changes.
- End the session.
- Show transcript and final report.
- Explain that SimCapture can record the room audio/video separately.

Final demo artifacts:

- working app demo
- COPD/SOB scenario
- instructor dashboard
- voice or text interaction
- transcript
- final report
- short presentation or demo video

---

## Recommended Build Order

```text
1. project setup
2. scenario config
3. text-only persona
4. patient state manager
5. instructor dashboard
6. voice interaction
7. transcript and event timeline
8. final report
9. safety controls
10. mock simulation test
11. final demo preparation
```

The most important rule is to build the text and state logic first. Voice should come after the persona and dashboard behavior are already working.

