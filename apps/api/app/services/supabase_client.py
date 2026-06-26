from __future__ import annotations

from app.core.config import Settings


def create_backend_supabase_client(settings: Settings):
    if not settings.supabase_url or not settings.supabase_secret_key:
        return None
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_secret_key)
