import json
import logging
import re
from typing import Any, Dict, List, Optional

import google.generativeai as genai
import speech_recognition as sr
from fastapi import UploadFile

from app.core.config import settings
from app.services.ai_strategies import (
    EventTextStrategy,
    EventVoiceStrategy,
    ExpenseReceiptStrategy,
    ExpenseTextStrategy,
    ExpenseVoiceStrategy,
    SpendingInsightsStrategy,
    TaskTextStrategy,
    TaskVoiceStrategy,
)
from app.services.ai_strategies.base import AIStrategy

logger = logging.getLogger(__name__)


# Strategy pattern Context Class

class GeminiAIService:
    """AI service that delegates behavior to interchangeable strategies."""

    def __init__(self) -> None:
        if not settings.google_api_key:
            raise ValueError("Google API key not configured")

        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel("gemini-3-flash-preview")
        self.recognizer = sr.Recognizer()
        self._strategies: Dict[str, AIStrategy] = {}
        self._register_default_strategies()

    
    # self._strategies = {
    #     "parse_text_expense": ExpenseTextStrategy(...),
    #     "parse_receipt_image": ExpenseReceiptStrategy(...),
    #     "parse_voice_expense": ExpenseVoiceStrategy(...),
    #     "parse_text_task": TaskTextStrategy(...),
    #     ...
    #     "get_spending_insights": SpendingInsightsStrategy(...),
    # }

    
    def _register_default_strategies(self) -> None:
        """Register the built-in strategies for AI features."""
        for strategy in (
            ExpenseTextStrategy(),
            ExpenseReceiptStrategy(),
            ExpenseVoiceStrategy(),
            TaskTextStrategy(),
            TaskVoiceStrategy(),
            EventTextStrategy(),
            EventVoiceStrategy(),
            SpendingInsightsStrategy(),
        ):
            self.register_strategy(strategy)

    def register_strategy(self, strategy: AIStrategy, *, override: bool = True) -> None:
        """Register a strategy instance for later execution."""
        if not override and strategy.name in self._strategies:
            raise ValueError(f"Strategy '{strategy.name}' already registered")
        self._strategies[strategy.name] = strategy

    
    
    
    
    def get_strategy(self, name: str) -> AIStrategy:
        """Retrieve a registered strategy by name."""
        try:
            return self._strategies[name]
        except KeyError as exc:  
            raise ValueError(f"No strategy registered for '{name}'") from exc

    async def _execute_strategy(self, name: str, **kwargs: Any) -> Dict[str, Any]:
        strategy = self._strategies.get(name)
        if strategy is None:
            raise ValueError(f"No strategy registered for '{name}'")
        return await strategy.execute(self, **kwargs)

    
    
    
    async def parse_text_expense(self, text: str) -> Dict[str, Any]:
        return await self._execute_strategy("parse_text_expense", text=text)

    async def parse_receipt_image(self, image_file: UploadFile) -> Dict[str, Any]:
        return await self._execute_strategy("parse_receipt_image", image_file=image_file)

    async def parse_voice_expense(self, audio_file: UploadFile) -> Dict[str, Any]:
        return await self._execute_strategy("parse_voice_expense", audio_file=audio_file)

    async def parse_text_task(self, text: str) -> Dict[str, Any]:
        return await self._execute_strategy("parse_text_task", text=text)

    async def parse_voice_task(self, audio_file: UploadFile) -> Dict[str, Any]:
        return await self._execute_strategy("parse_voice_task", audio_file=audio_file)

    async def parse_text_event(self, text: str) -> Dict[str, Any]:
        return await self._execute_strategy("parse_text_event", text=text)

    async def parse_voice_event(self, audio_file: UploadFile) -> Dict[str, Any]:
        return await self._execute_strategy("parse_voice_event", audio_file=audio_file)

    async def get_spending_insights(self, expenses_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        return await self._execute_strategy("get_spending_insights", expenses_data=expenses_data)

    
    
    def parse_json_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Extract the first JSON object from the model response."""
        try:
            cleaned_text = re.sub(r"```json\s*|\s*```", "", response_text)
            cleaned_text = re.sub(r"```\s*|\s*```", "", cleaned_text)
            json_match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return None
        except json.JSONDecodeError as exc:
            logger.error("JSON decode error: %s", exc)
            return None
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error extracting JSON: %s", exc)
            return None



ai_service = GeminiAIService()
