# Step 1: Project Setup

## Purpose

Step 1 creates the clean foundation for the Phase 1 AI patient voice demo. This step does not include AI persona logic, voice interaction, instructor dashboard behavior, transcript storage, or report generation yet.

The goal is to make sure the frontend and backend can run locally and communicate through a simple health check.

---

## Working Directory

All implementation work should live inside:

```text
/Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/codes
```

Recommended structure after Step 1:

```text
codes/
  frontend/
  backend/
  docs/
  docx/
    Step1_Project_Setup.md
  README.md
  .gitignore
```

---

## Step 1 Goals

By the end of Step 1:

- the backend starts locally
- the frontend starts locally
- the frontend can call the backend `/health` endpoint
- environment variable examples exist
- local run instructions exist
- no real API keys or secrets are stored in the project
- no AI, voice, or patient-state logic is added yet

---

## Backend Setup

Use **FastAPI** for the backend.

Recommended backend structure:

```text
backend/
  app/
    main.py
    api/
      health.py
    core/
      config.py
  requirements.txt
  .env.example
```

### Backend Responsibilities in Step 1

The backend should:

- create a FastAPI app
- expose a `/health` endpoint
- allow frontend requests during local development
- read basic configuration from environment variables
- avoid OpenAI/API/persona logic for now

### Health Endpoint

Endpoint:

```text
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "service": "ai-patient-voice-backend"
}
```

### Backend Environment Example

Create:

```text
backend/.env.example
```

Suggested content:

```text
APP_ENV=local
FRONTEND_ORIGIN=http://localhost:5173
OPENAI_API_KEY=replace_later
DATABASE_URL=sqlite:///./dev.db
```

Important:

- Do not add a real OpenAI API key.
- Do not commit real secrets.
- OpenAI integration happens later, not in Step 1.

---

## Frontend Setup

Use **React + TypeScript** for the frontend.

Recommended frontend structure:

```text
frontend/
  src/
    App.tsx
    main.tsx
    api/
      client.ts
    pages/
      Home.tsx
  .env.example
  package.json
```

### Frontend Responsibilities in Step 1

The frontend should:

- start locally in the browser
- show a simple home page
- call the backend `/health` endpoint
- display backend connection status
- avoid dashboard, scenario, AI, and voice logic for now

### Frontend Environment Example

Create:

```text
frontend/.env.example
```

Suggested content:

```text
VITE_API_BASE_URL=http://localhost:8000
```

For local development, `frontend/.env` is optional because the frontend code also defaults to `http://localhost:8000`. Create `frontend/.env` only when the API URL needs to be overridden.

### Expected Home Page

The first page can be very simple:

```text
AI Patient Voice Persona
Backend status: connected
```

If the backend is not running, it should show:

```text
Backend status: unavailable
```

---

## Documentation Setup

Create a `docs/` folder for implementation notes and scenario planning.

Recommended initial files:

```text
docs/
  local_setup.md
  scenario_copd_sob.md
  phase1_notes.md
```

These files can start as placeholders in Step 1. Detailed scenario design happens in Step 2.

---

## Local Development Ports

Use these default ports:

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8000` |

The frontend should call:

```text
http://localhost:8000/health
```

---

## Local Run Flow

Expected local flow:

```text
Start backend
      |
      v
Backend exposes /health
      |
      v
Start frontend
      |
      v
Frontend calls /health
      |
      v
Frontend shows backend status
```

---

## README Requirements

Create a top-level:

```text
codes/README.md
```

The README should include:

- project name
- short description
- folder structure
- backend setup instructions
- frontend setup instructions
- local ports
- reminder not to commit real secrets

Suggested project description:

```text
Instructor-cued AI patient voice demo for nursing simulation. Phase 1 is a standalone web app with no direct Laerdal integration.
```

---

## What Not To Build in Step 1

Do not add:

- AI model calls
- OpenAI Realtime integration
- voice input/output
- instructor dashboard controls
- patient state manager
- COPD scenario logic
- transcript database tables
- report generation
- authentication

Those belong to later steps.

---

## Step 1 Verification

Step 1 is complete when:

- `codes/frontend/` exists
- `codes/backend/` exists
- `codes/docs/` exists
- backend starts locally
- frontend starts locally
- backend `/health` route returns success
- frontend displays backend connection status
- `.env.example` files exist as templates
- README has local run instructions
- no real secrets are stored

---

## Definition of Done

Step 1 is done when a user can open the frontend and see that the backend is connected.

Expected result:

```text
AI Patient Voice Persona
Backend status: connected
```

This confirms that the project foundation is ready for Step 2: defining the COPD/shortness-of-breath scenario.

---

## First Substep to Implement: Backend Foundation

### Why This Comes First

The backend should be verified before the frontend depends on it. The smallest useful backend foundation is a FastAPI app that starts locally and exposes a working `/health` endpoint. Once this is stable, the frontend can safely call it and display connection status.

### Substep 1 Goal

Create and verify the minimal backend service.

Expected result:

```text
GET http://localhost:8000/health
```

returns:

```json
{
  "status": "ok",
  "service": "ai-patient-voice-backend"
}
```

### Small Steps

1. Confirm backend folder structure.

```text
backend/
  app/
    main.py
    api/
      health.py
    core/
      config.py
  requirements.txt
  .env.example
```

2. Confirm dependencies are listed.

Required packages:

```text
fastapi
uvicorn[standard]
pydantic-settings
```

3. Confirm environment example exists.

Required file:

```text
backend/.env.example
```

Required values:

```text
APP_ENV=local
APP_NAME=AI Patient Voice Backend
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=sqlite:///./dev.db
OPENAI_API_KEY=replace_later
```

4. Confirm backend config loads environment values.

Expected behavior:

- app name is loaded from settings
- frontend origin is loaded from settings
- real secrets are not required for Step 1

5. Confirm FastAPI app is created.

Expected behavior:

- app imports without Python errors
- CORS allows local frontend origin
- health router is registered

6. Confirm `/health` route exists.

Expected behavior:

- route uses `GET /health`
- response is simple JSON
- route does not require database, auth, AI, or OpenAI key

7. Run backend syntax/import verification.

Suggested check:

```bash
python3 -m compileall app
```

8. Start backend locally.

Suggested command:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

9. Test health endpoint.

Suggested checks:

```text
Open http://localhost:8000/health in browser
```

or:

```bash
curl http://localhost:8000/health
```

### What Not To Add in This Substep

Do not add:

- database models
- AI calls
- OpenAI Realtime code
- patient state manager
- dashboard endpoints
- authentication
- transcript/report logic

### Substep 1 Definition of Done

This substep is complete when:

- backend imports without errors
- backend starts locally on port `8000`
- `/health` returns the expected JSON
- no real secrets are needed
- no AI/persona/voice logic has been added
