from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import Settings, get_settings
from app.services.mock_store import store

router = APIRouter(prefix="/v1/dev", tags=["dev"])


@router.post("/reset")
async def reset_mock_store(settings: Settings = Depends(get_settings)) -> dict[str, object]:
    if not settings.adaptlearn_dev_mock_auth:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Dev reset is available only in mock auth mode")
    store.reset()
    return {"ok": True}
