from typing import Optional
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.session import SimulationSession, utc_now


ACTIVE_SESSION_STATUSES = ("active", "paused", "takeover")


class SessionNotFoundError(ValueError):
    pass


def start_session(
    db: Session,
    scenario_id: str = "copd-sob",
) -> SimulationSession:
    active_session = get_active_session(db)

    if active_session is not None:
        return active_session

    session = SimulationSession(
        session_id=f"session-{uuid4()}",
        scenario_id=scenario_id,
        status="active",
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def start_fresh_session(
    db: Session,
    scenario_id: str = "copd-sob",
) -> SimulationSession:
    active_session = get_active_session(db)

    if active_session is not None:
        now = utc_now()
        active_session.status = "ended"
        active_session.ended_at = now
        active_session.updated_at = now
        db.add(active_session)
        db.flush()

    session = SimulationSession(
        session_id=f"session-{uuid4()}",
        scenario_id=scenario_id,
        status="active",
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def get_active_session(db: Session) -> Optional[SimulationSession]:
    statement = (
        select(SimulationSession)
        .where(SimulationSession.status.in_(ACTIVE_SESSION_STATUSES))
        .order_by(SimulationSession.started_at.desc())
    )

    return db.scalars(statement).first()


def get_session_by_id(
    db: Session,
    session_id: str,
) -> Optional[SimulationSession]:
    return db.get(SimulationSession, session_id)


def end_session(
    db: Session,
    session_id: str,
) -> SimulationSession:
    session = get_session_by_id(db, session_id)

    if session is None:
        raise SessionNotFoundError(f"Session not found: {session_id}")

    if session.status == "ended":
        return session

    now = utc_now()
    session.status = "ended"
    session.ended_at = now
    session.updated_at = now

    db.add(session)
    db.commit()
    db.refresh(session)

    return session
