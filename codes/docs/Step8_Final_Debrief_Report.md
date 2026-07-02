# Step 8: Final Debrief Report

Date: July 2, 2026

## Why This Document Was Added

Step 7 completed the persistent session record:

```text
session metadata
student questions
AI patient replies
instructor cues
patient state snapshots
automatic patient reactions
event timeline
```

Step 8 uses that record to generate a final debrief-support report after the simulation session.

## Step 8 Goal

Generate a faculty-facing final report after a session ends.

The report should support nursing simulation debriefing by organizing what happened during the session. It should not grade students independently or replace faculty judgment.

## Product Value

For the July 25 internship demo, the report makes the project feel complete:

```text
Run scenario
Student interacts with AI patient
Instructor applies cues
System saves transcript and timeline
Instructor ends session
Instructor generates final debrief report
```

For a future sellable product, the final report becomes one of the strongest value features because simulation faculty need concise records for review, teaching, and documentation.

## Scope

Step 8 will build:

- report data schemas
- report generation service
- report API route
- dashboard report view
- report generated from persisted session data
- transcript section
- event timeline section
- assessment checklist section
- communication observations
- suggested debrief prompts
- clear faculty-judgment disclaimer

Step 8 will not build:

- independent student grading
- high-stakes clinical evaluation
- PDF export
- DOCX export
- email delivery
- authentication
- report sharing links
- voice transcript analysis
- Laerdal/SimCapture report import

## Important Safety Rule

The report must clearly state:

```text
This report is debrief support only. It does not replace faculty judgment.
```

The report may summarize and organize the session record, but it should avoid assigning grades, passing/failing learners, or making definitive clinical competency claims.

## Report Source Data

Step 8 should use persisted records from Step 7:

```text
sessions
transcript_messages
timeline_events
scenario JSON
assessment checklist from COPD/SOB scenario
```

The report should not rely on frontend-only state.

## Report Sections

### 1. Session Metadata

Include:

```text
session_id
scenario_id
scenario name
started_at
ended_at
session status
total transcript messages
total timeline events
```

### 2. Short Summary

Include a concise summary of the session:

```text
The session used the COPD/SOB scenario.
The learner interacted with the AI patient.
The instructor applied specific cues.
The patient condition changed based on instructor-controlled state updates.
```

Initial implementation should be deterministic, not AI-generated.

Reason:

- reliable for demo
- no hallucinated assessment
- easier to validate
- no extra OpenAI cost

### 3. Transcript

Include ordered transcript messages:

```text
timestamp
speaker
message_type
text
source
cue_id if applicable
```

### 4. Event Timeline

Include ordered timeline events:

```text
timestamp
event_type
label
cue_id
important patient state values
```

Important state values:

```text
heart rate
SpO2
respiratory rate
breathing effort
anxiety
oxygen applied
bronchodilator given
```

### 5. Assessment Checklist

Use the scenario checklist from:

```text
codes/backend/app/scenarios/copd_sob.json
```

Initial report should show checklist items as faculty-review prompts, not automatically scored results.

Example:

```text
Assessment checklist for faculty review:
- Assessed airway/breathing
- Checked SpO2
- Applied oxygen as ordered
- Reassessed after intervention
```

### 6. Communication Observations

Use transcript patterns to provide non-grading observations.

Examples:

```text
Student asked the patient how they were feeling.
Student asked about breathing symptoms.
Patient expressed anxiety or distress during the scenario.
```

Avoid:

```text
Student passed.
Student failed.
Student demonstrated clinical competence.
```

### 7. Suggested Debrief Prompts

Generate prompts instructors can use:

```text
What assessment findings supported the need for oxygen?
How did the patient response change after the instructor cue?
What communication strategies helped reduce patient anxiety?
What would you reassess after the intervention?
```

### 8. Instructor Notes

For now, this can be a placeholder field:

```text
Instructor notes can be added manually in a later step.
```

## Target Flow

```mermaid
flowchart TD
    A[Instructor ends session] --> B[Frontend requests report]
    B --> C[GET /sessions/{session_id}/report]
    C --> D[Backend loads session]
    D --> E[Backend loads transcript]
    E --> F[Backend loads timeline]
    F --> G[Backend loads scenario checklist]
    G --> H[Report service builds debrief report]
    H --> I[Backend returns structured report JSON]
    I --> J[Dashboard displays report]
```

## API Design

### Generate Report

Recommended endpoint:

```text
GET /sessions/{session_id}/report
```

Reason:

The first report can be generated from existing persisted records without storing a separate report row.

Response shape:

```json
{
  "report_title": "COPD/SOB Simulation Debrief Report",
  "report_length_target": "Two-page concise faculty debrief report",
  "disclaimer": "This report is debrief support only. It does not replace faculty judgment.",
  "session": {
    "session_id": "session-...",
    "scenario_id": "copd-sob",
    "scenario_name": "Adult COPD Exacerbation / Shortness of Breath",
    "status": "ended",
    "started_at": "2026-07-02T...",
    "ended_at": "2026-07-02T...",
    "transcript_message_count": 3,
    "timeline_event_count": 2
  },
  "summary": "...",
  "transcript_excerpt": [
    {
      "timestamp": "2026-07-02T...",
      "speaker": "student",
      "message_type": "student_question",
      "text": "How are you feeling right now?",
      "source": "manual",
      "cue_id": null,
      "state_event_id": null
    }
  ],
  "transcript_omitted_count": 0,
  "timeline_excerpt": [
    {
      "timestamp": "2026-07-02T...",
      "event_type": "instructor_cue",
      "label": "SpO2 dropped",
      "cue_id": "spo2_dropped",
      "heart_rate": 92,
      "spo2": 88,
      "respiratory_rate": 24,
      "breathing_effort": "severe",
      "anxiety": "high",
      "oxygen_applied": false,
      "bronchodilator_given": false
    }
  ],
  "timeline_omitted_count": 0,
  "assessment_checklist": [],
  "communication_observations": [],
  "suggested_debrief_prompts": [],
  "instructor_notes_placeholder": "Instructor notes can be added during faculty debrief."
}
```

## Backend File Plan

New files:

```text
codes/backend/app/schemas/report.py
codes/backend/app/services/report_service.py
```

Modified files:

```text
codes/backend/app/api/sessions.py
codes/docs/Step8_Final_Debrief_Report.md
Progress_Report.md
```

## Frontend File Plan

New or modified files:

```text
codes/frontend/src/api/sessions.ts
codes/frontend/src/pages/Dashboard.tsx
codes/frontend/src/styles.css
```

## File Responsibilities

### `schemas/report.py`

Purpose:

Define the report response shape.

Should include:

- report metadata
- session summary
- transcript entries
- timeline entries
- checklist items
- observations
- debrief prompts
- disclaimer

### `services/report_service.py`

Purpose:

Build the final report from persisted session records and scenario data.

Responsibilities:

- load session
- load transcript messages
- load timeline events
- load scenario checklist
- build deterministic summary
- build communication observations
- build suggested debrief prompts
- return structured report object

### `api/sessions.py`

Purpose:

Expose:

```text
GET /sessions/{session_id}/report
```

### `api/sessions.ts`

Purpose:

Add frontend report request type and function.

### `Dashboard.tsx`

Purpose:

Display the generated report after a session is ended or when the instructor clicks a report button.

## Step 8 Substeps

### 8.1 Create Step 8 documentation

Create this planning document.

### 8.2 Define report schemas

Create backend Pydantic schemas for the report response.

Implemented on July 2, 2026:

```text
Created and refined the structured report schema in:
codes/backend/app/schemas/report.py
```

What the schema defines:

```text
ReportSessionMetadata
ReportTranscriptEntry
ReportTimelineEntry
ReportChecklistItem
FinalDebriefReport
```

Why:

- the report needs a predictable response shape before the service and UI depend on it
- the final report must be generated from persisted Step 7 session records
- transcript entries need speaker, message type, source, cue, and state-event links
- timeline entries need important patient-state values for faculty debriefing
- checklist items must stay as faculty-review prompts, not automatic scores

How:

- `ReportSessionMetadata` stores session identity, scenario name, timing, status, and record counts
- `ReportTranscriptEntry` stores each displayed message with speaker, message type, source, cue ID, and state event ID
- `ReportTimelineEntry` stores each displayed event plus heart rate, SpO2, respiratory rate, breathing effort, anxiety, oxygen status, and bronchodilator status when available
- `ReportChecklistItem` marks each checklist item as `Faculty review`
- `FinalDebriefReport` groups the complete report response, including disclaimer, summary, excerpts, checklist, observations, prompts, and instructor notes placeholder

Important product decision:

```text
The schema supports debriefing and review.
It does not contain pass/fail, grade, or competency fields.
```

### 8.3 Create deterministic report service

Build the report using persisted session, transcript, timeline, and scenario checklist data.

Implemented on July 2, 2026:

```text
Created and refined the deterministic report builder in:
codes/backend/app/services/report_service.py
```

What the service does:

- loads the saved simulation session
- loads ordered transcript messages from Step 7 persistence
- loads ordered timeline events from Step 7 persistence
- loads the COPD/SOB scenario checklist from scenario JSON
- builds a concise transcript excerpt
- builds a concise event timeline excerpt
- extracts important patient-state values from timeline snapshots
- creates faculty-review checklist items
- creates non-grading communication observations
- creates suggested debrief prompts
- returns a structured `FinalDebriefReport`

Why:

- the final report must come from persisted backend records
- the report should be reliable for the July 25 demo
- deterministic logic avoids hallucinated summaries or accidental grading
- faculty need organized debrief support, not an independent evaluator

How:

- `build_final_debrief_report(db, session_id)` is the main entry point
- `_build_transcript_excerpt()` converts saved transcript messages into report entries
- `_build_timeline_excerpt()` converts saved timeline events into report entries
- `_build_timeline_entry()` extracts heart rate, SpO2, respiratory rate, breathing effort, anxiety, oxygen status, and bronchodilator status from state snapshots
- `_build_assessment_checklist()` converts scenario checklist items into `Faculty review` prompts
- `_build_communication_observations()` uses simple deterministic rules based on transcript text and instructor cues
- `_build_debrief_prompts()` returns fixed faculty-facing prompts for the COPD/SOB scenario

Important implementation rule:

```text
The service does not call OpenAI.
The service does not generate grades.
The service does not write new database rows.
The service only reads existing session records and formats them for faculty debriefing.
```

### 8.4 Add report endpoint

Expose:

```text
GET /sessions/{session_id}/report
```

### 8.5 Add frontend report API client

Add a function to fetch the final report.

### 8.6 Add dashboard report view

Show report sections in the dashboard.

### 8.7 Add generate report workflow

Add a dashboard button or panel action so the instructor can generate the report after ending the session.

Implemented on July 2, 2026:

```text
Added an End session button and a Generate report button to the instructor dashboard.
```

Why:

- the instructor needs a visible workflow for final debriefing
- the report should be generated from the saved session record
- the report must stay short for the July 25 demo
- the dashboard should not require terminal commands or external tools

How:

- `endSession(sessionId)` calls `POST /sessions/{session_id}/end`
- `getSessionReport(sessionId)` calls `GET /sessions/{session_id}/report`
- `Dashboard.tsx` stores the returned report in local React state
- the report card renders the report immediately after the instructor clicks Generate report
- changing patient state or resetting the scenario clears the old report so stale report content is not shown
- instructor cue buttons are disabled after the session record is ended so the final report is based on a stable record

Two-page report decision:

```text
The report is intentionally concise.
It uses transcript and timeline excerpts instead of unlimited full history.
It displays omitted counts when the session is longer than the report target.
```

Current limits:

```text
transcript excerpt: first 12 messages
timeline excerpt: first 8 events
communication observations: maximum 4
suggested debrief prompts: maximum 4
```

This keeps the report useful for debriefing without becoming too long.

### 8.8 Verify report end to end

Test:

```text
start session
send chat message
apply instructor cue
end session
generate report
confirm transcript appears
confirm timeline appears
confirm checklist appears
confirm disclaimer appears
```

## Design Decision: Deterministic First

Initial Step 8 should avoid AI-generated scoring.

Use deterministic logic for:

- counts
- event names
- transcript display
- state snapshot display
- checklist display
- basic communication observations
- suggested prompts from scenario events

Optional future enhancement:

```text
AI-generated debrief summary reviewed by faculty
```

This should come only after the deterministic report works reliably.

## Success Criteria

Step 8 is complete when:

- instructor can generate a report for a session
- report includes session metadata
- report includes transcript messages
- report includes timeline events
- report includes scenario checklist
- report includes suggested debrief prompts
- report clearly states that it supports debriefing and does not replace faculty judgment
- report can be generated after the session ends
- report generation does not expose API keys

## Testing Plan

Backend:

```text
create session
send chat message
apply instructor cue
end session
GET /sessions/{session_id}/report
confirm report sections exist
confirm transcript count is correct
confirm timeline count is correct
confirm disclaimer exists
```

Frontend:

```text
open dashboard
run short scenario
end session
click generate report
confirm report appears
confirm transcript and events are visible
confirm report text fits on screen
```

## Security and Privacy Notes

- Use fictional patient data only.
- Do not include API keys or backend `.env` values.
- Clearly label the report as simulation debrief support.
- Do not store or display real patient information.
- Avoid independent scoring or pass/fail statements.

## Risks

### Risk: Report feels like grading

Mitigation:

Use faculty-review language and debrief prompts, not grades.

### Risk: Report is too long for demo

Mitigation:

Start with concise sections and expandable details later.

### Risk: AI summary hallucinates

Mitigation:

Use deterministic report logic first.

### Risk: Report misses important clinical context

Mitigation:

Include state snapshots and scenario checklist.
