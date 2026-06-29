# Progress Report: AI Patient Voice Persona Project

**Date:** Before June 22, 2026  
**Project:** Instructor-Cued AI Patient Voice Persona for Nursing Simulation  
**Current phase:** Phase 1 setup and foundation  

---

## 1. Summary of Progress

As of **June 22, 2026**, the project has moved from concept planning into the first working technical foundation. The main achievement so far is that the frontend and backend structure has been created, and the basic connection between them has been tested through a backend health endpoint.

The current app does not yet include AI, voice, patient state logic, instructor dashboard controls, scenario logic, transcript storage, or report generation. Those will come in later steps.

---

## 2. Documents Created

The following planning and design documents have been created:

- `AI_Patient_Voice_Persona_Project_Skeleton.md`
- `Implementation_Design.md`
- `codes/Phase1_Build_Steps.md`
- `codes/docs/Step1_Project_Setup.md`
- `codes/docx/Step1_Project_Setup.md`
- `codes/README.md`

These documents define the project purpose, requirements, production design direction, Phase 1 build steps, and Step 1 setup expectations.

---

## 3. Technical Setup Completed

### Backend

Completed backend foundation:

- Created `codes/backend/`
- Created FastAPI app entry point:
  - `codes/backend/app/main.py`
- Created health API route:
  - `codes/backend/app/api/health.py`
- Created backend configuration file:
  - `codes/backend/app/core/config.py`
- Created backend environment example:
  - `codes/backend/.env.example`
- Created backend requirements file:
  - `codes/backend/requirements.txt`
- Verified backend works using the root `persona` virtual environment.

Health endpoint verified:

```text
GET http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "ai-patient-voice-backend"
}
```

### Frontend

Completed frontend foundation:

- Created `codes/frontend/`
- Created React + TypeScript app shell.
- Created top-level app component:
  - `codes/frontend/src/App.tsx`
- Created home page:
  - `codes/frontend/src/pages/Home.tsx`
- Created frontend API client:
  - `codes/frontend/src/api/client.ts`
- Added frontend environment file:
  - `codes/frontend/.env`
- Added frontend package setup:
  - `codes/frontend/package.json`
- Fixed missing React TypeScript types.
- Verified frontend build works.

Frontend `.env` points to:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 4. Current Application Flow

The current system proves that the frontend and backend can communicate.

```text
┌──────────────────────────────────────────────┐
│              Browser / Frontend              │
│          http://localhost:5173               │
└───────────────────────┬──────────────────────┘
                        │
                        │ loads React app
                        v
┌──────────────────────────────────────────────┐
│ frontend/src/main.tsx                        │
│                                              │
│ Finds <div id="root"></div> in index.html    │
│ and renders <App /> into it                  │
└───────────────────────┬──────────────────────┘
                        │
                        v
┌──────────────────────────────────────────────┐
│ frontend/src/App.tsx                         │
│                                              │
│ Loads and displays the Home page             │
│ return <Home />                              │
└───────────────────────┬──────────────────────┘
                        │
                        v
┌──────────────────────────────────────────────┐
│ frontend/src/pages/Home.tsx                  │
│                                              │
│ Shows page UI                                │
│ Calls getHealth() when page loads            │
│ Displays: checking / connected / unavailable │
└───────────────────────┬──────────────────────┘
                        │
                        │ calls getHealth()
                        v
┌──────────────────────────────────────────────┐
│ frontend/src/api/client.ts                   │
│                                              │
│ Reads VITE_API_BASE_URL from frontend .env   │
│ Sends fetch request to backend:              │
│ http://127.0.0.1:8000/health                 │
└───────────────────────┬──────────────────────┘
                        │
                        │ HTTP GET /health
                        v
┌──────────────────────────────────────────────┐
│ backend/app/main.py                          │
│                                              │
│ Creates FastAPI app                          │
│ Loads settings from config.py                │
│ Enables CORS for frontend                    │
│ Registers health_router                      │
└───────────────┬──────────────────────┬───────┘
                │                      │
                │ loads settings        │ includes router
                v                      v
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ backend/app/core/config.py   │   │ backend/app/api/health.py    │
│                              │   │                              │
│ Reads backend .env values    │   │ Defines GET /health          │
│ Provides app settings        │   │ Returns status JSON          │
└──────────────────────────────┘   └───────────────┬──────────────┘
                                                    │
                                                    │ response
                                                    v
┌──────────────────────────────────────────────┐
│ JSON response                                │
│                                              │
│ {                                            │
│   "status": "ok",                            │
│   "service": "ai-patient-voice-backend"      │
│ }                                            │
└───────────────────────┬──────────────────────┘
                        │
                        │ returned to frontend
                        v
┌──────────────────────────────────────────────┐
│ Home.tsx updates UI                          │
│                                              │
│ Backend status: connected                    │
└──────────────────────────────────────────────┘
```

Short flow:

```text
index.html
   ↓
main.tsx
   ↓
App.tsx
   ↓
Home.tsx
   ↓
client.ts
   ↓ HTTP GET /health
main.py
   ↓
health.py
   ↓
JSON response
   ↓
Home.tsx displays connected
```

---

## 5. What This Proves

This setup proves:

- the backend can run as a FastAPI service
- the backend can expose an API route
- the frontend can load as a React app
- the frontend can call the backend
- the app can display backend connection status

This completes the foundation for Step 1.

---

## 6. Current Known Notes

- Backend dependencies are installed in the root `persona` virtual environment.
- The backend should be started using the `persona` venv.
- The frontend uses `http://127.0.0.1:8000` for the backend API.
- No real OpenAI API key is used yet.
- No AI, voice, patient state, dashboard, transcript, or report logic has been implemented yet.

Backend run command:

```bash
cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/codes/backend
../../persona/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend run command:

```bash
cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/codes/frontend
npm run dev
```

---

## 7. Next Step

The next major step is **Step 2: Define the COPD/SOB scenario configuration**.

Step 2 should define:

- patient profile
- initial vitals
- symptoms
- hidden information
- allowed disclosures
- instructor cues
- state transitions
- safety rules
- expected assessment checklist

Recommended first artifact for Step 2:

```text
codes/backend/app/scenarios/copd_sob.json
```

---

# Progress Update: Step 2 Completed

**Date:** June 22, 2026  
**Step:** Step 2 - Define the First Scenario  
**Status:** Completed  

---

## 1. Step 2 Goal

The goal of Step 2 was to define the first simulation scenario before adding AI chat, voice, instructor dashboard controls, patient-state update logic, transcript storage, or report generation.

The selected first scenario is:

```text
Adult COPD Exacerbation / Shortness of Breath
```

This scenario now acts as the first structured source of truth for the future AI patient persona.

---

## 2. Files Created in Step 2

### Scenario Folder

Created:

```text
codes/backend/app/scenarios/
```

Purpose:

- stores scenario definitions
- keeps scenario content separate from backend route logic
- prepares the backend for multiple scenarios later

Created package marker:

```text
codes/backend/app/scenarios/__init__.py
```

---

### COPD/SOB Scenario JSON

Created:

```text
codes/backend/app/scenarios/copd_sob.json
```

Purpose:

- stores the COPD/SOB scenario as structured data
- defines the patient, initial state, instructor cues, safety rules, and assessment checklist
- keeps scenario content readable and reviewable

The JSON includes:

- scenario ID
- scenario name
- patient profile
- chief complaint
- learning objectives
- initial vitals and symptoms
- allowed disclosures
- hidden information
- instructor cues
- safety rules
- assessment checklist

Validated:

```text
copd_sob.json parses correctly as valid JSON.
```

---

### Scenario Loader Service

Created:

```text
codes/backend/app/services/
codes/backend/app/services/__init__.py
codes/backend/app/services/scenario_loader.py
```

Purpose:

- loads the scenario JSON from disk
- keeps file-reading logic separate from API route code
- prepares the backend so scenario storage can later change without rewriting the API route

Verified loader output:

```text
copd-sob
Adult COPD Exacerbation / Shortness of Breath
```

---

### Scenario API Route

Created:

```text
codes/backend/app/api/scenarios.py
```

Purpose:

- exposes the COPD/SOB scenario through the backend
- lets the frontend or future persona engine request scenario data

Added endpoint:

```text
GET /scenarios/copd-sob
```

---

### Registered Scenario Route

Updated:

```text
codes/backend/app/main.py
```

Added:

```python
from app.api.scenarios import router as scenarios_router
app.include_router(scenarios_router)
```

Purpose:

- connects the scenario API route to the main FastAPI app

Verified backend routes now include:

```text
/health
/scenarios/copd-sob
```

---

## 3. Step 2 Test Results

The backend was started using the root `persona` virtual environment:

```bash
cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/codes/backend
../../persona/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verified health endpoint:

```text
GET http://127.0.0.1:8000/health
```

Response:

```json
{
  "status": "ok",
  "service": "ai-patient-voice-backend"
}
```

Verified scenario endpoint:

```text
GET http://127.0.0.1:8000/scenarios/copd-sob
```

Result:

```text
Backend returned the full COPD/SOB scenario JSON successfully.
```

---

## 4. Step 2 Flow Diagram

```text
Browser / API Client
        |
        | GET /scenarios/copd-sob
        v
backend/app/main.py
        |
        | registered scenarios_router
        v
backend/app/api/scenarios.py
        |
        | calls load_copd_sob_scenario()
        v
backend/app/services/scenario_loader.py
        |
        | reads JSON file
        v
backend/app/scenarios/copd_sob.json
        |
        | returns parsed scenario dictionary
        v
backend/app/api/scenarios.py
        |
        | returns JSON response
        v
Browser / API Client receives COPD/SOB scenario
```

---

## 5. What This Proves

Step 2 proves:

- the first patient scenario exists as structured data
- the scenario JSON is valid
- the backend can load the scenario from disk
- the backend can expose the scenario through an API endpoint
- `/health` still works after adding the new route
- no AI, voice, dashboard, patient-state update, transcript, report, auth, or database logic has been added yet

---

## 6. Current Project Status After Step 2

Completed:

- Step 1: project setup and frontend-backend health connection
- Step 2: COPD/SOB scenario definition and scenario API endpoint

Not yet built:

- text-only AI persona
- chat UI
- patient state manager
- instructor dashboard
- voice interaction
- transcript/event timeline
- final report generation
- authentication
- database persistence

---

## 7. Next Step

The next major step is **Step 3: Build Text-Only Persona First**.

Step 3 should start with a simple text-based patient interaction before adding voice.

Planned Step 3 goal:

```text
Student types a question.
Backend loads the COPD/SOB scenario.
Backend sends scenario context and question to the AI model.
AI responds as the patient in text.
Frontend displays the patient response.
```

Important:

Step 3 should also be implemented slowly, one substep at a time, with each file explained before moving to the next.

---

# Progress Update: Virtual Environment Decision

**Date:** June 27, 2026  
**Topic:** Python virtual environment location  
**Status:** Decided  

## Decision

The cloned project does **not** require a separate root-level `persona` virtual environment.

The recommended backend virtual environment location is:

```text
persona_project_clone/codes/backend/.venv
```

The frontend dependencies should remain inside:

```text
persona_project_clone/codes/frontend/node_modules
```

## Why a Root `persona` Venv Is Not Needed

The project has separate backend and frontend dependency systems:

- Backend Python dependencies are listed in `codes/backend/requirements.txt`.
- Frontend JavaScript dependencies are listed in `codes/frontend/package.json`.
- The backend README instructions create the Python venv inside `codes/backend`.
- The frontend uses `npm install`, which creates `node_modules` inside `codes/frontend`.

Because of this structure, a root-level `persona` venv would be redundant and could make setup confusing.

## Clean Setup Pattern

Use this structure:

```text
persona_project_clone/
  codes/
    backend/
      .venv/          # Python backend virtual environment
      requirements.txt
    frontend/
      node_modules/   # Frontend npm dependencies
      package.json
```

## Benefit

This keeps each part of the project self-contained:

- backend Python packages stay with the backend
- frontend npm packages stay with the frontend
- the repository is easier to clone and set up
- future contributors do not need to guess which virtual environment to activate

---

# Progress Update: Step 3 Text-Only Patient Persona

**Date:** June 27, 2026  
**Step:** Step 3 - Build Text-Only Persona First  
**Status:** Completed through connected mock chat flow  

## 1. Step 3 Goal

The goal of Step 3 was to build the first text-only patient conversation flow before adding OpenAI, voice, instructor dashboard controls, patient-state changes, transcripts, or reports.

This step proves that the core application path works:

```text
Student enters message
    |
    v
Frontend sends message to backend
    |
    v
Backend loads COPD/SOB scenario
    |
    v
Backend creates patient-style response
    |
    v
Frontend displays patient reply
```

## 2. Why We Used a Mock Persona First

We intentionally used a mock response service instead of OpenAI at this stage.

Reasons:

- avoids needing an OpenAI API key during early testing
- avoids API cost while the basic app flow is still being built
- makes responses predictable and easier to debug
- proves frontend-backend communication before adding AI complexity
- keeps the future OpenAI integration easier because the API contract is already defined

No OpenAI API key is required for the current Step 3 implementation.

## 3. Backend Work Completed

### Chat Schemas

Created:

```text
codes/backend/app/schemas/__init__.py
codes/backend/app/schemas/chat.py
```

Purpose:

- defines the request shape the frontend sends
- defines the response shape the backend returns
- makes the chat API contract clear and stable

Request shape:

```json
{
  "message": "Do you have chest pain?"
}
```

Response shape:

```json
{
  "reply": "It is not sharp pain, but my chest feels tight when I try to breathe.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

### Mock Persona Service

Created:

```text
codes/backend/app/services/mock_persona.py
```

Purpose:

- generates a predictable patient-style response
- uses the COPD/SOB scenario's allowed disclosures
- keeps response logic outside the API route
- prepares the project for later OpenAI replacement

Current mock behavior:

```text
If message mentions breathing -> return onset response
If message mentions chest pain -> return chest tightness response
If message mentions oxygen -> return home oxygen response
If message mentions inhaler -> return inhaler response
If message mentions smoking -> return smoking history response
If message mentions allergies -> return allergy response
Otherwise -> return generic shortness-of-breath response
```

### Chat API Route

Created:

```text
codes/backend/app/api/chat.py
```

Purpose:

- exposes the backend chat endpoint
- receives the student message
- loads the COPD/SOB scenario
- calls the mock persona service
- returns a structured patient response

Endpoint:

```text
POST /chat
```

### Registered Chat Route

Updated:

```text
codes/backend/app/main.py
```

Purpose:

- connects the chat router to the FastAPI app
- makes `/chat` available as a real backend endpoint

Backend routes now include:

```text
/health
/scenarios/copd-sob
/chat
```

## 4. Frontend Work Completed

### Frontend Chat API Client

Created:

```text
codes/frontend/src/api/chat.ts
```

Updated:

```text
codes/frontend/src/api/client.ts
```

Purpose:

- gives the frontend a typed `sendChatMessage(message)` function
- keeps API calls outside the React page component
- sends student messages to `POST /chat`
- returns the backend patient response to the UI

### Simple Chat UI

Created:

```text
codes/frontend/src/pages/Chat.tsx
```

Updated:

```text
codes/frontend/src/App.tsx
codes/frontend/src/styles.css
```

Purpose:

- creates the first text-only patient conversation screen
- displays patient and student messages
- provides a student message input and Send button
- shows a sending state while waiting for backend response
- shows an error message if the backend is unavailable

The app now opens directly to the chat page.

## 5. Connected Step 3 Flow

Current working flow:

```text
Chat.tsx
    |
    | student clicks Send
    v
sendChatMessage(message)
    |
    | POST /chat
    v
backend/app/api/chat.py
    |
    | load scenario
    v
backend/app/services/scenario_loader.py
    |
    | read COPD/SOB JSON
    v
backend/app/scenarios/copd_sob.json
    |
    | create mock reply
    v
backend/app/services/mock_persona.py
    |
    | return ChatResponse
    v
Chat.tsx displays patient reply
```

## 6. Tests and Validation Completed

Backend direct validation:

```text
.venv/bin/python -m compileall app
```

Backend HTTP validation:

```text
POST http://127.0.0.1:8000/chat
```

Example tested request:

```json
{
  "message": "Do you use an inhaler?"
}
```

Example response:

```json
{
  "reply": "I used my rescue inhaler earlier, but it did not help much.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

Validation error tested:

```text
Empty message returns 422 Unprocessable Content
```

Frontend validation:

```text
npm run build
```

Result:

```text
TypeScript and Vite build completed successfully.
```

CORS validation:

```text
Frontend origin http://localhost:5173 is accepted by the backend.
```

## 7. Current Project Status After Step 3

Completed:

- Step 1: backend/frontend foundation and health check
- Step 2: COPD/SOB scenario configuration and scenario API
- Step 3: text-only mock patient persona with connected frontend chat UI

Current app can:

- show a chat interface
- accept a student question
- send the question to the backend
- load the COPD/SOB scenario
- return a mock patient response
- display the patient response in the frontend

Not yet built:

- OpenAI-generated persona responses
- voice assistant
- instructor dashboard controls
- live patient condition changes
- transcript storage
- report generation
- authentication
- database persistence

## 8. Why Step 3 Is Valuable

Step 3 is valuable because it proves the central product workflow at a small scale.

The project is no longer only documentation or setup. It now has a working end-to-end chat path:

```text
React UI -> FastAPI backend -> scenario data -> persona response -> React UI
```

This gives a stable base for the next major upgrade: replacing the mock response with an AI-generated patient response while keeping the same frontend and backend structure.

## 9. Next Step

The next planned improvement is:

```text
Step 3.11: Replace mock persona response with OpenAI later
```

This will require:

- OpenAI API key setup
- secure environment variable handling
- prompt design for the COPD/SOB patient persona
- safety rules so the AI speaks only as the patient
- backend error handling for AI failures
- testing for realistic and safe patient responses

---

# Progress Update: Step 4 Patient State Manager

Date: June 29, 2026

## 1. Why Step 4 Was Done

Step 4 was completed to make the AI patient persona aware of changing patient conditions during a simulation.

Before Step 4, the app could answer student questions using the COPD/SOB scenario, but the patient condition did not change over time. After Step 4, the instructor can apply patient condition cues in the backend, and the next patient response changes based on the latest state.

This is an important product milestone because it proves the core value:

```text
Instructor cue -> patient state changes -> persona response changes
```

This is the foundation for a future instructor dashboard and voice patient persona.

## 2. Backend Work Completed

### State Schemas

Created:

```text
codes/backend/app/schemas/state.py
```

Purpose:

- defines patient vitals, symptoms, emotion, voice behavior, interventions, and safety controls
- defines `PatientState`
- defines `StateEvent`
- defines response shapes for state and event APIs

### State Manager Service

Created:

```text
codes/backend/app/services/state_manager.py
```

Purpose:

- stores the current patient state in backend memory
- loads the initial state from `copd_sob.json`
- resets the state
- applies instructor cues
- logs state events

Current storage:

```text
in-memory backend state
```

Reason:

- fast enough for the July 25 internship demo
- easy to understand and test
- can later be replaced with Redis/PostgreSQL for product scaling

### State API Routes

Created:

```text
codes/backend/app/api/state.py
```

Routes added:

```text
GET /state
POST /state/reset
POST /state/cues/{cue_id}
GET /state/events
```

Purpose:

- lets a future instructor dashboard read current patient state
- lets instructor cues update patient state
- returns event history for future timeline/report features

### Registered State Routes

Updated:

```text
codes/backend/app/main.py
```

Purpose:

- connects the state router to the FastAPI app
- makes state endpoints available over HTTP

## 3. Chat Behavior Updated

Updated:

```text
codes/backend/app/api/chat.py
codes/backend/app/services/mock_persona.py
```

Purpose:

- chat now reads the latest patient state before replying
- mock persona responses now change after instructor cues
- frontend API contract remains unchanged

Current state-aware chat flow:

```text
Student sends message
    |
    v
POST /chat
    |
    v
Backend loads scenario
    |
    v
Backend reads current patient state
    |
    v
Mock persona creates state-aware response
    |
    v
Frontend displays patient reply
```

## 4. Tests and Validation Completed

Backend compile check:

```text
.venv/bin/python -m compileall app
```

State API HTTP tests confirmed:

```text
reset 200 92 91
current 200 initial_assessment 92 91
spo2 200 88 severe high
hr 200 128 high
events 200 [('state_reset', None), ('instructor_cue', 'spo2_dropped'), ('instructor_cue', 'hr_increased')]
unknown 404 Unknown instructor cue: unknown_cue
```

State-aware chat tests confirmed:

```text
baseline I am feeling short of breath and a little scared. Can you help me?
spo2 Worse. I cannot catch my breath.
hr My heart feels like it is racing. I feel scared.
```

## 5. Current Project Status After Step 4

Completed:

- Step 1: backend/frontend foundation and health check
- Step 2: COPD/SOB scenario configuration and scenario API
- Step 3: text-only mock patient persona with connected frontend chat UI
- Step 4: patient state manager and state-aware chat behavior

Current app can:

- show a chat interface
- accept a student question
- send the question to the backend
- load the COPD/SOB scenario
- maintain current patient state in memory
- reset patient state
- apply instructor cues
- log state events
- change the next patient reply based on the latest state

Not yet built:

- instructor dashboard UI
- voice assistant
- OpenAI-generated responses
- transcript persistence
- final report generation
- authentication
- database persistence

## 6. Why Step 4 Is Valuable

Step 4 makes the project feel like a simulation product instead of a simple chatbot.

It directly answers the earlier design concern:

```text
How will the persona know that HR increased or SpO2 dropped?
```

Answer:

```text
The instructor applies a matching cue through the AI system.
The backend updates patient state.
The next AI patient response uses the updated state.
```

This is the correct product boundary because the app does not control the Laerdal manikin directly.

## 7. Product Scaling Note

The current state manager uses in-memory storage because the internship demo needs speed and clarity.

For a sellable product, the same concept should later move to:

```text
Redis for live patient state
PostgreSQL for session/event persistence
WebSockets for live dashboard updates
authentication for instructor/admin access
audit logs for instructor actions
```

The current API design keeps that future path open.

## 8. Next Step

The next recommended step is:

```text
Step 5: Build the Instructor Dashboard
```

Reason:

The backend state manager is ready. The next visible product value is giving the instructor buttons such as:

```text
SpO2 dropped
HR increased
Breathing worsened
Oxygen applied
Patient improving
```

Those buttons should call the state API and show the current patient state on screen.
