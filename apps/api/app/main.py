from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.audit import RequestTraceMiddleware
from app.core.config import get_settings
from app.routers import admin, agent, dev, foundation, lms, media, rag, student

settings = get_settings()

app = FastAPI(
    title="AdaptLearn Student API",
    version="0.1.0",
    description="Production-oriented skeleton for Supabase, Next.js, FastAPI, OpenAI Agent/RAG, and LMS integration.",
)

app.add_middleware(RequestTraceMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student.router)
app.include_router(admin.router)
app.include_router(dev.router)
app.include_router(foundation.router)
app.include_router(media.router)
app.include_router(rag.router)
app.include_router(agent.router)
app.include_router(lms.router)


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "supabaseRegion": settings.supabase_region,
        "pgvectorExpected": settings.supabase_enable_pgvector,
        "openaiAdapter": "openai" if settings.openai_api_key else "mock",
        "mockDataRetentionDays": settings.mock_data_retention_days,
    }
