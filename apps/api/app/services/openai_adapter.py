from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod
from typing import BinaryIO

from app.core.config import Settings


class BaseOpenAIAdapter(ABC):
    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        raise NotImplementedError

    @abstractmethod
    async def transcribe_audio(self, file_obj: BinaryIO, filename: str) -> dict[str, object]:
        raise NotImplementedError

    @abstractmethod
    async def generate_feedback(self, prompt: str) -> dict[str, object]:
        raise NotImplementedError


class MockOpenAIAdapter(BaseOpenAIAdapter):
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def embed_text(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values = []
        for index in range(self.settings.openai_embedding_dimensions):
            byte = digest[index % len(digest)]
            values.append((byte / 255.0) - 0.5)
        return values

    async def transcribe_audio(self, file_obj: BinaryIO, filename: str) -> dict[str, object]:
        return {
            "model": self.settings.openai_transcribe_model,
            "transcript": "Mock transcript: sunlight helps leaves make glucose and release oxygen.",
            "confidenceMetadata": {"mock": True, "filename": filename},
        }

    async def generate_feedback(self, prompt: str) -> dict[str, object]:
        return {
            "model": self.settings.openai_agent_model,
            "feedback": "Mock formative feedback generated without calling OpenAI.",
            "safetyStatus": "pass",
            "promptPreview": prompt[:120],
        }


class OpenAIAdapter(BaseOpenAIAdapter):
    def __init__(self, settings: Settings) -> None:
        from openai import AsyncOpenAI

        self.settings = settings
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def embed_text(self, text: str) -> list[float]:
        response = await self.client.embeddings.create(
            model=self.settings.openai_embedding_model,
            input=text,
            dimensions=self.settings.openai_embedding_dimensions,
        )
        return list(response.data[0].embedding)

    async def transcribe_audio(self, file_obj: BinaryIO, filename: str) -> dict[str, object]:
        response = await self.client.audio.transcriptions.create(
            model=self.settings.openai_transcribe_model,
            file=(filename, file_obj),
        )
        return {
            "model": self.settings.openai_transcribe_model,
            "transcript": response.text,
            "confidenceMetadata": {"mock": False},
        }

    async def generate_feedback(self, prompt: str) -> dict[str, object]:
        response = await self.client.responses.create(
            model=self.settings.openai_agent_model,
            input=prompt,
        )
        return {
            "model": self.settings.openai_agent_model,
            "feedback": response.output_text,
            "safetyStatus": "pass",
        }


def get_openai_adapter(settings: Settings) -> BaseOpenAIAdapter:
    if not settings.openai_api_key:
        return MockOpenAIAdapter(settings)
    return OpenAIAdapter(settings)
