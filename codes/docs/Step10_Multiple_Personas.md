# Step 10: Multiple Patient Personas and Scenario-Specific Windows

Date: July 15, 2026

## Implementation Tracking

### 2026-07-29 - MP-1: Scenario Registry And Generic Loader

What changed:

```text
Created a backend scenario registry and generic scenario loader.
```

Why:

```text
The backend should not depend only on load_copd_sob_scenario().
Future personas such as Chest Pain should be loaded by scenario_id using the same
code path.
```

How:

```text
Added:
- SCENARIO_REGISTRY
- load_scenario(scenario_id)
- list_scenarios()
- ScenarioNotFoundError
- scenario_id validation between the registry and JSON file
```

Where:

```text
codes/backend/app/services/scenario_loader.py
```

Compatibility:

```text
load_copd_sob_scenario() still exists and now calls load_scenario("copd-sob").
This keeps existing COPD/SOB state, chat, voice, and report code working while
we refactor toward multi-persona support.
```

Current behavior:

```text
Only copd-sob is registered today. Chest Pain will become a new registry entry
after its scenario JSON exists.
```

Next step:

```text
MP-2: Add generic scenario API endpoints:
- GET /scenarios
- GET /scenarios/{scenario_id}
```

### 2026-07-29 - MP-2: Generic Scenario API Endpoints

What changed:

```text
Added generic backend scenario API endpoints.
```

Why:

```text
The frontend should eventually load persona cards and persona pages from scenario
data instead of hard-coded COPD/SOB values.
```

How:

```text
Added:
- GET /scenarios
- GET /scenarios/{scenario_id}
- ScenarioSummary response model
- ScenarioListResponse response model
- 404 handling for unknown scenario_id values
- card_summary metadata in the COPD/SOB scenario JSON
```

Where:

```text
codes/backend/app/api/scenarios.py
codes/backend/app/scenarios/copd_sob.json
```

Compatibility:

```text
The existing COPD/SOB persona settings endpoints still work:
- GET /scenarios/copd-sob/persona-settings
- PATCH /scenarios/copd-sob/persona-settings
```

Current behavior:

```text
Only copd-sob is listed because it is the only registered scenario today.
The API shape is now ready for Chest Pain once chest_pain.json is added to the
scenario registry.
```

Next step:

```text
MP-3: Convert the frontend dashboard to load persona cards from GET /scenarios.
```

## Why This Document Was Added

The current product has one working persona:

```text
Adult COPD Exacerbation / Shortness of Breath
```

That was the correct first persona because it helped prove the main workflow:

```text
instructor controls patient state
student speaks or chats with the AI patient
patient responds according to the latest state
transcript, events, and report are saved
```

To make the product useful beyond one demo, the system now needs multiple personas. Each persona must have its own scenario, patient profile, clinical state fields, instructor controls, voice behavior, transcript context, and report focus.

## Step 10 Goal

Add support for at least five additional patient personas while keeping the existing COPD/SOB persona safe.

The product should support:

- a persona selection screen
- separate voice-room windows for each selected persona
- scenario-specific instructor controls
- scenario-specific patient state display
- scenario-specific AI voice and chat behavior
- scenario-specific transcript and final report context
- independent sessions so two personas do not share state by mistake

## Product Direction

This should not be built as six separate hard-coded apps.

The scalable design should be:

```text
one product shell
multiple scenario/persona definitions
dynamic UI generated from each persona definition
separate session state per selected persona
```

This matters because a future sellable product may need many scenarios, such as respiratory, cardiac, neurological, maternal health, pediatric, mental health, emergency care, and medication safety.

## Existing Persona

### 1. COPD / Shortness of Breath

Purpose:

```text
Respiratory assessment, therapeutic communication, oxygen/inhaler history, response to worsening dyspnea.
```

Current major features:

- COPD patient profile
- shortness of breath chief complaint
- respiratory vitals
- oxygen and bronchodilator interventions
- anxiety and breathing effort state
- respiratory-focused instructor cues
- respiratory-focused final report

## Five Additional Personas

### 2. Chest Pain / Suspected Cardiac Event

Clinical area:

```text
cardiac / emergency nursing
```

Patient example:

```text
Middle-aged adult with chest pressure, diaphoresis, anxiety, and shortness of breath.
```

Unique patient state fields:

- chest pain severity
- pain location
- pain radiation
- nausea
- diaphoresis
- anxiety
- heart rate
- blood pressure
- SpO2
- aspirin given
- nitroglycerin given
- provider notified

Instructor cues:

- chest pain worsened
- pain radiating to left arm
- blood pressure dropped
- nitroglycerin given
- aspirin given
- patient improving
- patient becoming more anxious

Voice behavior:

```text
Patient speaks with fear, discomfort, and short sentences when pain increases.
```

Report focus:

- asked pain assessment questions
- assessed cardiac symptoms
- asked medication/allergy history
- communicated therapeutically
- reassessed after intervention
- recognized deterioration

### 3. Stroke / Neurological Change

Clinical area:

```text
neurology / emergency nursing
```

Patient example:

```text
Older adult with facial droop, slurred speech, confusion, and one-sided weakness.
```

Unique patient state fields:

- speech clarity
- orientation
- facial droop
- arm weakness
- headache
- dizziness
- blood pressure
- heart rate
- time last known well
- glucose checked
- stroke team notified

Instructor cues:

- speech worsened
- weakness worsened
- confusion increased
- severe headache reported
- glucose checked
- stroke team notified
- patient stabilized

Voice behavior:

```text
Patient may speak slowly, slur words, show confusion, or have trouble answering clearly.
```

Report focus:

- assessed orientation
- recognized stroke symptoms
- asked last known well
- checked glucose
- escalated appropriately
- communicated clearly with confused patient

### 4. Sepsis / Infection Deterioration

Clinical area:

```text
medical-surgical / emergency nursing
```

Patient example:

```text
Adult patient with fever, weakness, suspected infection, tachycardia, and worsening mental status.
```

Unique patient state fields:

- temperature
- heart rate
- respiratory rate
- blood pressure
- SpO2
- pain
- chills
- fatigue
- mental status
- fluids started
- antibiotics ordered/given
- provider notified

Instructor cues:

- fever increased
- blood pressure dropped
- mental status worsened
- chills worsened
- fluids started
- antibiotics given
- patient improving

Voice behavior:

```text
Patient sounds weak, tired, sometimes confused, and may answer slowly during deterioration.
```

Report focus:

- recognized infection concerns
- monitored vital signs
- assessed mental status
- escalated hypotension
- reassessed after fluids/antibiotics
- used calm communication

### 5. Hypoglycemia / Diabetic Emergency

Clinical area:

```text
endocrine / emergency nursing
```

Patient example:

```text
Adult patient with diabetes who is shaky, sweaty, confused, hungry, and weak.
```

Unique patient state fields:

- blood glucose
- orientation
- tremor
- diaphoresis
- hunger
- weakness
- irritability
- oral glucose given
- IV dextrose given
- meal provided

Instructor cues:

- glucose dropped
- confusion worsened
- patient became irritable
- oral glucose given
- IV dextrose given
- glucose improved
- patient fully oriented

Voice behavior:

```text
Patient may sound shaky, confused, frustrated, or relieved after glucose improves.
```

Report focus:

- recognized hypoglycemia symptoms
- checked blood glucose
- assessed safety and orientation
- provided or requested appropriate intervention
- reassessed after glucose correction

### 6. Postpartum Hemorrhage / Maternal Emergency

Clinical area:

```text
maternal health / obstetric nursing
```

Patient example:

```text
Postpartum patient with dizziness, weakness, anxiety, increased bleeding, and signs of shock.
```

Unique patient state fields:

- bleeding amount
- fundal tone
- dizziness
- pain/cramping
- anxiety
- heart rate
- blood pressure
- skin condition
- fundal massage performed
- IV fluids started
- provider notified
- medication given

Instructor cues:

- bleeding increased
- dizziness worsened
- blood pressure dropped
- fundus boggy
- fundal massage performed
- fluids started
- medication given
- patient improving

Voice behavior:

```text
Patient sounds frightened, weak, and dizzy during worsening bleeding.
```

Report focus:

- recognized postpartum hemorrhage signs
- assessed bleeding and fundus
- escalated quickly
- reassured patient
- reassessed after interventions

## Why Separate Windows Are Needed

Each persona has different clinical logic.

For example:

```text
COPD needs breathing effort, SpO2, oxygen, bronchodilator.
Stroke needs speech clarity, weakness, orientation, last known well.
Postpartum hemorrhage needs bleeding amount, fundal tone, dizziness, blood pressure.
```

If all personas used the same fixed window, the UI would become confusing and clinically weak. A respiratory patient should not show stroke controls, and a stroke patient should not show bronchodilator controls.

The better design is:

```text
Persona selection screen
  -> opens selected persona voice room
  -> voice room renders only that persona's state fields and instructor controls
  -> session stores selected scenario_id
  -> transcript/report use selected persona context
```

## Recommended User Flow

```mermaid
flowchart TD
    A[Instructor opens dashboard] --> B[Select patient persona]
    B --> C[Start new session]
    C --> D[Open persona-specific voice room]
    D --> E[Student interacts with AI patient]
    D --> F[Instructor applies persona-specific cues]
    F --> G[Patient state updates]
    G --> H[AI voice/chat follows new state]
    E --> I[Transcript saved]
    F --> J[Event timeline saved]
    I --> K[Final report]
    J --> K
```

## Window Design

### Persona Selection Window

Purpose:

```text
Choose which patient persona/scenario to run.
```

Should show:

- persona name
- clinical area
- chief complaint
- difficulty level
- estimated simulation time
- learning objectives
- Start Session button
- Open Voice Room button after session starts

### Persona-Specific Voice Room

Purpose:

```text
Run the live simulation for one selected persona.
```

Should show:

- top patient state summary
- left side: instructor controls for the selected persona
- right side: voice controls and patient conversation
- scenario-specific patient state fields
- transcript and events linked to the selected session

Recommended route:

```text
/voice/:scenarioId
```

Example:

```text
/voice/copd-sob
/voice/chest-pain
/voice/stroke-neuro
/voice/sepsis
/voice/hypoglycemia
/voice/postpartum-hemorrhage
```

### Report Window

Purpose:

```text
Review the completed session using that persona's objectives and checklist.
```

Should show:

- session summary
- transcript
- event timeline
- scenario-specific learning objective coverage
- scenario-specific assessment checklist
- AI-generated debrief notes
- faculty reminder that the report supports but does not replace instructor judgment

## Architecture Decision

Use scenario definitions as the source of truth.

Each persona should be defined by structured scenario data:

```text
scenario_id
scenario_name
clinical_area
patient_profile
chief_complaint
initial_state
state_display_config
instructor_cues
voice_behavior_rules
allowed_disclosures
hidden_information
safety_rules
assessment_checklist
report_focus
```

The frontend should not need custom code for every persona. It should read the scenario definition and render:

- state cards
- cue buttons
- chat/voice instructions
- report sections

## Proposed Scenario File Structure

```text
codes/backend/app/scenarios/
  copd_sob.json
  chest_pain.json
  stroke_neuro.json
  sepsis.json
  hypoglycemia.json
  postpartum_hemorrhage.json
```

Each file should follow the same general contract but allow persona-specific fields.

## Proposed Frontend Screen Structure

```text
codes/frontend/src/pages/
  Dashboard.tsx              persona selection and session launch
  VoiceRoom.tsx              dynamic voice room for selected persona
  Chat.tsx                   reusable patient conversation

codes/frontend/src/components/
  PersonaCard.tsx            reusable persona selection card
  PatientStatePanel.tsx      dynamic state display
  InstructorCuePanel.tsx     dynamic cue buttons
  VoiceControls.tsx          reusable voice controls
  SessionReportPanel.tsx     report display
```

This is a future structure recommendation. It should be introduced carefully so current working code is not broken.

## Backend Changes Needed Later

No code is being changed in this document, but future implementation should add:

- API to list all available personas
- API to load one persona by `scenario_id`
- session creation with selected `scenario_id`
- dynamic initial state loading from selected scenario
- cue application using selected scenario's cue list
- voice instruction builder using selected scenario
- report generator using selected scenario's checklist and learning objectives

Recommended API shape:

```text
GET  /scenarios
GET  /scenarios/{scenario_id}
POST /sessions
GET  /sessions/{session_id}
POST /sessions/{session_id}/state/cues/{cue_id}
GET  /sessions/{session_id}/transcript
GET  /sessions/{session_id}/events
GET  /sessions/{session_id}/report
```

## Important Product Rule

Every live interaction must be tied to a session.

This avoids dangerous confusion such as:

```text
instructor changes COPD state
but stroke voice room receives the change
```

Each session should store:

- session_id
- scenario_id
- current patient state
- transcript entries
- timeline events
- report output

## Data Isolation Rule

Each persona window must load and update only its own active session.

Recommended frontend state:

```text
selectedScenarioId
activeSessionId
currentPatientState
transcriptForActiveSession
timelineForActiveSession
voiceConnectionForActiveSession
```

## Voice Behavior Rule

The Realtime voice instructions must be rebuilt from:

```text
selected scenario
current patient state
latest instructor cue
safety rules
allowed disclosures
hidden information
```

This means a stroke patient can speak with confusion/slurring rules, while a COPD patient can speak with breathless short-phrase rules.

## Report Rule

Reports must be scenario-specific.

The report for COPD should not evaluate stroke criteria, and the stroke report should not evaluate oxygen/inhaler history unless that scenario explicitly includes it.

## Recommended Implementation Substeps

### 10.1 Create Multi-Persona Design Document

Status:

```text
done
```

Purpose:

```text
Plan how multiple personas will work before coding.
```

### 10.2 Define Shared Scenario Schema

Create a clear JSON contract that every persona must follow.

Why:

```text
This keeps personas consistent while allowing each clinical scenario to have different fields.
```

### 10.3 Add Five New Scenario JSON Files

Create draft scenario definitions for:

- chest pain
- stroke/neuro change
- sepsis
- hypoglycemia
- postpartum hemorrhage

Why:

```text
The product needs more than one scenario to feel useful and scalable.
```

### 10.4 Add Scenario List API

Backend should return all available scenarios.

Why:

```text
The dashboard needs to display persona options dynamically.
```

### 10.5 Add Scenario Detail API

Backend should return one scenario by `scenario_id`.

Why:

```text
The voice room needs the selected persona's profile, state fields, cues, and rules.
```

### 10.6 Add Session Creation by Scenario

Starting a session should require a selected `scenario_id`.

Why:

```text
This prevents transcript, state, and report data from mixing across personas.
```

### 10.7 Update Dashboard to Persona Selection

Dashboard should show persona cards and allow instructor to start/open a session.

Why:

```text
The instructor should choose the patient before entering the simulation room.
```

### 10.8 Update Voice Room to Load Scenario Dynamically

Voice room should load by scenario/session instead of assuming COPD.

Why:

```text
Each persona has different state fields and cue buttons.
```

### 10.9 Render Dynamic Patient State Fields

State panel should render from `state_display_config`.

Why:

```text
COPD, stroke, sepsis, hypoglycemia, and postpartum hemorrhage all need different visible state fields.
```

### 10.10 Render Dynamic Instructor Cue Buttons

Cue buttons should come from the selected scenario file.

Why:

```text
The instructor should only see clinically relevant controls for the selected persona.
```

### 10.11 Update Voice Instructions Per Persona

Realtime instructions should use selected scenario and selected patient state.

Why:

```text
Voice behavior must match the clinical condition, personality, and safety rules of that persona.
```

### 10.12 Update Report Generation Per Persona

Report generator should use the selected scenario's objectives and checklist.

Why:

```text
Debrief support must be clinically relevant to the chosen simulation.
```

### 10.13 Verify One Persona at a Time

Test each persona separately before running multiple windows.

Why:

```text
This reduces the chance of state leakage, wrong cue behavior, or wrong report criteria.
```

## Acceptance Criteria

Step 10 is successful when:

- at least six total personas exist including COPD
- instructor can select a persona from the dashboard
- selected persona opens in its own voice-room window
- each persona shows only its own patient state fields
- each persona shows only its own instructor cues
- patient voice/chat follows the selected persona
- transcript and event timeline are stored under the correct session
- final report uses the selected persona's objectives and checklist
- no API key or secret is exposed to the frontend
- existing COPD/SOB workflow still works

## Risks

### Risk: UI Becomes Too Generic

If the UI is too generic, it may feel clinically vague.

Mitigation:

```text
Use shared components, but allow persona-specific labels, state groups, cue groups, and report focus.
```

### Risk: State Leaks Between Personas

If the app uses one global patient state, changing one persona could affect another.

Mitigation:

```text
Tie every state update to session_id and scenario_id.
```

### Risk: Too Much Work Before Deadline

Creating five polished personas could become large.

Mitigation:

```text
Create clinically reasonable draft personas first.
Make COPD and one new persona demo-ready.
Keep the other four as selectable draft scenarios if time is short.
```

### Risk: Clinical Accuracy Needs Faculty Review

AI-generated or developer-written scenarios may miss clinical details.

Mitigation:

```text
Mark scenarios as draft until reviewed by a nursing simulation faculty member.
```

## Recommended July 25 Demo Strategy

For the deadline, prioritize:

```text
1. COPD/SOB fully working
2. Persona selection screen working
3. One additional persona fully working, preferably chest pain or hypoglycemia
4. Remaining personas visible as draft scenarios
5. Voice, transcript, event timeline, and report still working for the selected scenario
```

This shows the product is not just a one-scenario prototype while still protecting the demo from becoming too large to finish well.
