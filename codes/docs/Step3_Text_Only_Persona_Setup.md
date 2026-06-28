# Step 3: Build Text-Only Persona First

## Purpose

Step 3 creates the first text-only patient conversation flow. This step lets us test the core idea before adding voice, instructor dashboard controls, patient-state updates, transcript storage, or OpenAI integration.

The first version will use a **mock persona response**, not a real AI call.

Why we start with a mock response:

- It proves the frontend-to-backend chat flow works.
- It avoids API key, cost, latency, and model behavior issues at this stage.
- It makes debugging easier because the response is predictable.
- It lets us understand every file before adding OpenAI complexity.

---

## Step 3 Outcome

By the end of Step 3, a user should be able to type a question in the frontend and receive a patient-style mock response from the backend.

Expected flow:

```text
Student types a question
        |
        v
Frontend sends question to backend
        |
        v
Backend loads COPD/SOB scenario
        |
        v
Backend creates a mock patient response
        |
        v
Frontend displays the response
```

No OpenAI call happens in Step 3.

No voice feature is built in Step 3.

No instructor dashboard is built in Step 3.

No database persistence is built in Step 3.

---

## Planned Step 3 Files

The planned backend files are:

```text
codes/backend/app/schemas/
  __init__.py
  chat.py

codes/backend/app/services/
  mock_persona.py

codes/backend/app/api/
  chat.py
```

The planned frontend files are:

```text
codes/frontend/src/api/chat.ts
codes/frontend/src/pages/Chat.tsx
```

Existing files that may be updated later in Step 3:

```text
codes/backend/app/main.py
codes/frontend/src/App.tsx
```

These should be changed only when the relevant substep reaches them.

---

## What Each File Will Do

### 1. `codes/backend/app/schemas/chat.py`

This file will define the shape of the chat request and response.

Why we need it:

- It makes the backend API predictable.
- It documents what the frontend must send.
- It documents what the backend will return.
- It prepares the project for future OpenAI integration without changing the API contract.

Planned request shape:

```json
{
  "message": "What brought you in today?"
}
```

Planned response shape:

```json
{
  "reply": "I have been short of breath since this morning.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

No business logic belongs in this file.

---

### 2. `codes/backend/app/schemas/__init__.py`

This file marks the `schemas/` folder as a Python package.

Why we need it:

- It keeps API data models organized.
- It lets the chat API import the request and response schemas.

This file may stay empty.

---

### 3. `codes/backend/app/services/mock_persona.py`

This file will create a predictable mock patient response.

Why we need it:

- It lets us test the chat flow before using OpenAI.
- It keeps response logic outside the API route.
- It can use the COPD/SOB scenario data loaded in Step 2.
- It will later be replaced or extended by a real AI persona service.

Example mock behavior:

```text
If student asks about breathing:
  return a short breathless COPD patient response.

If student asks about chest pain:
  return the scenario's chest tightness disclosure.

Otherwise:
  return a generic patient-style response.
```

No OpenAI logic belongs here yet.

---

### 4. `codes/backend/app/api/chat.py`

This file will expose the backend chat endpoint.

Why we need it:

- The frontend needs an endpoint to send the student's typed question.
- The API route coordinates the request, scenario loader, and mock persona service.
- It keeps chat API logic separate from health and scenario routes.

Planned endpoint:

```text
POST /chat
```

Expected behavior:

```text
Receive student message
Load COPD/SOB scenario
Call mock persona service
Return patient-style response
```

---

### 5. `codes/frontend/src/api/chat.ts`

This file will contain the frontend function that calls the backend chat endpoint.

Why we need it:

- It keeps backend communication outside the React component.
- It gives the frontend one clear function for sending chat messages.
- It makes the UI easier to understand.

Planned function:

```text
sendChatMessage(message)
```

Expected behavior:

```text
POST message to /chat
Return backend reply
```

---

### 6. `codes/frontend/src/pages/Chat.tsx`

This file will create the first simple chat UI.

Why we need it:

- It gives the user a place to type a question.
- It shows the mock patient response.
- It proves that frontend and backend chat flow are connected.

Minimum UI:

```text
Text input
Send button
Conversation area
```

No advanced design, dashboard, voice, or transcript features belong here yet.

---

## Step 3 Small Implementation Plan

### Substep 3.1: Create Step 3 documentation

Create:

```text
codes/docs/Step3_Text_Only_Persona_Setup.md
```

Purpose:

- define the Step 3 goal
- explain every planned file before implementation
- make the build order clear

Definition of done:

- Step 3 document exists
- no app code has been changed yet

---

### Substep 3.2: Define chat flow and file responsibilities

Review this document before coding.

Purpose:

- confirm what each file will do
- confirm what Step 3 will not do
- avoid creating many files at once without understanding them

Definition of done:

- chat flow is understood
- planned files are agreed on

---

### Substep 3.3: Create request/response schemas

Create:

```text
codes/backend/app/schemas/
codes/backend/app/schemas/__init__.py
codes/backend/app/schemas/chat.py
```

Purpose:

- define `ChatRequest`
- define `ChatResponse`

Definition of done:

- schemas import successfully
- no API route has been created yet

---

### Substep 3.4: Create mock persona response service

Create:

```text
codes/backend/app/services/mock_persona.py
```

Purpose:

- generate predictable patient-style text responses
- use scenario content from Step 2

Definition of done:

- service imports successfully
- service returns a mock patient response for a test message
- no OpenAI logic is added

---

### Substep 3.5: Create chat API route

Create:

```text
codes/backend/app/api/chat.py
```

Purpose:

- expose `POST /chat`
- accept a typed student question
- return a mock patient response

Definition of done:

- route imports successfully
- route is not registered in `main.py` yet

---

### Substep 3.6: Register chat route in `main.py`

Update:

```text
codes/backend/app/main.py
```

Purpose:

- connect the chat route to the FastAPI app

Definition of done:

- `/health` still works
- `/scenarios/copd-sob` still works
- `/chat` is visible in the app routes

---

### Substep 3.7: Test backend chat route

Run backend:

```bash
cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/persona_project_clone/codes/backend
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Test endpoint:

```text
POST http://127.0.0.1:8000/chat
```

Example request:

```json
{
  "message": "What brought you in today?"
}
```

Expected result:

```json
{
  "reply": "Patient-style mock response",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

---

### Substep 3.8: Create frontend chat API client

Create:

```text
codes/frontend/src/api/chat.ts
```

Purpose:

- send typed messages to the backend `/chat` endpoint
- return patient response to the UI

Definition of done:

- frontend builds successfully
- no UI has been changed yet

---

### Substep 3.9: Create simple chat UI

Create:

```text
codes/frontend/src/pages/Chat.tsx
```

Purpose:

- provide a text input
- provide a send button
- show student and patient messages

Definition of done:

- component exists
- frontend builds successfully

---

### Substep 3.10: Connect UI to backend

Update:

```text
codes/frontend/src/App.tsx
```

Purpose:

- show the new chat page in the app
- let user type a message and see backend mock response

Definition of done:

- frontend can send message
- backend returns mock response
- UI displays response

---

### Substep 3.11: Replace mock response with OpenAI later

This is a future substep, not part of the first mock implementation.

Purpose:

- replace predictable mock response with real AI patient response

Do not do this until:

- text-only mock flow works
- prompt requirements are written
- OpenAI API key handling is confirmed
- safety rules are ready

---

## What Not To Build in Step 3

Do not build:

- OpenAI API call
- voice input/output
- instructor dashboard
- live patient-state update controls
- transcript database storage
- final report generation
- authentication
- database tables

Step 3 is only about a typed text question and a mock patient response.

---

## Step 3 Definition of Done

Step 3 is complete when:

- backend has chat schemas
- backend has mock persona response service
- backend has `POST /chat`
- frontend has a simple chat UI
- frontend can send a message to backend
- backend returns a patient-style mock response
- frontend displays the mock response
- no OpenAI, voice, dashboard, database, or report logic has been added

---

## How We Should Work on Step 3

To avoid confusion, implement only one substep at a time.

Recommended rule:

```text
Explain the file
Create the file
Test or inspect it
Summarize what changed
Move to the next substep
```

This keeps the project understandable and prevents too many new files from appearing at once.

---

# Substep 3.2 Completed: Chat Flow and File Responsibilities

## Date

June 27, 2026

## Decision

Step 3 will use a **mock text-only patient response** first. The backend will not call OpenAI yet.

This keeps the first chat implementation simple:

```text
typed question in frontend
        |
        v
POST /chat
        |
        v
backend loads COPD/SOB scenario
        |
        v
mock persona service chooses a patient-style reply
        |
        v
backend returns JSON response
        |
        v
frontend displays reply
```

## Detailed Chat Flow

### 1. User types a question

The user will type a student-style question in the frontend chat UI.

Example:

```text
What brought you in today?
```

Responsible future file:

```text
codes/frontend/src/pages/Chat.tsx
```

Why:

- This page owns the chat input and message display.
- It should not know how the backend creates the patient response.

---

### 2. Frontend sends message to backend

The frontend API client sends the typed question to the backend.

Request:

```http
POST /chat
```

Request body:

```json
{
  "message": "What brought you in today?"
}
```

Responsible future file:

```text
codes/frontend/src/api/chat.ts
```

Why:

- This file owns the network request.
- It keeps API logic out of the React component.

---

### 3. Backend validates request shape

The backend receives the request and validates that it contains a message.

Responsible future file:

```text
codes/backend/app/schemas/chat.py
```

Why:

- This file defines `ChatRequest`.
- It also defines `ChatResponse`.
- It makes the API contract clear before adding AI logic.

Planned backend models:

```text
ChatRequest
  message: string

ChatResponse
  reply: string
  scenario_id: string
  speaker: string
```

---

### 4. Backend loads the COPD/SOB scenario

The chat route will load the existing COPD/SOB scenario created in Step 2.

Responsible existing file:

```text
codes/backend/app/services/scenario_loader.py
```

Why:

- The chat route needs scenario content.
- The mock response should use the scenario as the patient source of truth.
- We should reuse the Step 2 loader instead of reading JSON directly inside the chat route.

---

### 5. Backend creates mock patient response

The mock persona service uses the student message and the scenario data to choose a predictable patient-style response.

Responsible future file:

```text
codes/backend/app/services/mock_persona.py
```

Why:

- This file owns mock patient response logic.
- The API route should not contain response-selection rules.
- This service can later be replaced by a real AI persona service.

Example mock rules:

```text
If message mentions "breath" or "shortness":
  return the scenario onset response.

If message mentions "chest" or "pain":
  return the scenario chest tightness response.

If message mentions "oxygen":
  return the scenario home oxygen response.

If message mentions "inhaler":
  return the scenario inhaler response.

Otherwise:
  return a generic patient response.
```

---

### 6. Backend returns chat response

The chat API route returns a JSON response.

Responsible future file:

```text
codes/backend/app/api/chat.py
```

Why:

- This file owns the `POST /chat` endpoint.
- It coordinates schema validation, scenario loading, and mock response generation.
- It should not contain detailed mock response rules.

Example response:

```json
{
  "reply": "I have been short of breath since this morning. It feels worse than usual.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

---

### 7. Frontend displays patient reply

The chat page adds the returned patient message to the conversation area.

Responsible future file:

```text
codes/frontend/src/pages/Chat.tsx
```

Why:

- This file owns what the user sees.
- It should show both the student message and the patient response.

---

## File Responsibility Summary

| File | Responsibility | What It Should Not Do |
|---|---|---|
| `schemas/chat.py` | define request/response shapes | choose patient replies |
| `services/scenario_loader.py` | load scenario JSON | generate chat responses |
| `services/mock_persona.py` | create mock patient reply | expose API route |
| `api/chat.py` | expose `POST /chat` | contain detailed persona rules |
| `frontend/src/api/chat.ts` | call backend chat endpoint | render UI |
| `frontend/src/pages/Chat.tsx` | render input and messages | directly load backend scenario files |
| `backend/app/main.py` | register chat router later | contain chat business logic |
| `frontend/src/App.tsx` | show chat page later | perform API calls directly |

## Boundaries for Step 3

Step 3 will build:

- text input
- backend chat request
- mock patient text response
- frontend display of the response

Step 3 will not build:

- OpenAI API integration
- voice assistant
- live instructor state controls
- transcript database
- report generation
- authentication

## Substep 3.2 Definition of Done

Substep 3.2 is complete because:

- the text-only chat flow is defined
- each planned file has a clear responsibility
- mock-first approach is confirmed
- OpenAI and voice are explicitly out of scope for this step

---

## Substep 3.4 Completed: Mock Persona Response Service

Date: June 27, 2026

Created:

```text
codes/backend/app/services/mock_persona.py
```

Purpose:

- creates a predictable patient-style reply from a student message
- uses the COPD/SOB scenario's `allowed_disclosures`
- keeps response-selection logic outside the future API route
- prepares the project for later OpenAI replacement without changing the frontend contract

Current mock behavior:

| Student message mentions | Mock patient response source |
|---|---|
| breathing, breath, shortness | scenario onset disclosure |
| chest, pain, tightness | scenario chest pain disclosure |
| oxygen, O2 | scenario home oxygen disclosure |
| inhaler, medication, medicine | scenario inhaler disclosure |
| smoking, cigarette | scenario smoking history disclosure |
| allergy, allergies | scenario allergy disclosure |
| anything else | generic shortness-of-breath response |

Validation completed:

```text
.venv/bin/python -c 'from app.services.scenario_loader import load_copd_sob_scenario; from app.services.mock_persona import build_mock_persona_response; scenario = load_copd_sob_scenario(); print(build_mock_persona_response("Do you have chest pain?", scenario)); print(build_mock_persona_response("Do you use oxygen at home?", scenario)); print(build_mock_persona_response("Hello, how are you feeling?", scenario))'
```

Expected responses were returned for chest pain, oxygen, and a generic greeting.

Compile check completed:

```text
.venv/bin/python -m compileall app
```

Substep 3.4 is complete.

---

## Substep 3.5 Completed: Chat API Route

Date: June 27, 2026

Created:

```text
codes/backend/app/api/chat.py
```

Purpose:

- defines the backend chat route
- receives a validated `ChatRequest`
- loads the COPD/SOB scenario
- calls the mock persona response service
- returns a validated `ChatResponse`

Route created:

```text
POST /chat
```

Current route behavior:

```text
Student message
    |
    v
ChatRequest validation
    |
    v
Load COPD/SOB scenario
    |
    v
Build mock patient reply
    |
    v
Return ChatResponse
```

Important boundary:

The route file is created, but it is not connected to the FastAPI app yet. Registration in `main.py` belongs to Substep 3.6.

Validation completed:

```text
.venv/bin/python -c 'import asyncio; from app.api.chat import create_chat_response; from app.schemas.chat import ChatRequest; response = asyncio.run(create_chat_response(ChatRequest(message="Do you have chest pain?"))); print(response.model_dump())'
```

Expected result:

```text
{
  "reply": "It is not sharp pain, but my chest feels tight when I try to breathe.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

Compile check completed:

```text
.venv/bin/python -m compileall app
```

Substep 3.5 is complete.

---

## Substep 3.6 Completed: Register Chat Route

Date: June 27, 2026

Updated:

```text
codes/backend/app/main.py
```

Purpose:

- imports the chat router from `app.api.chat`
- registers the chat router with the FastAPI app
- makes `POST /chat` available as a real backend endpoint

What changed:

```text
main.py
  |
  |-- includes health router
  |-- includes scenarios router
  |-- includes chat router
```

Validation completed:

```text
.venv/bin/python -c 'from app.main import app; print([route.path for route in app.routes if hasattr(route, "path")])'
```

Confirmed route list includes:

```text
/chat
```

Compile check completed:

```text
.venv/bin/python -m compileall app
```

Substep 3.6 is complete.

---

## Substep 3.7 Completed: Test Backend Chat Route

Date: June 27, 2026

Purpose:

- confirm the backend app can serve the registered `/chat` route over HTTP
- confirm valid student messages return mock patient responses
- confirm invalid messages are rejected by the request schema
- confirm no OpenAI API key is needed for the mock chat route

Important note:

Step 3.7 does not use OpenAI. The response comes from:

```text
POST /chat
    |
    v
ChatRequest schema
    |
    v
COPD/SOB scenario JSON
    |
    v
mock_persona.py
    |
    v
ChatResponse schema
```

Backend server command used:

```text
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Test 1: chest pain question

```text
curl -s -X POST http://127.0.0.1:8000/chat -H 'Content-Type: application/json' -d '{"message":"Do you have chest pain?"}'
```

Result:

```json
{
  "reply": "It is not sharp pain, but my chest feels tight when I try to breathe.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

Test 2: oxygen question

```text
curl -s -X POST http://127.0.0.1:8000/chat -H 'Content-Type: application/json' -d '{"message":"Do you use oxygen at home?"}'
```

Result:

```json
{
  "reply": "I sometimes use oxygen at night, but I do not usually need it during the day.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

Test 3: empty message validation

```text
curl -s -X POST http://127.0.0.1:8000/chat -H 'Content-Type: application/json' -d '{"message":""}'
```

Result:

```text
422 Unprocessable Content
```

Reason:

The `ChatRequest` schema requires `message` to contain at least one character.

Substep 3.7 is complete.

---

## Substep 3.8 Completed: Frontend Chat API Client

Date: June 27, 2026

Created:

```text
codes/frontend/src/api/chat.ts
```

Updated:

```text
codes/frontend/src/api/client.ts
```

Purpose:

- gives the frontend one typed function for sending chat messages
- keeps backend communication outside React page components
- matches the backend `POST /chat` request and response contract
- prepares the project for the future chat UI in Substep 3.9

New frontend function:

```text
sendChatMessage(message)
```

Current frontend chat API flow:

```text
React page later calls sendChatMessage(message)
    |
    v
chat.ts sends POST /chat
    |
    v
backend returns ChatResponse
    |
    v
chat.ts returns the response to the React page
```

Request body sent by frontend:

```json
{
  "message": "Do you have chest pain?"
}
```

Expected response shape:

```json
{
  "reply": "It is not sharp pain, but my chest feels tight when I try to breathe.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

Important boundary:

Substep 3.8 does not create the chat screen. It only creates the frontend API helper that the future chat screen will use.

Validation completed:

```text
npm run build
```

Result:

```text
TypeScript and Vite build completed successfully.
```

Substep 3.8 is complete.

---

## Substep 3.9 Completed: Simple Chat UI

Date: June 27, 2026

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

- creates the first visible text-only patient conversation screen
- gives the student a message input and Send button
- displays patient and student messages in a conversation area
- proves the UI behavior before connecting to the backend

Current UI behavior:

```text
Student types message
    |
    v
Student clicks Send
    |
    v
Student message appears in conversation
    |
    v
Local placeholder patient response appears
```

Important boundary:

Substep 3.9 does not call the backend yet. The local placeholder response will be replaced by `sendChatMessage(message)` in Substep 3.10.

Validation completed:

```text
npm run build
```

Result:

```text
TypeScript and Vite build completed successfully.
```

Substep 3.9 is complete.

---

## Substep 3.10 Completed: Connect UI to Backend

Date: June 27, 2026

Updated:

```text
codes/frontend/src/pages/Chat.tsx
codes/frontend/src/styles.css
```

Purpose:

- replaces the local placeholder patient response with the real backend mock response
- uses `sendChatMessage(message)` from `codes/frontend/src/api/chat.ts`
- shows a sending state while waiting for the backend
- shows an error message if the backend request fails

Current connected flow:

```text
Student types message in Chat.tsx
    |
    v
Student clicks Send
    |
    v
Chat.tsx calls sendChatMessage(message)
    |
    v
chat.ts sends POST /chat
    |
    v
FastAPI loads COPD/SOB scenario
    |
    v
mock_persona.py creates patient reply
    |
    v
Chat.tsx displays patient reply
```

Important note:

This is still a mock persona response. OpenAI is not used yet, and no OpenAI API key is required.

Validation completed:

```text
npm run build
```

Result:

```text
TypeScript and Vite build completed successfully.
```

CORS validation completed:

```text
curl -s -i -X OPTIONS http://127.0.0.1:8000/chat -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST'
```

Confirmed:

```text
access-control-allow-origin: http://localhost:5173
```

Backend chat validation completed:

```text
curl -s -X POST http://127.0.0.1:8000/chat -H 'Content-Type: application/json' -H 'Origin: http://localhost:5173' -d '{"message":"Do you use an inhaler?"}'
```

Result:

```json
{
  "reply": "I used my rescue inhaler earlier, but it did not help much.",
  "scenario_id": "copd-sob",
  "speaker": "patient"
}
```

Substep 3.10 is complete.
