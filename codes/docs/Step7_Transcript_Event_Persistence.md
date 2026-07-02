# Step 7: Transcript and Event Timeline Persistence

Date: July 1, 2026

## Why This Document Was Added

Step 7 is needed because the app now has meaningful simulation activity:

```text
student messages
AI patient responses
instructor cues
patient state changes
automatic patient reactions
```

At the end of Step 6.9, those interactions work during the live session, but they are not yet stored as a durable session record. Step 7 turns the demo from a live-only chatbot into a simulation record system that can support debriefing and final reports.

## Step 7 Goal

Store a session transcript and event timeline so the instructor can review what happened during and after the simulation.

The system should record:

- student questions
- AI patient responses
- automatic patient responses after instructor cues
- timestamps
- speaker labels
- instructor cue events
- state snapshots after cues
- session lifecycle events

## Product Value

Step 7 is valuable because simulation education depends on debriefing.

For the July 25 demo, this enables:

```text
Instructor runs scenario
Students interact with patient
Instructor applies cues
System records transcript and events
Instructor reviews the timeline after the session
```

For a future sellable product, this becomes the foundation for:

- debrief reports
- faculty review
- performance evidence
- audit trails
- quality improvement
- scenario analytics

## Scope

Step 7 will build:

- session model
- transcript message model
- event timeline model
- persistence service
- backend APIs to read transcript and events
- frontend display of persisted transcript and event timeline
- storage of `/chat` messages
- storage of instructor cue events
- storage of automatic patient responses
- basic session start/end lifecycle

Step 7 will not build:

- final debrief report generation
- grading or scoring
- authentication
- role-based access
- multi-user collaboration
- voice transcript from live audio
- direct SimCapture import
- direct Laerdal/LLEAP integration

## Important Product Boundary

The app still remains instructor-cued only.

```text
Laerdal/LLEAP/SimCapture state is not read automatically.
Instructor changes patient state in this dashboard.
This app records only what happens inside this AI patient persona system.
```

## Existing Starting Point

Current working behavior:

```text
Student sends chat message
Backend returns AI patient response
Instructor clicks cue button
Backend updates patient state
Backend returns automatic patient response
Frontend displays conversation and current state
```

Current limitation:

```text
Messages and events are visible only in memory during the running app.
If the server restarts or the page reloads, the historical record can be lost.
```

## Target Flow

```mermaid
flowchart TD
    A[Session starts] --> B[Create session record]
    B --> C[Student sends message]
    C --> D[Save student transcript message]
    D --> E[Generate AI patient reply]
    E --> F[Save patient transcript message]
    F --> G[Display transcript]
    G --> H{Instructor cue?}
    H -->|Yes| I[Update patient state]
    I --> J[Save timeline event]
    J --> K[Generate auto patient message]
    K --> L[Save auto patient transcript message]
    L --> G
    H -->|No| C
    G --> M[Session ends]
    M --> N[Session record remains available]
```

## Persistence Strategy

For the July demo and future product direction, use PostgreSQL through a normal backend database abstraction.

Recommended approach:

```text
PostgreSQL + SQLAlchemy models + existing DATABASE_URL setting
```

Local development:

```text
Run PostgreSQL locally and connect through DATABASE_URL.
```

Production direction:

```text
Use managed or private-cloud PostgreSQL for deployed or multi-user use.
```

Why this approach:

- the existing backend already has `DATABASE_URL`
- PostgreSQL keeps the internship demo aligned with the production data model
- SQLAlchemy keeps database access organized while still using PostgreSQL from the start
- transcript/report features need structured queries later
- future multi-session, reporting, audit, and analytics features will fit PostgreSQL better than a local file database

Why not SQLite:

- The project is intended to grow beyond an internship prototype.
- Transcript and event data are core product records, not temporary demo-only data.
- PostgreSQL avoids a later database migration from SQLite assumptions.
- PostgreSQL is better suited for concurrent users, deployed environments, reporting queries, and production backup/retention workflows.

## Data Entities

### Session

Purpose:

Represent one simulation run.

Fields:

```text
session_id
scenario_id
status
started_at
ended_at
created_at
updated_at
```

Recommended statuses:

```text
active
paused
takeover
ended
```

### Transcript Message

Purpose:

Store every conversational message shown in the chat.

Fields:

```text
message_id
session_id
timestamp
speaker
message_type
text
source
cue_id
state_event_id
```

Speaker values:

```text
student
patient
system
instructor
```

Message type values:

```text
student_question
patient_reply
auto_patient_reaction
system_note
```

Source values:

```text
manual
openai
mock_fallback
system
```

### Timeline Event

Purpose:

Store important simulation events.

Fields:

```text
event_id
session_id
timestamp
event_type
label
cue_id
state_snapshot_json
metadata_json
```

Event type values:

```text
session_started
student_message
patient_response
instructor_cue
auto_patient_response
pause
resume
takeover_started
takeover_ended
intervention
session_ended
```

## Data Relationship

```mermaid
erDiagram
    SESSION ||--o{ TRANSCRIPT_MESSAGE : contains
    SESSION ||--o{ TIMELINE_EVENT : contains
    TIMELINE_EVENT ||--o{ TRANSCRIPT_MESSAGE : may_trigger

    SESSION {
        string session_id PK
        string scenario_id
        string status
        datetime started_at
        datetime ended_at
        datetime created_at
        datetime updated_at
    }

    TRANSCRIPT_MESSAGE {
        string message_id PK
        string session_id FK
        datetime timestamp
        string speaker
        string message_type
        text text
        string source
        string cue_id
        string state_event_id
    }

    TIMELINE_EVENT {
        string event_id PK
        string session_id FK
        datetime timestamp
        string event_type
        string label
        string cue_id
        json state_snapshot_json
        json metadata_json
    }
```

## API Design

### Start or Get Active Session

```text
POST /sessions/start
```

Purpose:

Create a session record if no active session exists.

Response:

```json
{
  "session_id": "session-...",
  "scenario_id": "copd-sob",
  "status": "active",
  "started_at": "2026-07-01T..."
}
```

### End Session

```text
POST /sessions/{session_id}/end
```

Purpose:

Mark the session as ended.

### Get Transcript

```text
GET /sessions/{session_id}/transcript
```

Purpose:

Return ordered transcript messages for debrief review.

### Get Event Timeline

```text
GET /sessions/{session_id}/events
```

Purpose:

Return ordered timeline events.

### Current Session Shortcut

For the July demo, a shortcut endpoint can be useful:

```text
GET /sessions/current
```

Purpose:

Let the frontend load the current active session without login or multi-user complexity.

## Backend File Plan

New files:

```text
codes/backend/app/db/__init__.py
codes/backend/app/db/session.py
codes/backend/app/models/__init__.py
codes/backend/app/models/session.py
codes/backend/app/models/transcript.py
codes/backend/app/models/timeline.py
codes/backend/app/schemas/session.py
codes/backend/app/services/session_service.py
codes/backend/app/services/transcript_service.py
codes/backend/app/services/timeline_service.py
codes/backend/app/api/sessions.py
```

Modified files:

```text
codes/backend/app/core/config.py
codes/backend/.env.example
codes/backend/app/api/chat.py
codes/backend/app/api/state.py
codes/backend/app/main.py
codes/backend/requirements.txt
codes/docs/Step7_Transcript_Event_Persistence.md
Progress_Report.md
```

## Frontend File Plan

New files:

```text
codes/frontend/src/api/sessions.ts
```

Modified files:

```text
codes/frontend/src/pages/Dashboard.tsx
codes/frontend/src/pages/Chat.tsx
codes/frontend/src/api/chat.ts
codes/frontend/src/api/state.ts
```

## File Responsibilities

### `db/session.py`

Purpose:

Create the database engine and session dependency.

Responsibilities:

- read `DATABASE_URL`
- create SQLAlchemy engine
- provide database sessions to API routes and services

### `models/session.py`

Purpose:

Define the database table for simulation sessions.

### `models/transcript.py`

Purpose:

Define the database table for chat transcript messages.

### `models/timeline.py`

Purpose:

Define the database table for simulation events.

### `services/session_service.py`

Purpose:

Create, retrieve, and end simulation sessions.

### `services/transcript_service.py`

Purpose:

Save and read ordered transcript messages.

### `services/timeline_service.py`

Purpose:

Save and read ordered timeline events.

### `api/sessions.py`

Purpose:

Expose session, transcript, and event APIs to the frontend.

## Integration Points

### Chat Route

Current behavior:

```text
POST /chat returns patient reply
```

Step 7 behavior:

```text
POST /chat
    save student message
    generate patient reply
    save patient reply
    return patient reply
```

### State Cue Route

Current behavior:

```text
POST /state/cues/{cue_id}
    update patient state
    generate auto patient message
    return state + auto_patient_message
```

Step 7 behavior:

```text
POST /state/cues/{cue_id}
    update patient state
    save instructor cue timeline event
    generate auto patient message
    save auto patient message in transcript
    save auto patient response timeline event
    return state + auto_patient_message
```

### Reset Route

Current behavior:

```text
POST /state/reset
```

Step 7 behavior:

```text
POST /state/reset
    reset current patient state
    create or restart active session
    save session_started or state_reset event
```

## Dashboard Design

The dashboard should show:

- current patient state
- instructor controls
- patient conversation transcript
- event timeline
- session status
- start/end session controls

Recommended layout for July demo:

```text
Header:
  Scenario name, session status, start/end/reset buttons

Left:
  Patient conversation transcript

Right:
  Current patient state
  Instructor cue buttons

Bottom:
  Event timeline
```

## Display Rules

Transcript should display:

```text
timestamp
speaker label
message text
message source when useful for debugging
```

Event timeline should display:

```text
timestamp
event label
cue label if present
important state values after cue
```

For the demo, avoid showing technical IDs in the main UI unless needed.

## Step 7 Substeps

### 7.1 Create Step 7 documentation

Create this planning document.

### 7.2 Add database dependency and database session foundation

Add PostgreSQL driver support, SQLAlchemy support, and create the backend database session helper.

Status:

```text
Completed
```

Files created:

```text
codes/backend/app/db/__init__.py
codes/backend/app/db/session.py
```

Files changed:

```text
codes/backend/requirements.txt
codes/backend/app/core/config.py
codes/backend/.env.example
codes/docs/Step7_Transcript_Event_Persistence.md
Progress_Report.md
```

What changed:

```text
requirements.txt:
Added SQLAlchemy==2.0.36.
Added psycopg[binary]==3.3.4.

config.py:
Confirmed DATABASE_URL is part of backend settings.
Set the default local database URL to PostgreSQL through the psycopg SQLAlchemy driver.

.env.example:
Updated DATABASE_URL example to use postgresql+psycopg.

db/__init__.py:
Created a database package for Step 7 persistence code.

db/session.py:
Created SQLAlchemy Base.
Created lazy engine factory.
Created lazy session factory.
Created FastAPI-compatible get_db dependency.
Created create_database_tables helper for future model table creation.
Added URL normalization so older postgresql:// URLs are converted to postgresql+psycopg://.
```

Why:

- Step 7 needs a real persistence foundation before session, transcript, and timeline tables can be added.
- SQLAlchemy gives a clean ORM layer and keeps the project ready for PostgreSQL.
- `psycopg` is the PostgreSQL driver used by SQLAlchemy.
- A shared `Base` lets future model files register tables consistently.
- A shared `get_db` dependency gives future API routes a safe way to open and close database sessions.
- Lazy engine/session creation prevents app import from immediately connecting to the database.
- URL normalization protects older local `.env` values that may still use `postgresql://`.

How it works:

```text
Future route or service asks FastAPI for get_db.
get_db reads DATABASE_URL from backend settings.
get_db gets a SQLAlchemy session factory for that URL.
The session is yielded to the route/service.
When the request finishes, the session closes automatically.
```

Important boundary:

```text
Step 7.2 does not create transcript tables yet.
Step 7.2 does not save chat messages yet.
Step 7.2 does not change /chat or /state behavior yet.
```

Verification:

```text
Installed SQLAlchemy 2.0.36 in codes/backend/.venv.
Installed psycopg 3.3.4 and psycopg-binary 3.3.4 in codes/backend/.venv.
Backend compile check passed.
SQLAlchemy SQLite smoke test passed for isolated engine/session behavior.
PostgreSQL URL normalization test passed and selected driver=psycopg.
```

### 7.3 Define persistence models

Create database models for:

- session
- transcript message
- timeline event

Status:

```text
Completed
```

Files created:

```text
codes/backend/app/models/__init__.py
codes/backend/app/models/session.py
codes/backend/app/models/transcript.py
codes/backend/app/models/timeline.py
```

File changed:

```text
codes/backend/app/db/session.py
```

What changed:

```text
models/__init__.py:
Created the app.models package and imported all persistence models so SQLAlchemy metadata can register them.

models/session.py:
Created SimulationSession model for the sessions table.
Fields: session_id, scenario_id, status, started_at, ended_at, created_at, updated_at.
Added relationships to transcript_messages and timeline_events.

models/transcript.py:
Created TranscriptMessage model for the transcript_messages table.
Fields: message_id, session_id, timestamp, speaker, message_type, text, source, cue_id, state_event_id.
Added relationship back to SimulationSession.
Added optional relationship to TimelineEvent through state_event_id.

models/timeline.py:
Created TimelineEvent model for the timeline_events table.
Fields: event_id, session_id, timestamp, event_type, label, cue_id, state_snapshot_json, metadata_json.
Added relationship back to SimulationSession.
Added relationship to transcript messages that are connected to a timeline event.

db/session.py:
Updated create_database_tables() so it imports app.models before calling Base.metadata.create_all().
```

Why:

- Step 7 needs database table definitions before services and APIs can save records.
- The session table represents one simulation run.
- The transcript table stores what was said during the simulation.
- The timeline table stores instructor cues, lifecycle events, and state snapshots.
- Relationships make it possible to retrieve all messages and events for one session later.
- Importing `app.models` before table creation ensures SQLAlchemy metadata knows about all model classes.

How it works:

```text
SimulationSession is the parent record.
TranscriptMessage rows belong to one SimulationSession.
TimelineEvent rows belong to one SimulationSession.
TranscriptMessage can optionally point to a TimelineEvent when a patient message was caused by an instructor cue.
```

Important implementation note:

```text
Nullable database columns are marked with nullable=True in mapped_column().
The model annotations avoid Python 3.14 nullable union syntax because SQLAlchemy 2.0.36 had trouble parsing it during mapper registration.
```

Verification:

```text
Backend compile check passed.
SQLAlchemy metadata registered these tables:
sessions
timeline_events
transcript_messages

In-memory SQLite smoke test created all three tables.
Health endpoint still returned 200 ok.
```

What was not changed:

```text
No session service was created yet.
No transcript service was created yet.
No timeline service was created yet.
No API route was changed.
No chat messages are being saved yet.
No instructor cues are being saved yet.
No real PostgreSQL tables were created yet.
```

### 7.4 Define session/transcript/timeline schemas

Create Pydantic schemas for API responses.

Status:

```text
Completed
```

File created:

```text
codes/backend/app/schemas/session.py
```

What changed:

```text
Added Literal types for persisted session status, transcript speaker, transcript message type, transcript source, and timeline event type.

Added session schemas:
SessionStartRequest
SessionResponse
CurrentSessionResponse

Added transcript schemas:
TranscriptMessageCreate
TranscriptMessageResponse
TranscriptResponse

Added timeline schemas:
TimelineEventCreate
TimelineEventResponse
TimelineResponse
```

Why:

- Step 7.3 created database models, but API routes should not expose raw SQLAlchemy models directly.
- Pydantic schemas define the clean request and response contracts for future session, transcript, and event endpoints.
- Literal types prevent invalid speaker labels, message types, sources, event types, and session statuses from silently entering the API layer.
- `ConfigDict(from_attributes=True)` allows response schemas to be built from SQLAlchemy model objects in later service/API steps.

How it works:

```text
Services will create or read SQLAlchemy model objects.
API routes will convert those objects into Pydantic response schemas.
Frontend code will receive predictable JSON fields.
```

Important schema groups:

```text
SessionResponse:
Represents one simulation session.

TranscriptMessageResponse:
Represents one persisted chat/transcript message.

TimelineEventResponse:
Represents one persisted simulation event.

TranscriptResponse:
Wraps all transcript messages for one session.

TimelineResponse:
Wraps all timeline events for one session.
```

Verification:

```text
Backend compile check passed.
Sample SessionResponse validation passed.
Sample TranscriptMessageResponse validation passed.
Sample TimelineEventResponse validation passed.
Health endpoint still returned 200 ok.
```

What was not changed:

```text
No database service was created yet.
No session API route was created yet.
No /chat behavior was changed.
No /state behavior was changed.
No transcript or timeline records are saved yet.
```

### 7.5 Create session service

Add functions to:

- create active session
- get active session
- end session

Status:

```text
Completed
```

File created:

```text
codes/backend/app/services/session_service.py
```

What changed:

```text
Added ACTIVE_SESSION_STATUSES.
Added SessionNotFoundError.
Added start_session().
Added get_active_session().
Added get_session_by_id().
Added end_session().
```

Why:

- Step 7 needs a single backend service responsible for session lifecycle rules.
- API routes should not directly decide how sessions are created, reused, or ended.
- Services make the next API step cleaner and easier to test.
- The July demo should use one active session at a time to avoid confusing transcript and timeline data.

How it works:

```text
start_session(db, scenario_id):
Checks whether an active session already exists.
If yes, returns that active session.
If no, creates a new SimulationSession with status=active.

get_active_session(db):
Finds the newest session whose status is active, paused, or takeover.

get_session_by_id(db, session_id):
Looks up one session by primary key.

end_session(db, session_id):
Finds the session.
If missing, raises SessionNotFoundError.
If already ended, returns it unchanged.
Otherwise sets status=ended and ended_at=current UTC time.
```

Design decision:

```text
Only one active local session is supported for the July demo.
```

Reason:

- It keeps the instructor workflow simple.
- It avoids mixing transcript data across multiple sessions.
- It is enough for the current single-scenario COPD/SOB demo.
- The model structure still supports multiple sessions later.

Verification:

```text
Backend compile check passed.
In-memory database smoke test passed.
start_session() created an active session.
Calling start_session() again reused the same active session.
get_active_session() returned the active session.
end_session() marked the session ended and added ended_at.
Calling start_session() after ending created a new active session.
Health endpoint still returned 200 ok.
```

What was not changed:

```text
No sessions API route was added yet.
No frontend code was changed.
No transcript records are saved yet.
No timeline records are saved yet.
No /chat behavior was changed.
No /state behavior was changed.
No real PostgreSQL tables were created yet.
```

### 7.6 Create transcript service

Add functions to:

- save transcript message
- list transcript messages

Status:

```text
Completed
```

File created:

```text
codes/backend/app/services/transcript_service.py
```

What changed:

```text
Added save_transcript_message().
Added list_transcript_messages().
Added _ensure_session_exists().
```

Why:

- Step 7 needs a service dedicated to saving and reading transcript messages.
- The `/chat` route should later call this service instead of writing database logic directly.
- Transcript records must belong to a valid session so future reports do not contain orphaned messages.
- Keeping transcript persistence in one service makes later testing and API routing simpler.

How it works:

```text
save_transcript_message(db, message):
Checks that message.session_id exists.
Creates a TranscriptMessage row with a msg-* ID.
Saves speaker, message_type, text, source, cue_id, and state_event_id.
Commits and refreshes the row.
Returns the saved TranscriptMessage model.

list_transcript_messages(db, session_id):
Checks that the session exists.
Returns transcript messages for that session ordered by timestamp and message_id.

_ensure_session_exists(db, session_id):
Raises SessionNotFoundError if the session does not exist.
```

Design decision:

```text
The transcript service validates the session before saving or listing messages.
```

Reason:

- Prevents transcript messages from being stored without a session.
- Makes future API error handling clear.
- Protects final report generation from incomplete or disconnected records.

Verification:

```text
Backend compile check passed.
In-memory database smoke test passed.
Created a session.
Saved one student transcript message.
Saved one patient transcript message.
Listed two transcript messages in student -> patient order.
Missing session lookup raised SessionNotFoundError.
Health endpoint still returned 200 ok.
```

What was not changed:

```text
No transcript API route was added yet.
No /chat behavior was changed yet.
No frontend code was changed.
No automatic transcript persistence happens from user actions yet.
No real PostgreSQL rows were created.
```

### 7.7 Create timeline service

Add functions to:

- save timeline event
- list timeline events

Status:

```text
Completed
```

File created:

```text
codes/backend/app/services/timeline_service.py
```

What changed:

```text
Added save_timeline_event().
Added list_timeline_events().
Added _ensure_session_exists().
```

Why:

- Step 7 needs a service dedicated to saving and reading timeline events.
- The future `/state/cues/{cue_id}` persistence work should call this service instead of writing database logic directly.
- Timeline records must belong to a valid session so the event history can be reviewed and reported correctly.
- Keeping timeline persistence in one service makes later API routing and testing simpler.

How it works:

```text
save_timeline_event(db, event):
Checks that event.session_id exists.
Creates a TimelineEvent row with an event-* ID.
Saves event_type, label, cue_id, state_snapshot_json, and metadata_json.
Commits and refreshes the row.
Returns the saved TimelineEvent model.

list_timeline_events(db, session_id):
Checks that the session exists.
Returns timeline events for that session ordered by timestamp and event_id.

_ensure_session_exists(db, session_id):
Raises SessionNotFoundError if the session does not exist.
```

Design decision:

```text
The timeline service validates the session before saving or listing events.
```

Reason:

- Prevents orphan timeline events.
- Makes future API error handling clear.
- Protects final debrief reports from disconnected event records.

Verification:

```text
Backend compile check passed.
In-memory database smoke test passed.
Created a session.
Saved one session_started timeline event.
Saved one instructor_cue timeline event with cue_id and state snapshot.
Listed two timeline events in expected order.
Missing session lookup raised SessionNotFoundError.
Health endpoint still returned 200 ok.
```

What was not changed:

```text
No timeline API route was added yet.
No /state behavior was changed yet.
No frontend code was changed.
No automatic event persistence happens from user actions yet.
No real PostgreSQL rows were created.
```

### 7.8 Add sessions API route

Expose:

```text
POST /sessions/start
GET /sessions/current
POST /sessions/{session_id}/end
GET /sessions/{session_id}/transcript
GET /sessions/{session_id}/events
```

Status:

```text
Completed
```

File created:

```text
codes/backend/app/api/sessions.py
```

File changed:

```text
codes/backend/app/main.py
```

What changed:

```text
api/sessions.py:
Added sessions router with prefix /sessions.
Added POST /sessions/start.
Added GET /sessions/current.
Added POST /sessions/{session_id}/end.
Added GET /sessions/{session_id}/transcript.
Added GET /sessions/{session_id}/events.

main.py:
Registered the sessions router with the FastAPI app.
```

Why:

- Step 7 services are now ready, but the frontend cannot use them until backend routes expose them.
- Session APIs give the frontend a way to start, end, and read the active session.
- Transcript and event APIs give the frontend a future way to load persisted records.
- API routes translate service-layer `SessionNotFoundError` into HTTP 404 responses.

How it works:

```text
POST /sessions/start:
Starts a session or reuses the existing active session.
Accepts optional body: {"scenario_id": "copd-sob"}.

GET /sessions/current:
Returns the current active session or null.

POST /sessions/{session_id}/end:
Marks a session ended.
Returns 404 if the session does not exist.

GET /sessions/{session_id}/transcript:
Returns transcript messages for the session.
Returns 404 if the session does not exist.

GET /sessions/{session_id}/events:
Returns timeline events for the session.
Returns 404 if the session does not exist.
```

Important boundary:

```text
Step 7.8 exposes APIs for sessions, transcript reading, and event reading.
It does not yet connect /chat to transcript saving.
It does not yet connect /state/cues/{cue_id} to event saving.
```

Verification:

```text
Backend compile check passed.
Health endpoint still returned 200 ok.
Route-level test used a temporary SQLite database override.
POST /sessions/start returned 200 and status=active.
GET /sessions/current returned the active session.
GET /sessions/{session_id}/transcript returned 200 with an empty messages list.
GET /sessions/{session_id}/events returned 200 with an empty events list.
POST /sessions/{session_id}/end returned 200 and status=ended.
GET /sessions/missing-session/transcript returned 404.
```

What was not changed:

```text
No frontend code was changed.
No /chat behavior was changed yet.
No /state behavior was changed yet.
No automatic transcript persistence happens yet.
No automatic event persistence happens yet.
No real PostgreSQL rows were created during verification.
```

### 7.9 Connect `/chat` to transcript persistence

Save:

- student message before AI response
- patient reply after AI response

Status:

```text
Completed
```

File changed:

```text
codes/backend/app/api/chat.py
```

What changed:

```text
Added database dependency to POST /chat.
Started or reused the active simulation session before generating the patient reply.
Saved the student message as a transcript message before generating the patient reply.
Saved the patient reply as a transcript message after generation.
Kept the existing /chat request and response shape unchanged.
```

Why:

- Transcript persistence is only useful if normal chat messages are saved automatically.
- Saving the student message before the AI response preserves what the learner asked, even if patient generation later fails in a future version.
- Saving the patient response after generation preserves what the AI patient said for debrief and reporting.
- Keeping the response shape unchanged avoids frontend churn.

How it works:

```text
POST /chat receives student message.
Backend loads COPD/SOB scenario.
Backend starts or reuses the active session.
Backend saves student transcript message:
  speaker=student
  message_type=student_question
  source=manual
Backend reads current patient state.
Backend generates patient persona response.
Backend saves patient transcript message:
  speaker=patient
  message_type=patient_reply
  source=openai or mock_fallback
Backend returns the existing ChatResponse.
```

Important boundary:

```text
Step 7.9 only persists chat transcript messages.
It does not persist instructor cues yet.
It does not persist automatic patient reactions after state cues yet.
That comes in Step 7.10.
```

Verification:

```text
Backend compile check passed.
Health endpoint still returned 200 ok.
Route-level test used a temporary SQLite database override.
POST /chat returned status 200.
POST /chat response still contained reply, scenario_id, and speaker.
GET /sessions/current returned an active session.
GET /sessions/{session_id}/transcript returned two messages.
Transcript message speakers were student then patient.
Transcript message types were student_question then patient_reply.
Transcript message sources were manual then mock_fallback in fallback-mode verification.
```

What was not changed:

```text
No frontend code was changed.
No /chat response shape was changed.
No /state behavior was changed yet.
No timeline events are saved from /chat yet.
No instructor cue persistence was added yet.
No real PostgreSQL rows were created during verification.
```

### 7.10 Connect state cues to timeline and transcript persistence

Save:

- instructor cue event
- state snapshot
- automatic patient response

Status:

```text
Completed
```

Files changed:

```text
codes/backend/app/api/state.py
codes/backend/app/services/auto_patient_message.py
```

What changed:

```text
state.py:
Added database dependency to POST /state/cues/{cue_id}.
Started or reused the active simulation session.
Saved an instructor_cue timeline event after the patient state changed.
Saved the updated patient state as state_snapshot_json.
Generated the automatic patient response.
Saved the automatic patient response as a transcript message.
Saved an auto_patient_response timeline event.
Kept the existing PatientStateResponse shape usable by the frontend.

auto_patient_message.py:
Added AutoPatientMessageResult.
Added build_auto_patient_message_result().
Kept build_auto_patient_message() available for compatibility.
The route can now persist the internal response source while returning the same auto patient message object to the frontend.
```

Why:

- Instructor cues are important simulation events and must appear in the persisted timeline.
- Updated patient state should be saved with the cue so debrief reports can show what changed.
- Automatic patient reactions after cues should be saved in the transcript because they are part of what learners experienced.
- The backend needs the internal response source (`openai` or `mock_fallback`) for transcript accuracy.

How it works:

```text
Instructor clicks a cue button.
POST /state/cues/{cue_id} applies the patient state update.
Backend starts or reuses the active session.
Backend saves timeline event:
  event_type=instructor_cue
  cue_id={cue_id}
  state_snapshot_json={updated patient state}
Backend generates automatic patient message.
Backend saves transcript message:
  speaker=patient
  message_type=auto_patient_reaction
  source=openai or mock_fallback
  cue_id={cue_id}
  state_event_id={instructor cue event id}
Backend saves second timeline event:
  event_type=auto_patient_response
  cue_id={cue_id}
  metadata_json includes message_id and source
Backend returns the existing state + auto_patient_message response.
```

Important boundary:

```text
Step 7.10 persists instructor cues and automatic patient reactions.
It does not persist state reset yet.
It does not change frontend behavior yet.
It does not add report generation yet.
```

Verification:

```text
Backend compile check passed.
Health endpoint still returned 200 ok.
Route-level test used a temporary SQLite database override.
POST /state/cues/spo2_dropped returned 200.
Response still included updated state and auto_patient_message.
GET /sessions/current returned an active session.
GET /sessions/{session_id}/transcript returned one auto_patient_reaction message.
Saved transcript cue_id was spo2_dropped.
Saved transcript source was mock_fallback in fallback-mode verification.
GET /sessions/{session_id}/events returned two events:
instructor_cue
auto_patient_response
Transcript state_event_id matched the instructor_cue event_id.
Saved state snapshot included SpO2=88.
```

What was not changed:

```text
No frontend code was changed.
No /state response shape was intentionally changed.
No state reset persistence was added yet.
No report generation was added yet.
No real PostgreSQL rows were created during verification.
```

### 7.11 Connect frontend to persisted transcript and events

Load transcript and events from backend instead of relying only on local component state.

Status:

```text
Completed
```

File created:

```text
codes/frontend/src/api/sessions.ts
```

Files changed:

```text
codes/frontend/src/pages/Dashboard.tsx
codes/frontend/src/pages/Chat.tsx
```

What changed:

```text
sessions.ts:
Added frontend types for persisted sessions, transcript messages, and timeline events.
Added startSession().
Added getCurrentSession().
Added getSessionTranscript().
Added getSessionEvents().

Dashboard.tsx:
Starts or reuses a persisted session when the dashboard loads.
Loads persisted transcript messages from GET /sessions/{session_id}/transcript.
Loads persisted timeline events from GET /sessions/{session_id}/events.
Refreshes persisted transcript and timeline after a student chat message is sent.
Refreshes persisted transcript and timeline after an instructor cue is applied.
Displays persisted timeline events instead of the older in-memory /state/events list.
Displays session record status in the header.

Chat.tsx:
Can accept persistedMessages from the dashboard.
Can notify the dashboard after a message is successfully sent.
Still supports standalone local chat behavior when persistedMessages is not provided.
Ignores autoPatientMessage when persistedMessages are used, preventing duplicate auto-reaction messages.
```

Why:

- Step 7.9 and Step 7.10 made the backend persist chat messages, cue events, and auto patient reactions.
- The dashboard should now read those persisted records instead of relying only on component-local state.
- Reloading the dashboard can show the persisted transcript and event timeline for the active session.
- Keeping standalone `Chat` behavior intact prevents breaking the older direct chat page.

How it works:

```text
Dashboard loads.
Dashboard calls GET /state.
Dashboard calls POST /sessions/start to create or reuse a persisted session.
Dashboard calls GET /sessions/{session_id}/transcript.
Dashboard calls GET /sessions/{session_id}/events.
Dashboard passes transcript messages into Chat as persistedMessages.
Chat displays those persisted messages.
When the student sends a message, /chat persists the student and patient messages.
Chat calls onMessageSent().
Dashboard refetches transcript and events.
When the instructor clicks a cue, /state/cues/{cue_id} persists cue events and auto patient reaction.
Dashboard refetches transcript and events.
```

Important boundary:

```text
Step 7.11 connects the frontend to persisted backend records.
It does not add final reports.
It does not add authentication.
It does not add voice transcript storage.
It does not add database migration tooling.
```

Verification:

```text
Frontend production build passed.
Backend compile check passed.
Health endpoint still returned 200 ok.
TypeScript confirmed Chat only receives student/patient transcript messages.
```

Runtime note:

```text
The configured backend database must have the Step 7 tables before the live dashboard can use these persisted session endpoints.
Temporary database verification has already proven the API flow.
Real local database setup/table creation should be checked during Step 7.12 end-to-end verification.
```

### 7.12 Verify Step 7 end to end

Test:

```text
start session
send chat message
apply instructor cue
see auto patient response
reload page
confirm transcript remains visible
end session
confirm transcript/events remain available
```

Status:

```text
Completed
```

Date completed:

```text
July 2, 2026
```

What was done:

```text
Verified the complete Step 7 persistence flow using the real local PostgreSQL database configured by DATABASE_URL.
```

Local PostgreSQL setup completed:

```text
Created PostgreSQL role:
persona

Created PostgreSQL database:
persona_project

Created Step 7 tables through backend helper:
sessions
transcript_messages
timeline_events
```

Why:

- Step 7.11 connected the frontend to persisted records, but the real configured database needed to be verified.
- The backend `DATABASE_URL` expects the local `persona` role and `persona_project` database.
- End-to-end verification proves that session, transcript, and event persistence work outside temporary test databases.

Verification flow:

```text
1. Create database tables using create_database_tables().
2. POST /sessions/start.
3. POST /chat with a student question.
4. POST /state/cues/spo2_dropped.
5. GET /sessions/{session_id}/transcript.
6. GET /sessions/{session_id}/events.
7. POST /sessions/{session_id}/end.
8. GET transcript again after session end.
9. GET events again after session end.
```

Verification results:

```text
POST /sessions/start returned 200 and status=active.
POST /chat returned 200 with reply, scenario_id, and speaker.
POST /state/cues/spo2_dropped returned 200 with auto_patient_message.
Transcript returned 3 messages:
student_question
patient_reply
auto_patient_reaction

Timeline returned 2 events:
instructor_cue
auto_patient_response

POST /sessions/{session_id}/end returned 200 and status=ended.
Transcript remained available after session end.
Events remained available after session end.
```

Additional verification:

```text
Backend compile check passed.
Frontend production build passed.
Health endpoint returned 200 ok.
```

Important runtime note:

```text
The local PostgreSQL database now contains test records from Step 7.12 verification.
This is acceptable for local demo development.
Future production work should add migration tooling and admin-safe cleanup/retention policies.
```

What was not changed:

```text
No product code changed during Step 7.12.
No frontend behavior changed during Step 7.12.
No API key was printed or moved.
No voice_spike code was touched.
```

Step 7 final result:

```text
Step 7 is complete.
The app can persist and retrieve session transcript and event timeline records.
```

## Mermaid Sequence: Chat Persistence

```mermaid
sequenceDiagram
    participant Student
    participant Frontend
    participant Backend
    participant DB
    participant OpenAI

    Student->>Frontend: Send question
    Frontend->>Backend: POST /chat
    Backend->>DB: Save student transcript message
    Backend->>OpenAI: Generate patient reply
    OpenAI-->>Backend: Patient reply
    Backend->>DB: Save patient transcript message
    Backend-->>Frontend: Return patient reply
    Frontend->>Frontend: Display updated transcript
```

## Mermaid Sequence: Cue Persistence

```mermaid
sequenceDiagram
    participant Instructor
    participant Frontend
    participant Backend
    participant DB
    participant OpenAI

    Instructor->>Frontend: Click cue
    Frontend->>Backend: POST /state/cues/{cue_id}
    Backend->>Backend: Apply patient state update
    Backend->>DB: Save instructor cue timeline event
    Backend->>OpenAI: Generate automatic patient reaction
    OpenAI-->>Backend: Patient reaction
    Backend->>DB: Save auto patient transcript message
    Backend->>DB: Save auto patient response event
    Backend-->>Frontend: Return state + auto_patient_message
    Frontend->>Frontend: Update state, transcript, and event timeline
```

## Success Criteria

Step 7 is complete when:

- a session record can be started
- a session record can be ended
- student messages are saved
- AI patient replies are saved
- automatic patient reactions are saved
- instructor cue events are saved
- patient state snapshots after cues are saved
- transcript is visible during the session
- event timeline is visible during the session
- transcript remains available after page reload
- events remain available after page reload
- transcript and events remain available after session end
- no API keys or sensitive values are stored in transcript records

## Testing Plan

Backend tests:

```text
create session
get current session
save transcript message
list transcript messages
save timeline event
list timeline events
POST /chat saves student and patient messages
POST /state/cues/{cue_id} saves cue event and auto patient message
end session
```

Frontend tests/manual verification:

```text
open dashboard
start/reset session
send student message
confirm patient reply appears
click SpO2 dropped
confirm state changes
confirm automatic patient response appears
confirm event timeline updates
reload page
confirm transcript and timeline still appear
end session
confirm records are still readable
```

## Security and Privacy Notes

For the demo:

- do not store real patient information
- use fictional scenario data only
- do not store OpenAI API keys in database records
- do not expose backend `.env` values to frontend
- label reports as simulation/debrief support only

For production later:

- add authentication
- add role-based access
- encrypt sensitive data at rest if required
- define data retention policy
- add audit logs for access
- consider FERPA/HIPAA/privacy review depending on deployment context and data collected

## Risks

### Risk: Too much database work slows demo progress

Mitigation:

Keep Step 7 focused on three tables only:

```text
sessions
transcript_messages
timeline_events
```

### Risk: Transcript becomes inconsistent with UI

Mitigation:

Use backend persistence as source of truth after Step 7.

### Risk: OpenAI failure prevents transcript saving

Mitigation:

Save the student message before calling OpenAI and save mock fallback patient response if OpenAI fails.

### Risk: Multi-session complexity grows too early

Mitigation:

Support one active local session for the July demo, but design IDs and tables so multi-session support can be added later.

## Recommended Step 7 Implementation Order

```text
7.1 Documentation
7.2 Database foundation
7.3 Models
7.4 Schemas
7.5 Session service
7.6 Transcript service
7.7 Timeline service
7.8 Sessions API
7.9 Persist chat
7.10 Persist state cues and auto patient responses
7.11 Frontend transcript/event loading
7.12 End-to-end verification
```

## What To Avoid In Step 7

Do not add:

- final report generation
- authentication
- voice transcription
- Laerdal integration
- multi-scenario editor
- grading logic
- complex analytics

Those are later steps. Step 7 should make the simulation record reliable first.
