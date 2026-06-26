from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.core.config import Settings
from app.services.mock_store import store


class LmsAdapter(Protocol):
    async def sync_object(
        self,
        object_type: str,
        object_id: str,
        direction: str,
        *,
        trace_id: str | None = None,
    ) -> dict[str, object]:
        ...


@dataclass
class MockLmsAdapter:
    settings: Settings

    async def sync_object(
        self,
        object_type: str,
        object_id: str,
        direction: str,
        *,
        trace_id: str | None = None,
    ) -> dict[str, object]:
        return store.create_lms_sync(object_type=object_type, object_id=object_id, direction=direction, trace_id=trace_id)


def get_lms_adapter(settings: Settings) -> LmsAdapter:
    return MockLmsAdapter(settings)
