from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.scenarios import router as scenarios_router
from app.api.state import router as state_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(scenarios_router)
app.include_router(chat_router)
app.include_router(state_router)


# cd /Users/farhatjahan/Desktop/YU/summer26/YU_internship/Sim_Intern/persona_project/codes/backend

# ../../persona/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
