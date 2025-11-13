from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.ai_service import GeminiAIService


class AIStrategy(ABC):
    """Base interface for AI feature strategies."""

    def __init__(self, name: str) -> None:
        self._name = name

    @property
    def name(self) -> str:
        return self._name

    @abstractmethod
    async def execute(self, service: "GeminiAIService", **kwargs: Any) -> Dict[str, Any]:
        """Run the strategy using the shared AI service resources."""
        raise NotImplementedError
