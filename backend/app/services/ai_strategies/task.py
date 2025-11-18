from __future__ import annotations

import json
import logging
import os
import tempfile
from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING

from fastapi import HTTPException, UploadFile
from pydub import AudioSegment
import speech_recognition as sr

from app.schemas.tasks import TaskPriority, TaskStatus
from app.services.ai_strategies.base import AIStrategy

if TYPE_CHECKING:
    from app.services.ai_service import GeminiAIService

logger = logging.getLogger(__name__)


class TaskTextStrategy(AIStrategy):
    """Handle natural language task parsing."""

    def __init__(self) -> None:
        super().__init__("parse_text_task")

    async def execute(self, service: "GeminiAIService", **kwargs: Any) -> Dict[str, Any]:
        text: str = kwargs.get("text", "").strip()
        if not text:
            raise HTTPException(status_code=422, detail="Text input is required for task parsing")

        try:
            prompt = self._build_prompt() + f"\n\nInput text: {text}"
            response = service.model.generate_content(prompt)
            raw_result = service.parse_json_response(response.text)
            return self._normalize_result(raw_result)
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error parsing text task: %s", exc)
            raise HTTPException(status_code=500, detail=f"AI processing error: {exc}")

    def _build_prompt(self) -> str:
        priorities = [p.value for p in TaskPriority]
        statuses = [s.value for s in TaskStatus]
        return f"""
You are an expert productivity assistant. Parse the given input and extract task information.

FIRST, determine if the input is related to a task, to-do, reminder, or actionable item.
If the input is NOT task-related (like greetings, random chat, questions, etc.), return:
{{
    "is_task_related": false,
    "confidence": 0,
    "message": "The input doesn't appear to be task-related. Please describe a to-do, reminder, or actionable item."
}}

If the input IS task-related, return a valid JSON object with this structure:
{{
    "is_task_related": true,
    "title": string (required),
    "description": string (optional),
    "due_date": "YYYY-MM-DDTHH:MM:SS" (optional),
    "priority": one of {priorities} (optional, default: medium),
    "status": one of {statuses} (optional, default: pending),
    "tags": [list of strings] (optional),
    "confidence": float between 0 and 1
}}

Rules for task-related inputs:
1. If title is not clear, return confidence < 0.5
2. Always extract due date if mentioned (e.g., today, tomorrow, next week)
3. Use tags if hashtags or keywords are present
4. Default priority is medium, status is pending
5. If the input is a question or greeting, mark is_task_related as false

Examples of task-related inputs:
- "Finish the project report by Friday"
- "Call the bank tomorrow"
- "#work Prepare slides for Monday meeting"
- "Buy groceries"
- "Schedule dentist appointment next week"

Examples of NON task-related inputs:
- "hi there"
- "what's the weather"
- "tell me a joke"
- General conversation

Current date and time: {datetime.now().isoformat()}
"""

    def _normalize_result(self, result: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not result:
            raise HTTPException(status_code=400, detail="Failed to parse task from text")

        if not result.get("is_task_related", True):
            return {
                "is_task_related": False,
                "confidence": 0,
                "message": result.get(
                    "message",
                    "The input doesn't appear to be task-related. Please describe a to-do, reminder, or actionable item.",
                ),
            }

        if not result.get("title"):
            logger.error("Missing required fields in AI task response: %s", result)
            raise HTTPException(status_code=400, detail="Failed to parse task from text")

        if "confidence" not in result:
            result["confidence"] = 0.8

        valid_priorities = {p.value for p in TaskPriority}
        if result.get("priority") not in valid_priorities:
            result["priority"] = TaskPriority.medium.value

        valid_statuses = {s.value for s in TaskStatus}
        if result.get("status") not in valid_statuses:
            result["status"] = TaskStatus.pending.value

        due_date = result.get("due_date")
        if due_date:
            try:
                parsed_dt = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
                result["due_date"] = parsed_dt.isoformat()
            except ValueError:
                result["due_date"] = None
        else:
            result["due_date"] = None

        tags = result.get("tags")
        if tags and not isinstance(tags, list):
            try:
                parsed_tags = json.loads(tags)
                result["tags"] = parsed_tags if isinstance(parsed_tags, list) else []
            except json.JSONDecodeError:
                result["tags"] = []

        return result


class TaskVoiceStrategy(AIStrategy):
    """Handle voice recording task parsing."""

    def __init__(self) -> None:
        super().__init__("parse_voice_task")

    async def execute(self, service: "GeminiAIService", **kwargs: Any) -> Dict[str, Any]:
        audio_file: UploadFile = kwargs.get("audio_file")  # type: ignore[assignment]
        if audio_file is None:
            raise HTTPException(status_code=422, detail="Audio file is required")

        temp_audio_path = ""
        wav_path = ""
        try:
            audio_data = await audio_file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file.write(audio_data)
                temp_audio_path = temp_file.name

            audio = AudioSegment.from_file(temp_audio_path)
            wav_path = temp_audio_path.replace(".wav", "_converted.wav")
            audio.export(wav_path, format="wav")

            with sr.AudioFile(wav_path) as source:
                recorded = service.recognizer.record(source)

            try:
                text = service.recognizer.recognize_google(recorded)
            except sr.UnknownValueError:
                try:
                    text = service.recognizer.recognize_sphinx(recorded)
                except Exception as err:  # pragma: no cover - transcription fallback
                    raise HTTPException(status_code=400, detail="Could not transcribe audio") from err

            logger.info("Transcribed task text: %s", text)
            result = await service.parse_text_task(text)
            result["transcribed_text"] = text
            return result
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error parsing voice task: %s", exc)
            raise HTTPException(status_code=500, detail=f"Voice processing error: {exc}")
        finally:
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)
