# Step 2: Define the First Scenario

## Purpose

Step 2 defines the first simulation scenario as structured data before we build any AI chat, patient-state manager, dashboard, or voice features.

The goal is to create one clear, readable COPD/shortness-of-breath scenario that the backend can load later. This scenario will become the source of truth for:

- who the patient is
- what symptoms the patient has
- what information the patient can reveal
- what the initial patient state is
- what instructor cues are available
- what safety rules the AI must follow

This step should be done slowly and file-by-file so it is clear what each file does and why it exists.

---

## Step 2 Outcome

By the end of Step 2, the project should have a structured COPD/SOB scenario file and a simple backend way to load it.

No AI call happens in Step 2.

No frontend dashboard is built in Step 2.

No voice feature is built in Step 2.

---

## Recommended Step 2 Files

The planned files are:

```text
codes/backend/app/scenarios/
  __init__.py
  copd_sob.json

codes/backend/app/services/
  __init__.py
  scenario_loader.py

codes/backend/app/api/
  scenarios.py
```

These files should be created one at a time.

---

## What Each File Will Do

### 1. `codes/backend/app/scenarios/copd_sob.json`

This file stores the COPD/SOB scenario as data.

Why we need it:

- It keeps the patient scenario separate from Python code.
- It is easier to read and edit.
- Faculty or instructors can review it later.
- The future AI persona engine can use it as the patient source of truth.

It will contain:

- scenario ID
- scenario name
- learning objectives
- patient profile
- chief complaint
- background
- initial vitals
- initial symptoms
- hidden information
- allowed disclosures
- instructor cues
- safety rules
- assessment checklist

This is the most important file in Step 2.

---

### 2. `codes/backend/app/scenarios/__init__.py`

This file marks the `scenarios/` folder as a Python package.

Why we need it:

- It lets backend code reliably refer to the scenario folder.
- It keeps the project structure clean.
- It prepares the folder for future scenario-related code if needed.

This file may stay empty.

---

### 3. `codes/backend/app/services/scenario_loader.py`

This file will load the scenario JSON from disk.

Why we need it:

- The API should not directly read files by itself.
- The loading logic should live in one place.
- Later, if scenarios move from JSON files into a database, only this service needs to change.

It will be responsible for:

- finding the `copd_sob.json` file
- reading it
- parsing it into a Python dictionary
- returning it to the API layer

No AI logic belongs here.

---

### 4. `codes/backend/app/services/__init__.py`

This file marks the `services/` folder as a Python package.

Why we need it:

- It keeps backend service code organized.
- It lets the API import `scenario_loader.py`.

This file may stay empty.

---

### 5. `codes/backend/app/api/scenarios.py`

This file will expose a simple backend endpoint for the scenario.

Why we need it:

- The frontend will eventually need to ask the backend, "What scenario is available?"
- This gives us a clean way to test that the backend can load scenario data.
- It prepares the project for Step 3, where the text-only persona will use the scenario.

Planned endpoint:

```text
GET /scenarios/copd-sob
```

Expected result:

```text
Backend returns the COPD/SOB scenario JSON.
```

No AI response generation belongs here.

---

## Step 2 Small Implementation Plan

### Substep 2.1: Create the scenario folder

Create:

```text
codes/backend/app/scenarios/
```

Purpose:

- gives the backend a dedicated place for scenario definitions

Do not create scenario content yet.

---

### Substep 2.2: Create the COPD/SOB scenario JSON

Create:

```text
codes/backend/app/scenarios/copd_sob.json
```

Purpose:

- stores the first patient scenario as structured data

Minimum sections:

```text
scenario_id
scenario_name
patient_profile
chief_complaint
initial_state
allowed_disclosures
hidden_information
instructor_cues
safety_rules
assessment_checklist
```

Definition of done:

- JSON is valid
- scenario is readable
- no code imports it yet

---

### Substep 2.3: Create the scenario loader service

Create:

```text
codes/backend/app/services/scenario_loader.py
```

Purpose:

- loads scenario JSON from disk
- keeps file-reading logic outside the API route

Definition of done:

- backend can load the JSON file using Python
- loader returns a dictionary
- no frontend changes yet

---

### Substep 2.4: Add the scenario API route

Create:

```text
codes/backend/app/api/scenarios.py
```

Purpose:

- exposes the scenario through the backend

Planned endpoint:

```text
GET /scenarios/copd-sob
```

Definition of done:

- backend returns the scenario JSON from the endpoint
- route does not call AI
- route does not modify state

---

### Substep 2.5: Register the route in `main.py`

Update:

```text
codes/backend/app/main.py
```

Purpose:

- connects the new scenario route to the FastAPI app

Definition of done:

- `/health` still works
- `/scenarios/copd-sob` works

---

### Substep 2.6: Test the scenario endpoint

Run backend:

```bash
cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/codes/backend
../../persona/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Test endpoint:

```text
http://127.0.0.1:8000/scenarios/copd-sob
```

Expected result:

```text
The browser shows the COPD/SOB scenario JSON.
```

---

## What Not To Build in Step 2

Do not build:

- AI chat
- OpenAI API calls
- voice input/output
- instructor dashboard
- patient state update logic
- transcript storage
- report generation
- authentication
- database tables

Step 2 is only about defining and loading the first scenario.

---

## Step 2 Definition of Done

Step 2 is complete when:

- `copd_sob.json` exists
- scenario JSON is valid
- backend has a scenario loader service
- backend has a scenario API route
- `/health` still works
- `/scenarios/copd-sob` returns the scenario
- no AI, voice, dashboard, or database logic has been added

---

## How We Should Work on Step 2

To avoid confusion, implement only one substep at a time.

Recommended order:

```text
1. Create scenarios folder
2. Create copd_sob.json
3. Explain and test the JSON
4. Create scenario_loader.py
5. Explain and test the loader
6. Create scenarios.py route
7. Register route in main.py
8. Test endpoint in browser
```

After each substep, pause and confirm what changed, why it was needed, and how it connects to the previous files.

