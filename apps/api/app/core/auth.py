from __future__ import annotations

from collections.abc import Callable

import httpx
from fastapi import Depends, Header, HTTPException, Request, status
from pydantic import BaseModel

from app.core.config import Settings, get_settings


class CurrentUser(BaseModel):
    user_id: str
    role: str
    display_name: str
    organization_id: str
    class_ids: list[str]
    student_id: str | None = None


def _mock_user(role: str = "student") -> CurrentUser:
    if role == "teacher":
        return CurrentUser(
            user_id="mock_teacher_001",
            role="teacher",
            display_name="Ms. Chen",
            organization_id="org_demo",
            class_ids=["class_g7_a", "class_104"],
        )
    if role == "curriculum_researcher":
        return CurrentUser(
            user_id="mock_researcher_001",
            role="curriculum_researcher",
            display_name="Curriculum Researcher",
            organization_id="org_demo",
            class_ids=[],
        )
    if role == "admin":
        return CurrentUser(
            user_id="mock_admin_001",
            role="admin",
            display_name="System Admin",
            organization_id="org_demo",
            class_ids=[],
        )
    if role == "expert":
        return CurrentUser(
            user_id="mock_expert_001",
            role="expert",
            display_name="Expert Reviewer",
            organization_id="org_demo",
            class_ids=[],
        )
    return CurrentUser(
        user_id="mock_student_user_001",
        role="student",
        display_name="Xiaoming Zhang",
        organization_id="org_demo",
        class_ids=["class_104"],
        student_id="stu_persona_a",
    )


async def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None),
    x_mock_role: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if settings.adaptlearn_dev_mock_auth:
        return _mock_user(x_mock_role or "student")

    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase auth is not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": settings.supabase_publishable_key,
                "authorization": authorization,
            },
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase token")

    auth_user = response.json()
    request.state.supabase_auth_user = auth_user
    metadata = auth_user.get("user_metadata") or {}
    role = metadata.get("role", "student")
    student_id = metadata.get("student_id") if role == "student" else None
    return CurrentUser(
        user_id=auth_user["id"],
        role=role,
        display_name=metadata.get("display_name", auth_user.get("email", "AdaptLearn user")),
        organization_id=metadata.get("organization_id", "org_demo"),
        class_ids=metadata.get("class_ids", ["class_104"] if role in {"student", "teacher"} else []),
        student_id=student_id,
    )


def require_role(*roles: str) -> Callable[[CurrentUser], CurrentUser]:
    def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return dependency


def require_student(user: CurrentUser = Depends(require_role("student"))) -> CurrentUser:
    if not user.student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student scope missing")
    return user


def require_staff(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role not in {"teacher", "curriculum_researcher", "expert", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff scope required")
    return user
