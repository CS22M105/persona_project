# AI Patient Voice Persona Implementation Design

**Document type:** Production implementation design  
**Product boundary:** Standalone instructor-cued AI patient voice system  
**Target users:** Nursing simulation faculty, simulation lab instructors, technical reviewers  
**Primary stack:** React + TypeScript, FastAPI, PostgreSQL, Redis, WebSockets, OpenAI Realtime  
**Important constraint:** No direct Laerdal/LLEAP/SimCapture integration is included in this design. The instructor manually controls the AI patient state through the AI dashboard.

---

## 1. Document Purpose

This document defines the production-grade implementation design for an instructor-cued AI patient voice system for nursing simulation. It describes the architecture, modules, data flow, diagrams, APIs, data model, security controls, report generation, testing plan, and rollout checklist.

The system is designed to run alongside an existing manikin simulation workflow. The instructor continues to control the manikin separately. The AI application provides a controlled patient voice, live transcript, event timeline, and debrief-ready report.

---

## 2. Product Overview

The product lets an instructor run an AI patient voice persona during a simulation scenario. Students speak to the simulated patient through a microphone in the simulation room. The AI responds as the patient using a scenario-specific persona and the current patient state. The instructor updates that state manually from a dashboard.

Example:

1. Instructor changes the manikin's heart rate in the existing manikin control software.
2. Instructor clicks `HR increased` in the AI dashboard.
3. The AI patient state updates.
4. The next AI patient response reflects the new condition.

The first production scenario is an adult COPD/shortness-of-breath case. The architecture supports adding more faculty-approved scenarios later, but it does not assume any automatic manikin integration.

---

## 3. Goals and Non-Goals

### Goals

- Provide realistic AI patient speech during nursing simulation.
- Keep the instructor in control of patient state and scenario progression.
- Support live condition changes while the AI persona is running.
- Capture transcript and event timeline for debriefing.
- Generate a faculty-reviewed report after the session.
- Securely manage users, sessions, scenarios, transcripts, and reports.

### Non-Goals

- No direct control of the manikin.
- No automatic reading of Laerdal/LLEAP/SimCapture state.
- No replacement of faculty judgment or student evaluation.
- No use of real patient records.
- No autonomous medication advice, treatment orders, or clinical teaching during the live scenario.

---

## 4. High-Level Architecture

```mermaid
flowchart LR
    Student[Students in Simulation Room]
    Mic[Room Microphone]
    Speaker[Room Speaker or Manikin Audio]
    Instructor[Instructor in Control Room]
    Dashboard[Instructor Dashboard]
    VoiceRoom[AI Patient Voice Room]
    API[FastAPI Backend]
    Redis[(Redis Live State)]
    DB[(PostgreSQL)]
    Realtime[OpenAI Realtime]
    Report[Report Generator]
    SimCapture[SimCapture Recording]

    Student --> Mic
    Mic --> VoiceRoom
    VoiceRoom <--> Realtime
    Realtime --> VoiceRoom
    VoiceRoom --> Speaker
    Speaker --> Student

    Instructor --> Dashboard
    Dashboard <--> API
    VoiceRoom <--> API
    API <--> Redis
    API <--> DB
    API --> Report

    Speaker --> SimCapture
```

### Core Design Principle

The AI persona is state-conditioned. Every patient response is generated from:

- scenario definition
- persona rules
- current patient state
- recent transcript context
- instructor safety controls

---

## 5. Production Deployment Architecture

```mermaid
flowchart TB
    subgraph UserDevices[Simulation Center Devices]
        InstructorBrowser[Instructor Browser]
        VoiceBrowser[Voice Room Browser]
    end

    subgraph PrivateCloud[Private Cloud Environment]
        LB[HTTPS Load Balancer]
        Web[React Static App]
        API[FastAPI App]
        Worker[Background Worker]
        Redis[(Redis)]
        Postgres[(Managed PostgreSQL)]
        ObjectStore[(Encrypted Object Storage)]
        Secrets[Secrets Manager]
        Logs[Central Logs and Audit Store]
    end

    OpenAI[OpenAI Realtime API]

    InstructorBrowser --> LB
    VoiceBrowser --> LB
    LB --> Web
    LB --> API
    API <--> Redis
    API <--> Postgres
    API --> Worker
    Worker <--> Postgres
    Worker --> ObjectStore
    API --> Secrets
    API --> Logs
    Worker --> Logs
    VoiceBrowser <--> OpenAI
    API --> OpenAI
```

### Deployment Requirements

- TLS for all web traffic.
- Backend-only storage of OpenAI API keys.
- Browser receives only short-lived Realtime client credentials.
- PostgreSQL encryption at rest.
- Daily database backup.
- Centralized application logs and audit logs.
- Separate production, staging, and local development environments.

---

## 6. Core System Modules

| Module | Responsibility |
|---|---|
| Instructor dashboard | scenario control, patient cues, pause/takeover, transcript, notes |
| Student/patient voice room | microphone capture, speaker output, Realtime voice session |
| Scenario and persona manager | stores faculty-approved scenario content and patient persona rules |
| Patient state manager | maintains current vitals, symptoms, stage, emotion, and intervention status |
| Realtime voice session service | creates short-lived OpenAI Realtime credentials and session instructions |
| Transcript/event logger | stores student speech, AI responses, state cues, and control events |
| Report generator | produces debrief summary, checklist, timeline, and prompts |
| Auth and role access | login, sessions, roles, permissions |
| Audit log service | immutable record of sensitive actions |
| Admin scenario editor | controlled creation and review of scenarios/personas |

---

## 7. Realtime Voice Architecture

The browser-based voice room uses OpenAI Realtime through WebRTC. The FastAPI backend creates ephemeral client credentials for authorized active sessions. The OpenAI API key is never exposed to the browser.

```mermaid
sequenceDiagram
    participant I as Instructor Dashboard
    participant V as Voice Room Browser
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant OAI as OpenAI Realtime

    I->>API: Start simulation session
    API->>DB: Create session record
    API-->>I: Session started
    V->>API: Request Realtime client credential
    API->>DB: Verify user, session, scenario
    API->>OAI: Create ephemeral client secret
    OAI-->>API: Client secret
    API-->>V: Short-lived client secret
    V->>OAI: Connect via WebRTC
    V->>OAI: Stream student audio
    OAI-->>V: Stream AI patient audio
    V->>API: Send transcript events
    API->>DB: Persist transcript turns
```

### Realtime Session Instructions

Each Realtime session receives scenario-specific instructions that include:

- patient identity and background
- current scenario objective
- allowed disclosures
- hidden information
- patient speech style
- safety constraints
- current patient state
- instruction to remain in patient role only

### Voice Session Behavior

- Student speech is sent to the Realtime session.
- AI patient answers in first person as the patient.
- Instructor dashboard state changes are sent to the backend.
- Backend broadcasts state updates to the voice room.
- Voice room updates the Realtime session context before the next response.
- Pause/takeover disables AI response generation until resumed.

---

## 8. Instructor-Cued State Update Flow

```mermaid
sequenceDiagram
    participant Inst as Instructor
    participant Dash as Instructor Dashboard
    participant API as FastAPI Backend
    participant Redis as Redis Live State
    participant DB as PostgreSQL
    participant Voice as Voice Room
    participant OAI as OpenAI Realtime

    Inst->>Dash: Click "SpO2 dropped"
    Dash->>API: POST /sessions/{id}/state-events
    API->>API: Validate permission and transition
    API->>Redis: Update live patient state
    API->>DB: Persist state event
    API-->>Dash: Updated state
    API-->>Voice: WebSocket state update
    Voice->>OAI: Update session context
    OAI-->>Voice: Next patient response reflects new state
```

### State Update Rules

- State updates require an authenticated instructor or admin.
- Every state update is written to the event timeline.
- The latest state in Redis is the source of truth during a live session.
- PostgreSQL is the durable source of truth after the session.
- If Redis is unavailable, live sessions enter safe mode: pause AI and preserve existing database records.

---

## 9. Patient State Management

### State Model

```json
{
  "session_id": "uuid",
  "stage": "initial_assessment",
  "vitals": {
    "hr": 92,
    "spo2": 91,
    "rr": 24,
    "bp": "138/84"
  },
  "symptoms": {
    "breathing_effort": "moderate",
    "chest_tightness": "mild",
    "cough": "present"
  },
  "emotion": {
    "anxiety": "mild",
    "fatigue": "moderate"
  },
  "interventions": {
    "oxygen_applied": false,
    "bronchodilator_given": false,
    "provider_notified": false
  },
  "voice_behavior": {
    "speech_length": "short_phrases",
    "tone": "anxious_cooperative"
  },
  "safety": {
    "ai_paused": false,
    "instructor_takeover": false
  }
}
```

### Patient Condition State Machine

```mermaid
stateDiagram-v2
    [*] --> InitialAssessment
    InitialAssessment --> Worsening: instructor cues SpO2 drop or no improvement
    Worsening --> Deterioration: instructor cues severe distress
    Worsening --> PartialImprovement: instructor cues oxygen applied
    Deterioration --> PartialImprovement: instructor cues intervention response
    PartialImprovement --> TreatmentResponse: instructor cues bronchodilator effect
    TreatmentResponse --> [*]: instructor ends session

    InitialAssessment: anxious, breathless, cooperative
    Worsening: shorter responses, more fear
    Deterioration: severe dyspnea, difficulty speaking
    PartialImprovement: calmer, still short of breath
    TreatmentResponse: longer answers, less tightness
```

### COPD/SOB Initial Scenario Defaults

| Field | Value |
|---|---|
| HR | 92 |
| SpO2 | 91% |
| RR | 24 |
| Breathing effort | moderate |
| Anxiety | mild |
| Speech pattern | short phrases |
| Stage | initial assessment |

---

## 10. Instructor Dashboard Design

### Primary Layout

| Region | Contents |
|---|---|
| Top bar | active scenario, session timer, connection status, pause/takeover |
| Left panel | scenario stage and current patient state |
| Center panel | cue buttons grouped by vitals, symptoms, interventions, emotion |
| Right panel | live transcript and event timeline |
| Bottom panel | notes, mark important moment, end session, generate report |

### Required Controls

| Area | Controls |
|---|---|
| Scenario | start, pause, resume, reset, end |
| Safety | mute AI, instructor takeover, resume AI |
| Vitals | HR increased/decreased, RR increased/decreased, SpO2 dropped/improved, BP changed |
| Symptoms | more/less short of breath, chest tightness, cough, dizziness, pain |
| Emotion | anxious, calmer, fatigued, confused |
| Interventions | oxygen applied, bronchodilator given, repositioned, reassured, provider notified |
| Debrief | instructor notes, mark important moment, generate report |

### Dashboard UX Requirements

- One-click cue updates during live simulation.
- Buttons grouped by clinical meaning.
- Current state always visible.
- Safety controls always visible.
- Transcript and event timeline visible without leaving the session.
- No unnecessary controls for the active scenario.

---

## 11. Data Model

```mermaid
erDiagram
    USER ||--o{ SESSION : runs
    USER ||--o{ AUDIT_LOG : creates
    SCENARIO ||--o{ SESSION : used_by
    SCENARIO ||--o{ PERSONA : defines
    SESSION ||--o{ STATE_EVENT : contains
    SESSION ||--o{ TRANSCRIPT_TURN : contains
    SESSION ||--o{ REPORT : generates
    SESSION ||--|| PATIENT_STATE : has_current

    USER {
        uuid id
        string email
        string display_name
        string role
        boolean active
        datetime created_at
    }

    SCENARIO {
        uuid id
        string name
        string clinical_area
        string status
        json objectives
        datetime created_at
        datetime approved_at
    }

    PERSONA {
        uuid id
        uuid scenario_id
        string patient_name
        int patient_age
        json background
        json disclosure_rules
        json speech_style
        json safety_rules
    }

    SESSION {
        uuid id
        uuid scenario_id
        uuid instructor_id
        string status
        datetime started_at
        datetime ended_at
    }

    PATIENT_STATE {
        uuid session_id
        string stage
        json vitals
        json symptoms
        json emotion
        json interventions
        json safety
        datetime updated_at
    }

    STATE_EVENT {
        uuid id
        uuid session_id
        uuid actor_id
        string event_type
        json payload
        datetime created_at
    }

    TRANSCRIPT_TURN {
        uuid id
        uuid session_id
        string speaker
        text content
        float confidence
        datetime started_at
        datetime ended_at
    }

    REPORT {
        uuid id
        uuid session_id
        string status
        json checklist
        text summary
        json debrief_prompts
        datetime created_at
        uuid reviewed_by
    }

    AUDIT_LOG {
        uuid id
        uuid actor_id
        string action
        string resource_type
        uuid resource_id
        json metadata
        datetime created_at
    }
```

---

## 12. API Design

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | authenticate instructor/admin |
| POST | `/auth/logout` | end user session |
| GET | `/me` | return current user and role |

### Scenarios

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/scenarios` | list approved scenarios |
| POST | `/scenarios` | create scenario draft |
| GET | `/scenarios/{scenario_id}` | get scenario detail |
| PATCH | `/scenarios/{scenario_id}` | update draft scenario |
| POST | `/scenarios/{scenario_id}/approve` | approve scenario for use |

### Simulation Sessions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sessions` | create simulation session |
| GET | `/sessions/{session_id}` | get session detail |
| POST | `/sessions/{session_id}/start` | start live session |
| POST | `/sessions/{session_id}/pause` | pause AI responses |
| POST | `/sessions/{session_id}/resume` | resume AI responses |
| POST | `/sessions/{session_id}/takeover` | instructor takeover |
| POST | `/sessions/{session_id}/end` | end session |

### Live State and Voice

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sessions/{session_id}/state-events` | add instructor cue and update patient state |
| GET | `/sessions/{session_id}/state` | get current patient state |
| POST | `/sessions/{session_id}/realtime-token` | create short-lived Realtime client credential |
| WebSocket | `/sessions/{session_id}/live` | push transcript, state, and control events |

### Transcript and Reports

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sessions/{session_id}/transcript-turns` | save transcript turn |
| GET | `/sessions/{session_id}/transcript` | retrieve transcript |
| POST | `/sessions/{session_id}/reports` | generate report |
| GET | `/reports/{report_id}` | retrieve report |
| PATCH | `/reports/{report_id}/review` | faculty review/edit status |

---

## 13. Control Flow Diagrams

### Session Start

```mermaid
sequenceDiagram
    participant I as Instructor
    participant D as Dashboard
    participant API as Backend
    participant DB as PostgreSQL
    participant R as Redis

    I->>D: Select scenario
    D->>API: POST /sessions
    API->>DB: Create session
    API->>R: Initialize patient state
    API-->>D: Session ID and initial state
    I->>D: Start session
    D->>API: POST /sessions/{id}/start
    API->>DB: Mark started
    API->>R: Set status active
    API-->>D: Session active
```

### State Cue During Live Scenario

```mermaid
flowchart TD
    A[Instructor clicks cue] --> B[Backend validates role and active session]
    B --> C[Apply state transition]
    C --> D[Persist state event]
    D --> E[Update Redis live state]
    E --> F[Broadcast over WebSocket]
    F --> G[Dashboard updates current state]
    F --> H[Voice room updates Realtime context]
    H --> I[Next AI response reflects latest state]
```

### Report Generation

```mermaid
flowchart TD
    A[Instructor ends session] --> B[Backend locks transcript and event timeline]
    B --> C[Report generator loads scenario objectives]
    C --> D[Analyze transcript for checklist items]
    D --> E[Summarize communication and key events]
    E --> F[Generate debrief prompts]
    F --> G[Save draft report]
    G --> H[Faculty reviews report]
    H --> I[Report marked reviewed]
```

---

## 14. Security and Privacy Design

### Security/Data Access Flow

```mermaid
flowchart LR
    User[Instructor/Admin] --> Auth[Login + Session Cookie]
    Auth --> RBAC[Role-Based Access Check]
    RBAC --> API[FastAPI Endpoints]
    API --> Audit[Audit Log]
    API --> DB[(Encrypted PostgreSQL)]
    API --> Redis[(Redis Live State)]
    API --> Secrets[Secrets Manager]
    API --> Token[Realtime Ephemeral Token]
    Token --> Browser[Voice Room Browser]
    Browser --> OpenAI[OpenAI Realtime]
```

### Access Rules

| Role | Permissions |
|---|---|
| Admin | manage users, scenarios, reports, audit review |
| Instructor | run sessions, cue state, view reports for own sessions |
| Observer | view approved reports and limited session summaries |

### Required Safeguards

- Password or SSO-based login.
- HTTP-only secure cookies for web sessions.
- Role checks on every protected endpoint.
- OpenAI API key stored only in backend secrets manager.
- Browser receives only short-lived Realtime client credentials.
- Audit log for login, session start/end, state events, report generation, report review, and data export.
- Transcript and reports stored encrypted at rest.
- Data retention policy configured by institution.
- Faculty review required before report is used as feedback.
- Fictional patient data only.

---

## 15. AI Safety and Guardrails

### Patient Role Rules

The AI must:

- speak in first person as the patient
- answer only from the patient perspective
- follow current patient state
- keep responses short during severe distress
- reveal hidden information only after appropriate student questions
- stop when paused, muted, or takeover is active

The AI must not:

- act as nurse, physician, evaluator, or instructor
- give treatment orders
- tell students the correct intervention
- diagnose itself unless scenario rules allow it
- grade student performance
- invent unsupported patient history

### Guardrail Strategy

- Scenario prompt contains explicit role, limits, and allowed disclosures.
- Backend sends current state context with every session update.
- Dashboard safety controls override AI behavior.
- Reports label AI output as debrief support, not official grading.
- Faculty can review scenario prompts before use.

---

## 16. Report Generation Design

The report generator uses transcript turns, state events, scenario objectives, and instructor notes.

### Report Sections

| Section | Source |
|---|---|
| Session metadata | session record |
| Timeline | state events and control events |
| Transcript | transcript turns |
| Assessment checklist | scenario objectives + transcript classification |
| Communication observations | transcript summary |
| Debrief prompts | scenario objectives + transcript/event summary |
| Instructor notes | dashboard notes |
| Faculty review status | report review workflow |

### Report Rules

- Reports are generated as drafts.
- Faculty must review before use with students.
- Checklist items are marked as "observed", "not observed", or "unclear."
- The report never assigns final grades.
- The report keeps student feedback separate from system/debug logs.

---

## 17. Testing and Validation Plan

### Unit Tests

- Patient state transition validation.
- Role-based access checks.
- Scenario/persona loading.
- Report checklist classification.
- Audit log creation.
- Pause/takeover behavior.

### Integration Tests

- Create, start, pause, resume, takeover, and end session.
- Instructor cue updates Redis, PostgreSQL, dashboard, and voice room.
- Transcript turns persist in correct order.
- Report generation uses transcript and state events.
- Unauthorized users cannot access sessions or reports.

### Voice and Realtime Tests

- Realtime credential requires active authorized session.
- OpenAI API key is never exposed to browser.
- Voice room receives current state before conversation starts.
- State change during live session affects the next patient response.
- Pause and takeover prevent AI responses.

### Scenario Acceptance Tests

| Scenario Event | Expected AI Behavior |
|---|---|
| Initial COPD/SOB start | anxious, breathless, cooperative |
| SpO2 dropped | more breathless, shorter answers |
| HR increased | reports heart racing or panic |
| Oxygen applied | partial improvement only after instructor cue |
| Bronchodilator given | gradual improvement only after instructor cue |
| Student asks for diagnosis too early | patient does not reveal diagnosis |
| Instructor takeover | AI stops responding |

---

## 18. Production Rollout Checklist

### Before Pilot

- Faculty approves COPD/SOB scenario and persona.
- Instructor dashboard tested in simulated workflow.
- Voice latency tested in lab network.
- Microphone and speaker routing tested.
- Consent language reviewed.
- Data retention policy selected.
- Admin and instructor accounts created.

### Before Production Use

- TLS enabled.
- Database backups configured.
- Secrets stored outside source code.
- Audit logs enabled.
- Role access tested.
- Report review workflow enabled.
- Incident response contact identified.
- Faculty trained on pause/takeover controls.

### Operational Monitoring

- API uptime.
- WebSocket connection health.
- Realtime session errors.
- Report generation failures.
- Failed login attempts.
- Audit log completeness.
- Database backup success.

---

## 19. Acceptance Criteria

The implementation is complete when:

- Instructor can start a COPD/SOB simulation session.
- Voice room can connect to OpenAI Realtime with backend-created short-lived credentials.
- Students can speak to the AI patient and hear patient-role responses.
- Instructor can cue live state changes from the dashboard.
- AI responses reflect updated state on the next turn.
- Pause, mute, takeover, resume, and end session controls work.
- Transcript and event timeline are saved.
- Draft report is generated after session end.
- Faculty review status is tracked.
- Admin/instructor access controls are enforced.
- Audit logs capture sensitive actions.
- No OpenAI API key or secret is exposed to the browser.
- No direct Laerdal integration exists or is required.

---

## 20. References

- OpenAI Voice Agents guide: https://developers.openai.com/api/docs/guides/voice-agents
- OpenAI Realtime guide: https://developers.openai.com/api/docs/guides/realtime
- OpenAI Realtime API reference: https://developers.openai.com/api/reference/resources/realtime

