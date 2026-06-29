# Step 5: Build the Instructor Dashboard

## Purpose

Step 5 creates the instructor-facing control dashboard for the COPD/SOB simulation.

The dashboard lets the instructor manually update the AI patient condition while the Laerdal manikin is controlled separately. This preserves the correct product boundary:

```text
Instructor controls Laerdal/manikin separately
Instructor controls AI patient persona state in this app
AI patient response follows the latest instructor-cued state
```

Step 5 is the next most valuable feature because it makes the state manager usable by a human instructor during a live simulation.

---

## Product Value

After Step 4, the backend can update patient state through APIs. But an instructor should not need to use curl commands during a simulation.

Step 5 turns the backend capability into a usable product workflow:

```text
Instructor sees patient state
    |
    v
Instructor clicks condition cue
    |
    v
Backend updates AI patient state
    |
    v
Dashboard refreshes state and event timeline
    |
    v
Next patient response reflects newest state
```

This is important for a future sellable product because the instructor dashboard is the control surface faculty will actually use.

---

## Deadline Strategy

Deadline: July 25, 2026

For the internship demo, Step 5 should prioritize:

- a clear current-state display
- one-click instructor cue buttons
- visible event timeline
- simple dashboard/chat layout
- reliable behavior over visual complexity

Do not overbuild:

- no authentication yet
- no database yet
- no voice yet
- no multi-scenario editor yet
- no complex routing system unless needed

The goal is a strong demo:

```text
Student asks question
Instructor clicks SpO2 dropped
Student asks follow-up
Patient response changes
Instructor can see state and events
```

---

## Scope for Step 5

Step 5 will build:

- instructor dashboard page
- state API client functions
- current patient state display
- instructor cue buttons
- reset session button
- state event timeline display
- simple layout that keeps chat and instructor controls usable

Step 5 will not build:

- OpenAI integration
- voice interaction
- database persistence
- user login/authentication
- final report generation
- full transcript storage
- production multi-session support

---

## Existing Backend APIs To Use

Step 5 should use the APIs created in Step 4.

```text
GET /state
POST /state/reset
POST /state/cues/{cue_id}
GET /state/events
POST /chat
```

Frontend should not directly read scenario JSON files. It should call backend APIs.

---

## Dashboard Users

Primary user:

```text
Nursing simulation instructor/faculty
```

Secondary users:

```text
simulation lab staff
student observer during demo
project evaluator
```

The UI should be designed for an instructor who is busy watching learners and controlling the manikin. It should be fast, readable, and difficult to misuse.

---

## Instructor Workflow

Expected workflow:

```text
1. Instructor starts backend/frontend.
2. Instructor opens dashboard.
3. Instructor resets patient state before scenario.
4. Student interacts with text patient persona.
5. Instructor watches student actions.
6. Instructor clicks cue buttons when manikin state changes.
7. Dashboard updates current state.
8. Event timeline records cue.
9. Next patient reply reflects latest state.
```

---

## Dashboard Layout

Recommended first layout:

```text
---------------------------------------------------------
AI Patient Voice Persona - COPD/SOB Demo
---------------------------------------------------------
Left side: Chat / student-patient conversation
Right side: Instructor controls and current state
Bottom/right: Event timeline
---------------------------------------------------------
```

For the July demo, one page is better than multiple pages.

Reason:

- easier to explain
- fewer routing bugs
- instructor can see everything at once
- stronger demo flow

---

## Required Dashboard Sections

### 1. Header

Show:

- app name
- scenario name
- backend status if simple to keep
- session status

Example:

```text
AI Patient Voice Persona
COPD/SOB Scenario
Session: active
```

### 2. Chat Panel

Reuse the current chat behavior.

Show:

- patient/student messages
- student input
- sending/error state

Reason:

The demo should show how instructor cues affect the next patient reply.

### 3. Current Patient State Panel

Show:

```text
Stage
HR
SpO2
RR
BP
Breathing effort
Chest tightness
Anxiety
Fatigue
Oxygen applied
Bronchodilator given
AI paused
Instructor takeover
```

Design note:

Vitals should be visually easy to scan. Avoid making the instructor hunt for HR or SpO2.

### 4. Instructor Cue Controls

Required cue buttons:

```text
SpO2 dropped
HR increased
Breathing worsened
Oxygen applied
Bronchodilator given
Patient improving
```

Optional for later:

```text
Anxiety increased
Provider notified
Patient repositioned
```

Each cue button should:

```text
call POST /state/cues/{cue_id}
refresh current state
refresh event timeline
show loading/disabled state while request is running
show error if request fails
```

### 5. Session Controls

For Step 5, include:

```text
Reset patient state
```

Planned later:

```text
Start session
Pause AI
Resume AI
Instructor takeover
End session
```

Reason to keep Step 5 simple:

The backend currently supports reset and cues. Full session lifecycle controls can be added after the basic dashboard is working.

### 6. Event Timeline

Show event history from:

```text
GET /state/events
```

Minimum timeline fields:

```text
timestamp
event_type
cue_id
label
important state values after event
```

Example:

```text
14:30:12 - state_reset
14:31:04 - SpO2 dropped -> SpO2 88, breathing severe
14:32:10 - Heart rate increased -> HR 128
```

Product value:

The event timeline will later support transcript review and final reports.

---

## Frontend Files Planned

Create:

```text
codes/frontend/src/api/state.ts
codes/frontend/src/pages/Dashboard.tsx
```

Update:

```text
codes/frontend/src/App.tsx
codes/frontend/src/styles.css
```

Possibly update:

```text
codes/frontend/src/pages/Chat.tsx
```

Only update `Chat.tsx` if needed to make it reusable inside the dashboard.

---

## File Responsibilities

| File | Responsibility | What It Should Not Do |
|---|---|---|
| `api/state.ts` | call backend state endpoints | render dashboard UI |
| `pages/Dashboard.tsx` | render instructor dashboard and coordinate state refresh | directly mutate backend state without API helper |
| `pages/Chat.tsx` | render student-patient chat | own instructor controls |
| `App.tsx` | choose top-level screen | contain dashboard business logic |
| `styles.css` | dashboard layout and visual states | contain app behavior |

---

## Frontend API Client Design

Create state API functions:

```text
getPatientState()
resetPatientState()
applyInstructorCue(cueId)
getStateEvents()
```

Expected TypeScript types:

```text
PatientState
StateEvent
PatientStateResponse
StateEventsResponse
```

These should match the backend `schemas/state.py` response shapes.

---

## Dashboard State Flow

### Initial Load

```text
Dashboard mounts
    |
    v
GET /state
GET /state/events
    |
    v
Render current state and event timeline
```

### Apply Cue

```text
Instructor clicks cue button
    |
    v
POST /state/cues/{cue_id}
    |
    v
Backend updates patient state
    |
    v
Frontend stores updated state
    |
    v
GET /state/events
    |
    v
Timeline updates
```

### Reset

```text
Instructor clicks Reset
    |
    v
POST /state/reset
    |
    v
Frontend updates current state
    |
    v
Frontend refreshes event timeline
```

### Chat After Cue

```text
Instructor applies cue
    |
    v
Student asks follow-up in chat
    |
    v
POST /chat
    |
    v
Backend uses latest state
    |
    v
Patient response changes
```

---

## UI Behavior Requirements

Dashboard should:

- show a loading state while fetching state
- disable cue buttons while cue request is running
- show a clear error message if backend is unavailable
- update current state immediately after successful cue
- refresh event timeline after reset/cue
- keep current state visible while using chat
- use short button labels
- avoid clutter and excessive explanation text inside the app

---

## Safety and Product Rules

The dashboard must clearly follow these rules:

- it does not control the Laerdal manikin
- it controls only the AI patient persona state
- instructor cues are manual
- AI reports and responses do not replace faculty judgment
- no real patient information should be used

Future production controls:

- login required for instructors
- role-based access for instructor/admin
- audit log for cue clicks
- session ownership
- multi-session isolation

---

## Design Recommendation

For this app, use a quiet simulation-dashboard design:

- clear panels
- compact vitals
- direct buttons
- readable timeline
- no marketing-style hero page
- no decorative graphics
- no unnecessary animation

Reason:

The instructor is operating under cognitive load. The dashboard should feel like a control room tool, not a landing page.

---

## Step 5 Small Implementation Plan

### Substep 5.1: Create Step 5 documentation

Create:

```text
codes/docs/Step5_Instructor_Dashboard.md
```

Definition of done:

- dashboard scope is documented
- required frontend files are listed
- API flow is defined
- no app code changed yet

### Substep 5.2: Create frontend state API client

Create:

```text
codes/frontend/src/api/state.ts
```

Definition of done:

- frontend can call `GET /state`
- frontend can call `POST /state/reset`
- frontend can call `POST /state/cues/{cue_id}`
- frontend can call `GET /state/events`
- TypeScript build passes

Completed on June 29, 2026.

Created:

```text
codes/frontend/src/api/state.ts
```

Why this file was created:

- the dashboard needs a clean way to call backend state endpoints
- React components should not repeat raw `fetch` logic for every state action
- typed frontend responses make dashboard development easier and safer
- this prepares the codebase for future auth/session headers without rewriting dashboard UI logic

What the file contains:

```text
PatientState TypeScript type
StateEvent TypeScript type
getPatientState()
resetPatientState()
applyInstructorCue(cueId)
getStateEvents()
```

How it works:

```text
Dashboard component later calls state.ts function
    |
    v
state.ts sends HTTP request to FastAPI backend
    |
    v
backend returns patient state or state events
    |
    v
state.ts returns typed data to dashboard
```

Validation completed:

```text
npm run build
```

Confirmed:

```text
TypeScript and Vite build completed successfully.
```

### Substep 5.3: Create basic dashboard page

Create:

```text
codes/frontend/src/pages/Dashboard.tsx
```

Definition of done:

- dashboard loads current state
- dashboard shows state values
- dashboard shows cue buttons
- dashboard shows reset button
- no styling polish yet beyond usable layout

Completed on June 29, 2026.

Created:

```text
codes/frontend/src/pages/Dashboard.tsx
```

Why this file was created:

- instructors need a visual page for patient state instead of backend curl commands
- Step 4 created the state API, but Step 5 starts turning that API into a usable control-room interface
- the dashboard page will become the main instructor workflow for cueing patient condition changes

What the page does now:

```text
loads current patient state
loads state event timeline
shows patient status, stage, vitals, symptoms, emotion, interventions, and safety flags
shows reset button
shows instructor cue buttons
shows event timeline
shows loading and backend error state
```

How it works:

```text
Dashboard mounts
    |
    v
calls getPatientState()
calls getStateEvents()
    |
    v
stores state/events in React state
    |
    v
renders current patient condition and event timeline
```

Important boundary:

The reset and cue buttons are visible but disabled in Substep 5.3. They will be connected to backend actions in Substep 5.6.

Reason:

Substep 5.3 is only for creating the basic page structure. Connecting button actions is kept separate so the project remains easy to understand and test one step at a time.

Validation completed:

```text
npm run build
```

Confirmed:

```text
TypeScript and Vite build completed successfully.
```

### Substep 5.4: Wire dashboard as main app screen

Update:

```text
codes/frontend/src/App.tsx
```

Definition of done:

- app opens to dashboard
- chat remains available inside dashboard or directly beside it

### Substep 5.5: Add dashboard styling

Update:

```text
codes/frontend/src/styles.css
```

Definition of done:

- dashboard is readable on desktop
- state panel is easy to scan
- cue buttons are grouped
- event timeline is readable
- mobile layout remains usable enough for demo

### Substep 5.6: Connect cue buttons to backend

Update:

```text
codes/frontend/src/pages/Dashboard.tsx
```

Definition of done:

- clicking `SpO2 dropped` updates visible SpO2 to 88
- clicking `HR increased` updates visible HR to 128
- timeline updates after cues
- reset returns HR 92 and SpO2 91

### Substep 5.7: Verify dashboard and chat together

Run backend and frontend.

Definition of done:

- instructor applies cue in dashboard
- student asks follow-up in chat
- patient response reflects updated state
- frontend build passes
- backend server is stopped after testing

### Substep 5.8: Document Step 5 completion

Update:

```text
codes/docs/Step5_Instructor_Dashboard.md
Progress_Report.md
```

Definition of done:

- completed files are listed
- tests are recorded
- known limitations are documented
- next step is recommended

---

## Step 5 Acceptance Criteria

Step 5 is complete when:

- dashboard displays current patient state
- dashboard has cue buttons for major COPD/SOB state changes
- reset state works from the dashboard
- event timeline is visible
- cue clicks update backend state
- cue clicks update visible frontend state
- chat response changes after cue update
- frontend build passes
- backend HTTP validation passes
- no OpenAI key is required
- no voice feature is required yet

---

## Demo Script After Step 5

Use this demo script:

```text
1. Open instructor dashboard.
2. Reset patient state.
3. Confirm HR 92 and SpO2 91 are visible.
4. Ask in chat: "How are you feeling?"
5. Patient gives baseline shortness-of-breath response.
6. Click SpO2 dropped.
7. Confirm SpO2 changes to 88 and event appears in timeline.
8. Ask in chat: "How are you feeling now?"
9. Patient says breathing is worse.
10. Click HR increased.
11. Confirm HR changes to 128 and event appears.
12. Ask in chat: "What do you feel now?"
13. Patient mentions heart racing or fear.
```

This script demonstrates the product's core value in a way faculty can understand quickly.

---

## Known Limitations for Step 5

- dashboard uses in-memory backend state
- state resets when backend restarts
- no user login yet
- no persisted transcript yet
- event timeline is not saved after restart
- no voice interaction yet
- no direct Laerdal integration

These limitations are acceptable for the July 25 internship demo.

---

## Product Scaling Path After Step 5

After the dashboard works, future product work can add:

```text
authentication
session database
Redis live state
WebSocket dashboard updates
transcript persistence
report generation
OpenAI Realtime voice
admin scenario editor
audit logs
multi-room support
```

The dashboard should be built so these features can be added later without rewriting the core UI.
