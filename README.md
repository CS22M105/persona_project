# Sim_Intern
I am working as an AI intern in the Nursing department.

Use these commands from your terminal. Keep API key inside `codes/backend/.env`; do not paste it into frontend or GitHub.

**Terminal 1: Backend**

```bash
cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/persona_project_clone/codes/backend

source .venv/bin/activate

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2: Frontend**

```bash
cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/persona_project_clone/codes/frontend

npm run dev -- --host 127.0.0.1
```

Then open:

```text
Instructor dashboard:
http://127.0.0.1:5173/

Voice room:
http://127.0.0.1:5173/voice
```

Quick backend test:

```bash
curl http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok","service":"ai-patient-voice-backend"}
```
