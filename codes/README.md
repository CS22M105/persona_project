# AI Patient Voice Persona

Standalone instructor-cued AI patient voice demo for nursing simulation. Phase 1 does not include direct Laerdal/LLEAP/SimCapture integration.

## Structure

```text
codes/
  backend/
    app/
      api/
      core/
      main.py
    .env.example
    requirements.txt
  frontend/
    src/
      api/
      pages/
    .env.example
    package.json
  docs/
  docx/
```

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```text
http://localhost:8000/health
```

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Secret Handling

Commit `.env.example` files as templates. Create `.env` files locally only when values need to be overridden, and do not commit real `.env` files or API keys. Keep real OpenAI credentials only in local environment files or a production secrets manager.
