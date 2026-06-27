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
