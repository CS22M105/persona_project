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

## Technology Choice Rationale

### Why React for the Frontend

We chose a React frontend because it fits the project's needs well: an interactive AI patient voice/persona app benefits from reusable UI components, fast state updates, and a responsive user experience.

React is a good choice here because:

- It makes it easy to build dynamic screens for patient personas, chat-like interactions, forms, and generated AI responses.
- Its component model helps keep the UI organized and reusable as the project grows.
- It has strong ecosystem support for routing, styling, API calls, authentication, and deployment.
- It works well with a Python or Node backend through REST APIs or WebSockets.
- It is widely used in industry, so it is easier to maintain, document, and hand off to future developers.

In short: React lets us build a clean, scalable, and interactive frontend quickly, which is important for an AI-driven healthcare simulation project.

### Why Only React?

Other frontend choices we could have used were **Vue**, **Angular**, **Svelte**, plain **HTML/JavaScript**, a backend-rendered UI like **Flask/Django templates**, or a cross-platform option like **Flutter**.

For our requirements, React was the strongest fit.

#### Vue

Vue would also work well. It is simpler than React in some ways and good for dashboards.

Fit with our project: good for instructor buttons, transcript display, and state updates.

Why not choose it: smaller ecosystem and less common in many AI/web prototype stacks compared with React.

#### Angular

Angular is powerful for large enterprise apps.

Fit with our project: good for structured dashboards, authentication, role-based access, and future product scaling.

Why not choose it: heavier, more setup, and slower for a July prototype. Our Phase 1 goal is a fast demo, not a large enterprise frontend.

#### Svelte

Svelte is lightweight and fast.

Fit with our project: good for a responsive UI and simple state-driven screens.

Why not choose it: smaller ecosystem and fewer widely used libraries/examples for complex AI dashboard workflows compared with React.

#### Plain HTML, CSS, JavaScript

This would be the simplest technically.

Fit with our project: okay for a very basic demo.

Why not choose it: the app needs live state, transcript updates, scenario controls, pause/takeover buttons, and future growth. Plain JavaScript would become harder to maintain quickly.

#### Flask/Django Templates

Since the backend may be Python-based, we could render pages directly from Flask or Django.

Fit with our project: good for simple forms, reports, login pages, and server-generated summaries.

Why not choose it: less ideal for live interactive UI, real-time voice state, dynamic cue buttons, and transcript updates.

#### Flutter

Flutter could build a polished app for desktop, tablet, or mobile.

Fit with our project: useful if the instructor dashboard needed to become a dedicated tablet app.

Why not choose it: extra complexity, less natural for a web-first prototype, and backend/AI integrations are usually faster to prototype with React.

#### Why React Fits Best

Our frontend needs are:

- instructor dashboard with fast scenario-specific buttons
- live patient state updates
- transcript and event timeline display
- pause, mute, reset, and takeover controls
- API connection to the AI/persona backend
- future support for authentication, reports, and integrations
- fast prototype timeline

React handles these especially well because it is component-based, widely supported, good for real-time interactive interfaces, and easy to connect with backend APIs. Compared with the alternatives, React gives the best balance of speed, flexibility, ecosystem, and future scalability for this project.

### Why FastAPI for the Backend

We chose FastAPI because the backend needs to expose clean API routes, validate structured data, manage AI/persona requests, and eventually support real-time features. FastAPI fits this project well because it is Python-based, fast to develop with, and strong for typed API contracts.

FastAPI is a good choice here because:

- It is excellent for REST API endpoints such as health checks, scenarios, chat, state updates, and reports.
- It uses Pydantic models for request and response validation, which keeps frontend/backend communication predictable.
- It automatically generates interactive API documentation, which is helpful for testing and internship handoff.
- It works naturally with Python AI tooling and OpenAI API calls.
- It can support async workflows, WebSockets, and real-time session services later.
- It is lightweight enough for a prototype but structured enough for production growth.

In short: FastAPI lets us build a clear, testable, Python-based backend quickly while keeping a path toward a secure production architecture.

### Why Only FastAPI?

Other backend choices we could have used were **Flask**, **Django**, **Express/Node.js**, **NestJS**, or **Spring Boot**.

For our requirements, FastAPI was the strongest fit.

#### Flask

Flask is simple and flexible.

Fit with our project: good for a small prototype with a few routes.

Why not choose it: FastAPI gives stronger built-in request validation, type hints, async support, and automatic API docs with less extra setup.

#### Django

Django is a full-featured Python web framework.

Fit with our project: good for authentication, admin panels, database-backed apps, and report management.

Why not choose it: heavier than needed for Phase 1. The project currently needs API endpoints and AI service orchestration more than a full server-rendered web framework.

#### Express/Node.js

Express is a popular JavaScript backend framework.

Fit with our project: good for lightweight APIs and JavaScript full-stack development.

Why not choose it: the project benefits from Python's AI ecosystem, and FastAPI gives stronger typed request/response validation out of the box.

#### NestJS

NestJS is a structured Node.js backend framework.

Fit with our project: good for larger production systems with strong architecture patterns.

Why not choose it: more setup and abstraction than needed for a July prototype, and it moves the backend away from Python AI tooling.

#### Spring Boot

Spring Boot is powerful for enterprise Java applications.

Fit with our project: good for large secure systems with complex enterprise requirements.

Why not choose it: too heavy for this internship prototype and slower for rapid AI/backend experimentation.

#### Why FastAPI Fits Best

Our backend needs are:

- scenario and persona API routes
- chat request/response validation
- patient state update endpoints
- instructor-cued control logic
- transcript and event logging
- future OpenAI integration
- future WebSocket or realtime session support
- clear API documentation for testing and handoff

FastAPI handles these especially well because it is Python-native, typed, lightweight, async-ready, and easy to connect with React. Compared with the alternatives, FastAPI gives the best balance of speed, clarity, validation, AI compatibility, and future scalability for this project.

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

## 6. Add OpenAI Text Persona

Upgrade the current mock text patient into an OpenAI-powered text persona.

Reason for this change:

The isolated voice spike proved that voice is feasible, but the main product should first make the patient persona realistic, state-aware, and reliable. This creates a stronger July 25 demo and prepares the system for transcript persistence and reports.

Text persona flow:

```text
student text
        |
        v
backend loads scenario and current patient state
        |
        v
OpenAI text persona response
        |
        v
dashboard chat display
```

Main tasks:

- Add secure backend OpenAI configuration.
- Add an OpenAI text persona service.
- Build a prompt from scenario rules and current patient state.
- Keep the existing mock persona as fallback.
- Keep the existing `/chat` API unchanged.
- Verify cue changes affect OpenAI-generated replies.

Security rule:

- The OpenAI API key must stay on the backend.
- The frontend must never receive the permanent API key.

Success criteria:

- Student can type to the AI patient.
- AI answers as the COPD/SOB patient.
- AI follows the latest instructor-cued state.
- Mock fallback still works if OpenAI is disabled or unavailable.

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

## 9. Add Voice Interaction

Add voice after the OpenAI text persona, transcript persistence, and report foundation are working.

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

## 10. Add Safety Controls and Instructor Takeover Polish

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

## 11. Prepare Final Internship Demo

The final demo should show the value of the project clearly.

Demo sequence:

- Show instructor dashboard.
- Start COPD/SOB scenario.
- Ask the AI patient assessment questions.
- Trigger a condition change from the dashboard.
- Show that the AI response changes.
- End the session.
- Show transcript and final report if available.
- Explain that SimCapture can record the room audio/video separately.

Final demo artifacts:

- working app demo
- COPD/SOB scenario
- instructor dashboard
- OpenAI text interaction
- transcript
- final report if completed
- optional voice spike or integrated voice
- short presentation or demo video

---

## Mock Simulation Test Script

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

## Recommended Build Order

```text
1. project setup
2. scenario config
3. text-only persona
4. patient state manager
5. instructor dashboard
6. OpenAI text persona using current patient state
7. transcript and event timeline
8. final report
9. voice interaction
10. safety controls / pause / instructor takeover polish
11. final demo preparation
```

The most important rule is to make the patient persona and session record reliable before fully integrating voice. Voice remains important, but it should sit on top of a stable text, state, transcript, and report foundation.
