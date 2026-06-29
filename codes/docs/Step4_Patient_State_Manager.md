# Step 4: Build the Patient State Manager

## Purpose

Step 4 creates the live patient state system for the COPD/SOB simulation.

This is the core feature that lets the AI patient condition change while the scenario is running. The instructor will manually apply cues such as `SpO2 dropped` or `HR increased`, and the next patient response should follow the newest state.

Step 4 keeps the project valuable for the internship demo while also preparing the codebase for a future product.

---

## Product Value

The patient state manager solves a real simulation-lab problem:

```text
Instructor changes manikin condition
    |
    v
Instructor applies matching AI cue
    |
    v
AI patient persona updates condition
    |
    v
Next student interaction reflects the change
```

Without this state manager, the persona can answer questions but cannot reliably behave like a changing patient.

With this state manager, the app can demonstrate the key product idea:

```text
Instructor-cued condition change -> AI patient response changes
```

That is more important than voice at this stage.

---

## Scope for Step 4

Step 4 will build:

- current patient state storage in the backend
- initial state loading from `copd_sob.json`
- instructor cue application
- state reset
- state event logging
- chat response awareness of the latest state

Step 4 will not build:

- instructor dashboard UI
- OpenAI integration
- voice interaction
- database persistence
- authentication
- report generation

Those features come later.

---

## Prototype Strategy

For the July 25 deadline, use an in-memory backend state manager first.

Why:

- faster to implement
- easier to understand
- enough for a working demo
- avoids database setup before the flow is proven

Important limitation:

In-memory state resets when the backend server restarts.

Future product path:

The service should be written so in-memory storage can later be replaced by PostgreSQL or Redis without changing the frontend API.

---

## Current Scenario Source

The state manager will use:

```text
codes/backend/app/scenarios/copd_sob.json
```

Important existing sections:

- `initial_state`
- `instructor_cues`
- `safety_rules`

The first state will come from:

```json
{
  "stage": "initial_assessment",
  "vitals": {
    "heart_rate": 92,
    "spo2": 91,
    "respiratory_rate": 24,
    "blood_pressure": "138/84"
  },
  "symptoms": {
    "breathing_effort": "moderate",
    "chest_tightness": "mild",
    "cough": "present",
    "dizziness": "none"
  },
  "emotion": {
    "anxiety": "mild",
    "fatigue": "moderate"
  },
  "voice_behavior": {
    "speech_pattern": "short phrases",
    "tone": "anxious but cooperative"
  },
  "interventions": {
    "oxygen_applied": false,
    "bronchodilator_given": false,
    "provider_notified": false,
    "patient_repositioned": false
  }
}
```

---

## State Fields

The patient state should include:

| Group | Fields |
|---|---|
| Session | `scenario_id`, `status` |
| Stage | `stage` |
| Vitals | `heart_rate`, `spo2`, `respiratory_rate`, `blood_pressure` |
| Symptoms | `breathing_effort`, `chest_tightness`, `cough`, `dizziness` |
| Emotion | `anxiety`, `fatigue` |
| Voice behavior | `speech_pattern`, `tone` |
| Interventions | `oxygen_applied`, `bronchodilator_given`, `provider_notified`, `patient_repositioned` |
| Safety controls | `ai_paused`, `instructor_takeover` |
| Metadata | `last_updated_at` |

Recommended session statuses:

```text
not_started
active
paused
takeover
ended
```

---

## Instructor Cues

Initial Step 4 cues should come from the COPD/SOB scenario file:

| Cue ID | Expected State Change |
|---|---|
| `spo2_dropped` | SpO2 becomes 88, breathing effort becomes severe, anxiety becomes high |
| `hr_increased` | HR becomes 128, anxiety becomes high |
| `breathing_worsened` | stage becomes worsening, breathing effort becomes severe |
| `oxygen_applied` | oxygen_applied becomes true |
| `bronchodilator_given` | bronchodilator_given becomes true |
| `patient_improving` | stage becomes partial_improvement, SpO2 improves, RR improves |

Product rule:

The instructor cue updates only the AI patient state. It does not control the Laerdal manikin.

---

## Planned Backend Files

Create:

```text
codes/backend/app/schemas/state.py
codes/backend/app/services/state_manager.py
codes/backend/app/api/state.py
```

Update later in Step 4:

```text
codes/backend/app/main.py
codes/backend/app/services/mock_persona.py
codes/backend/app/api/chat.py
```

---

## File Responsibilities

| File | Responsibility | What It Should Not Do |
|---|---|---|
| `schemas/state.py` | define patient state, cue request/response, event shapes | store state |
| `services/state_manager.py` | hold current state, reset state, apply cues, log state events | expose FastAPI routes |
| `api/state.py` | expose state endpoints | contain deep merge or state mutation rules |
| `main.py` | register state router | contain state logic |
| `mock_persona.py` | adapt mock reply based on current state | store session state |
| `api/chat.py` | pass current state into persona service | mutate patient state |

---

## Planned API Endpoints

### Get Current State

```text
GET /state
```

Purpose:

- lets the frontend see the latest patient state
- later supports the instructor dashboard

Expected response:

```json
{
  "scenario_id": "copd-sob",
  "status": "active",
  "stage": "initial_assessment",
  "vitals": {
    "heart_rate": 92,
    "spo2": 91,
    "respiratory_rate": 24,
    "blood_pressure": "138/84"
  }
}
```

### Reset State

```text
POST /state/reset
```

Purpose:

- returns the patient to the scenario's initial state
- clears previous event history for the demo session

### Apply Instructor Cue

```text
POST /state/cues/{cue_id}
```

Example:

```text
POST /state/cues/spo2_dropped
```

Purpose:

- finds the matching cue in the scenario file
- applies the cue's `state_updates`
- logs an event
- returns the updated state

### Get State Events

```text
GET /state/events
```

Purpose:

- returns the current session's state event timeline
- prepares for later transcript/report work

---

## Control Flow

### Reset Flow

```text
Instructor starts or resets session
    |
    v
POST /state/reset
    |
    v
Backend loads scenario initial_state
    |
    v
State manager stores current state
    |
    v
Backend logs reset event
    |
    v
Frontend receives current state
```

### Cue Update Flow

```text
Instructor selects cue
    |
    v
POST /state/cues/{cue_id}
    |
    v
Backend loads matching instructor cue
    |
    v
State manager merges cue updates into current state
    |
    v
Backend logs cue event
    |
    v
Frontend receives updated state
```

### Chat With Current State Flow

```text
Student sends message
    |
    v
POST /chat
    |
    v
Backend loads current patient state
    |
    v
Mock persona uses message + scenario + current state
    |
    v
Patient reply reflects latest instructor cue
```

---

## State Merge Rule

Instructor cue updates should be merged into the current state.

Example current state:

```json
{
  "vitals": {
    "heart_rate": 92,
    "spo2": 91
  },
  "emotion": {
    "anxiety": "mild"
  }
}
```

Cue update:

```json
{
  "vitals": {
    "spo2": 88
  },
  "emotion": {
    "anxiety": "high"
  }
}
```

Result:

```json
{
  "vitals": {
    "heart_rate": 92,
    "spo2": 88
  },
  "emotion": {
    "anxiety": "high"
  }
}
```

The cue updates only the fields it specifies. It should not erase unrelated fields.

---

## Event Logging

Each state change should create an event.

Recommended event shape:

```json
{
  "event_id": "evt_001",
  "event_type": "instructor_cue",
  "cue_id": "spo2_dropped",
  "label": "SpO2 dropped",
  "timestamp": "2026-06-29T14:30:00Z",
  "state_after": {}
}
```

Event types for Step 4:

```text
state_reset
instructor_cue
```

Future event types:

```text
session_started
session_paused
session_resumed
instructor_takeover_started
instructor_takeover_ended
session_ended
```

---

## Chat Response State Awareness

Step 4 must make the mock persona aware of the current state.

Examples:

| Current State | Expected Response Style |
|---|---|
| breathing effort moderate | short but cooperative |
| breathing effort severe | very short, more anxious, breathless |
| HR 128 and anxiety high | may mention heart racing or panic |
| oxygen_applied true but patient not improving | patient may say oxygen is on but still struggling |
| stage partial_improvement | calmer, slightly longer responses |

Example before cue:

```text
Student: How are you feeling?
Patient: I am feeling short of breath and a little scared. Can you help me?
```

Example after `spo2_dropped`:

```text
Student: How are you feeling?
Patient: Worse. I cannot catch my breath.
```

Example after `hr_increased`:

```text
Student: What do you feel now?
Patient: My heart feels like it is racing. I feel scared.
```

---

## Safety Behavior

The state manager should support these safety flags:

```text
ai_paused
instructor_takeover
```

For Step 4, these can exist in the state even if the dashboard controls are added later.

Expected future behavior:

- if `ai_paused` is true, the patient should not respond
- if `instructor_takeover` is true, the patient should not respond automatically

This prepares the product for simulation-lab safety requirements.

---

## Product Scaling Notes

Step 4 should be implemented with clean boundaries because this project may become a sellable product later.

Prototype now:

```text
FastAPI process memory
```

Future product:

```text
Redis for live session state
PostgreSQL for persisted sessions, events, transcripts, and reports
WebSockets for live instructor dashboard updates
Role-based authentication for instructors/admins
Audit logs for state changes
```

Design rule:

The frontend should call APIs, not directly depend on how state is stored.

That keeps the product scalable.

---

## Step 4 Small Implementation Plan

### Substep 4.1: Create Step 4 documentation

Create:

```text
codes/docs/Step4_Patient_State_Manager.md
```

Definition of done:

- Step 4 plan is documented
- no app code changed yet

### Substep 4.2: Define state schemas

Create:

```text
codes/backend/app/schemas/state.py
```

Definition of done:

- patient state response shape is defined
- event shape is defined
- schema imports compile

Completed on June 29, 2026.

Created:

```text
codes/backend/app/schemas/state.py
```

Defined schema models:

```text
Vitals
Symptoms
Emotion
VoiceBehavior
Interventions
SafetyControls
PatientState
StateEvent
PatientStateResponse
StateEventsResponse
```

Validation completed:

```text
.venv/bin/python -c 'from datetime import datetime, UTC; from app.schemas.state import PatientState; from app.services.scenario_loader import load_copd_sob_scenario; scenario = load_copd_sob_scenario(); state = PatientState(scenario_id=scenario["scenario_id"], last_updated_at=datetime.now(UTC), **scenario["initial_state"]); print(state.model_dump()["scenario_id"]); print(state.model_dump()["vitals"]["spo2"]); print(state.model_dump()["safety"])'
```

Confirmed:

```text
scenario_id: copd-sob
spo2: 91
safety flags: ai_paused false, instructor_takeover false
```

Compile check completed:

```text
.venv/bin/python -m compileall app
```

### Substep 4.3: Create state manager service

Create:

```text
codes/backend/app/services/state_manager.py
```

Definition of done:

- initial state loads from scenario
- current state can be returned
- state can be reset
- cue updates can be applied
- events are stored in memory

Completed on June 29, 2026.

Created:

```text
codes/backend/app/services/state_manager.py
```

Why this file was created:

- the app needs one backend service that owns the live patient state
- the chat route and future instructor dashboard should not each manage state separately
- the first demo needs fast in-memory state, but the service boundary lets us replace memory with Redis/PostgreSQL later
- instructor-cued changes must be logged so they can appear in the future event timeline and report

What the service does now:

```text
reset_state()
get_current_state()
apply_instructor_cue(cue_id)
get_state_events()
```

How it works:

```text
load COPD/SOB scenario
    |
    v
build PatientState from initial_state
    |
    v
store current state in backend memory
    |
    v
apply cue state_updates with deep merge
    |
    v
store updated current state
    |
    v
log StateEvent in memory
```

Important implementation choice:

The state manager uses in-memory module variables for Phase 1 speed:

```text
_current_state
_state_events
```

This is acceptable for the July 25 demo because only one local COPD/SOB session is being tested. For a product version, this storage should move behind the same service interface to Redis/PostgreSQL.

Validation completed:

```text
.venv/bin/python -c 'from app.services.state_manager import reset_state, apply_instructor_cue, get_state_events; state = reset_state(); print("initial", state.vitals.heart_rate, state.vitals.spo2); state = apply_instructor_cue("spo2_dropped"); print("spo2", state.vitals.spo2, state.symptoms.breathing_effort, state.emotion.anxiety); state = apply_instructor_cue("hr_increased"); print("hr", state.vitals.heart_rate, state.emotion.anxiety); print("events", [(event.event_type, event.cue_id) for event in get_state_events()])'
```

Confirmed:

```text
initial HR 92, SpO2 91
spo2_dropped -> SpO2 88, breathing effort severe, anxiety high
hr_increased -> HR 128, anxiety high
events -> state_reset, spo2_dropped, hr_increased
```

Compile check completed:

```text
.venv/bin/python -m compileall app
```

### Substep 4.4: Create state API routes

Create:

```text
codes/backend/app/api/state.py
```

Definition of done:

- `GET /state` works
- `POST /state/reset` works
- `POST /state/cues/{cue_id}` works
- `GET /state/events` works

### Substep 4.5: Register state route

Update:

```text
codes/backend/app/main.py
```

Definition of done:

- FastAPI route list includes `/state`
- backend compile check passes

### Substep 4.6: Test state API

Run backend tests manually with curl.

Definition of done:

- initial state returns HR 92 and SpO2 91
- applying `spo2_dropped` changes SpO2 to 88
- applying `hr_increased` changes HR to 128
- event list includes cue events

### Substep 4.7: Make chat use current state

Update:

```text
codes/backend/app/api/chat.py
codes/backend/app/services/mock_persona.py
```

Definition of done:

- chat route reads the latest patient state
- mock patient response changes after cue updates
- no frontend changes required yet

### Substep 4.8: Document Step 4 completion

Update:

```text
codes/docs/Step4_Patient_State_Manager.md
```

Definition of done:

- completed files are listed
- tested commands are recorded
- known limitations are documented

---

## Step 4 Acceptance Criteria

Step 4 is complete when:

- backend can return current patient state
- backend can reset state to scenario initial state
- backend can apply instructor cues
- backend logs state reset and cue events
- chat response uses the latest state
- `SpO2 dropped` changes the next patient response
- `HR increased` changes the next patient response
- implementation remains mock/OpenAI-free
- no database is required yet

---

## Demo Script After Step 4

Use this script to prove Step 4 value:

```text
1. Reset patient state.
2. Ask: "How are you feeling?"
3. Patient responds with moderate shortness of breath.
4. Apply cue: spo2_dropped.
5. Ask: "How are you feeling now?"
6. Patient responds as more breathless/anxious.
7. Apply cue: hr_increased.
8. Ask: "What do you feel now?"
9. Patient mentions heart racing or fear.
```

This demo directly shows why the state manager matters.
