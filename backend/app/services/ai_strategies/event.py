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

from app.services.ai_strategies.base import AIStrategy

if TYPE_CHECKING:
    from app.services.ai_service import GeminiAIService

logger = logging.getLogger(__name__)


class EventTextStrategy(AIStrategy):
    """Handle natural language event parsing."""

    def __init__(self) -> None:
        super().__init__("parse_text_event")

    async def execute(self, service: "GeminiAIService", **kwargs: Any) -> Dict[str, Any]:
        text: str = kwargs.get("text", "").strip()
        if not text:
            raise HTTPException(status_code=422, detail="Text input is required for event parsing")

        try:
            prompt = self._build_prompt() + f"\n\nInput text: {text}"
            response = service.model.generate_content(prompt)
            raw_result = service.parse_json_response(response.text)
            return self._normalize_result(raw_result)
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error parsing text event: %s", exc)
            raise HTTPException(status_code=500, detail=f"AI processing error: {exc}")

    def _build_prompt(self) -> str:
        return f"""
You are an expert calendar assistant. Parse the given input and extract event information.

FIRST, determine if the input is related to an event, meeting, appointment, or calendar entry.
If the input is NOT event-related (like greetings, random chat, questions, etc.), return:
{{
    \"is_event_related\": false,
    \"confidence\": 0,
    \"message\": \"The input doesn't appear to be event-related. Please describe a meeting, appointment, or calendar event.\"
}}

If the input IS event-related, return a valid JSON object with this structure:
{{
    \"is_event_related\": true,
    \"title\": string (required),
    \"description\": string (optional),
    \"start_time\": \"YYYY-MM-DDTHH:MM:SS\" (required if possible),
    \"end_time\": \"YYYY-MM-DDTHH:MM:SS\" (required if possible),
    \"location\": string (optional),
    \"tags\": [list of strings] (optional),
    \"is_all_day\": bool (optional, default: false),
    \"reminder_minutes\": int (optional),
    \"recurrence_rule\": string (optional),
    \"color\": string (optional, hex color code),
    \"confidence\": float between 0 and 1
}}

Rules for event-related inputs:
1. If title or time is not clear, return confidence < 0.5
2. Always extract start/end time if mentioned (e.g., today, tomorrow, next week, 3pm, etc.)
3. Use tags if hashtags or keywords are present
4. Default is_all_day to false unless clearly all-day
5. If the input is a question or greeting, mark is_event_related as false

Examples of event-related inputs:
- \"Lunch with Sarah at 1pm tomorrow\"
- \"Doctor appointment on Friday at 10am\"
- \"Project meeting next Monday 3-4pm\"
- \"Vacation from July 1st to July 5th\"
- \"All-day conference on 15th\"

Examples of NON event-related inputs:
- \"hi there\"
- \"what's the weather\"
- \"tell me a joke\"
- General conversation

Current date and time: {datetime.now().isoformat()}
"""

    def _normalize_result(self, result: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not result:
            raise HTTPException(status_code=400, detail="Failed to parse event from text")

        if not result.get("is_event_related", True):
            return {
                "is_event_related": False,
                "confidence": 0,
                "message": result.get(
                    "message",
                    "The input doesn't appear to be event-related. Please describe a meeting, appointment, or calendar event.",
                ),
            }

        if not result.get("title"):
            logger.error("Missing required fields in AI event response: %s", result)
            raise HTTPException(status_code=400, detail="Failed to parse event from text")

        if "confidence" not in result:
            result["confidence"] = 0.8

        for time_field in ["start_time", "end_time"]:
            value = result.get(time_field)
            if value:
                try:
                    parsed_dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
                    result[time_field] = parsed_dt.isoformat()
                except ValueError:
                    result[time_field] = None

        tags = result.get("tags")
        if tags and not isinstance(tags, list):
            try:
                parsed_tags = json.loads(tags)
                result["tags"] = parsed_tags if isinstance(parsed_tags, list) else []
            except json.JSONDecodeError:
                result["tags"] = []

        return result


class EventVoiceStrategy(AIStrategy):
    """Handle voice recording event parsing."""

    def __init__(self) -> None:
        super().__init__("parse_voice_event")

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

            logger.info("Transcribed event text: %s", text)
            result = await service.parse_text_event(text)
            result["transcribed_text"] = text
            return result
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error parsing voice event: %s", exc)
            raise HTTPException(status_code=500, detail=f"Voice processing error: {exc}")
        finally:
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)
