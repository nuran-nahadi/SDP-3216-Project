from __future__ import annotations

import io
import logging
import os
import tempfile
from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING

from fastapi import HTTPException, UploadFile
from PIL import Image
from pydub import AudioSegment
import speech_recognition as sr

from app.schemas.expenses import ExpenseCategory, PaymentMethod
from app.services.ai_strategies.base import AIStrategy

if TYPE_CHECKING:
    from app.services.ai_service import GeminiAIService

logger = logging.getLogger(__name__)


class ExpenseTextStrategy(AIStrategy):
    """Handle natural language expense parsing."""

    def __init__(self) -> None:
        super().__init__("parse_text_expense")

    
    
    async def execute(self, service: "GeminiAIService", **kwargs: Any) -> Dict[str, Any]:
        text: str = kwargs.get("text", "").strip()
        if not text:
            raise HTTPException(status_code=422, detail="Text input is required for expense parsing")

        try:
            prompt = self._build_prompt() + f"\n\nInput text: {text}"
            response = service.model.generate_content(prompt)
            raw_result = service.parse_json_response(response.text)
            return self._normalize_result(raw_result)
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error parsing text expense: %s", exc)
            raise HTTPException(status_code=500, detail=f"AI processing error: {exc}")

    
    
    
    
    def _build_prompt(self) -> str:
        categories = [cat.value for cat in ExpenseCategory]
        payment_methods = [method.value for method in PaymentMethod]
        return f"""
You are an expert expense tracking assistant. Parse the given input and extract expense information.

FIRST, determine if the input is related to an expense, purchase, spending, or financial transaction.
If the input is NOT expense-related (like greetings, random chat, questions, etc.), return:
{{
    "is_expense_related": false,
    "confidence": 0,
    "message": "The input doesn't appear to be expense-related. Please describe a purchase, spending, or financial transaction."
}}

If the input IS expense-related, return a valid JSON object with this structure:
{{
    "is_expense_related": true,
    "amount": float (required),
    "currency": "Taka" (default, or extract if mentioned),
    "category": one of {categories} (required),
    "subcategory": string (optional),
    "merchant": string (optional),
    "description": string (optional),
    "date": "YYYY-MM-DDTHH:MM:SS" (use current date/time if not specified),
    "payment_method": one of {payment_methods} (optional),
    "tags": [list of strings] (optional),
    "confidence": float between 0 and 1
}}

Rules for expense-related inputs:
1. If amount is not clear, return confidence < 0.5
2. Always categorize to the best of your ability
3. Use "other" category only if no other fits
4. Extract merchant name from receipts or context
5. For dates, if only time is mentioned, use today's date
6. For Bangladeshi context: assume Taka currency unless specified otherwise
7. Common payment methods in Bangladesh: bkash, nagad, rocket should map to "digital_wallet"

Examples of expense-related inputs:
- "I spent 500 taka on lunch at KFC"
- "Bought groceries for 1200 taka"
- "Paid electricity bill 800 taka"
- "Coffee 50 taka"
- "Transportation 200"

Examples of NON expense-related inputs:
- "hi there"
- "hello"
- "how are you"
- "what's the weather"
- General conversation

Current date and time: {datetime.now().isoformat()}
"""

    
    
    
    def _normalize_result(self, result: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not result:
            raise HTTPException(status_code=400, detail="Failed to parse expense from text")

        if not result.get("is_expense_related", True):
            return {
                "is_expense_related": False,
                "confidence": 0,
                "message": result.get(
                    "message",
                    "The input doesn't appear to be expense-related. Please describe a purchase, spending, or financial transaction.",
                ),
            }

        if "amount" not in result or "category" not in result:
            logger.error("Missing required fields in AI expense response: %s", result)
            raise HTTPException(status_code=400, detail="Failed to parse expense from text")

        if result["amount"] <= 0:
            logger.error("Invalid amount in AI expense response: %s", result)
            raise HTTPException(status_code=400, detail="Failed to parse expense from text")

        if "confidence" not in result:
            result["confidence"] = 0.8

        valid_categories = [cat.value for cat in ExpenseCategory]
        if result["category"] not in valid_categories:
            result["category"] = "other"

        payment_method = result.get("payment_method")
        if payment_method:
            valid_methods = [method.value for method in PaymentMethod]
            if payment_method not in valid_methods:
                result["payment_method"] = "other"

        date_str = result.get("date")
        if date_str:
            try:
                parsed_dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                result["date"] = parsed_dt.isoformat()
            except ValueError:
                result["date"] = datetime.now().isoformat()
        else:
            result["date"] = datetime.now().isoformat()

        return result






class ExpenseReceiptStrategy(AIStrategy):
    """Handle receipt image parsing."""

    def __init__(self) -> None:
        super().__init__("parse_receipt_image")

    
    
    async def execute(self, service: "GeminiAIService", **kwargs: Any) -> Dict[str, Any]:
        image_file: UploadFile = kwargs.get("image_file")  # type: ignore[assignment]
        if image_file is None:
            raise HTTPException(status_code=422, detail="Receipt image is required")

        try:
            image_data = await image_file.read()
            image = Image.open(io.BytesIO(image_data))
            if image.mode != "RGB":
                image = image.convert("RGB")

            prompt = self._build_prompt(service)
            response = service.model.generate_content([prompt, image])
            raw_result = service.parse_json_response(response.text)
            normalizer = self._get_text_strategy(service)
            normalized = normalizer._normalize_result(raw_result)
            return normalized
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error parsing receipt image: %s", exc)
            raise HTTPException(status_code=500, detail=f"Image processing error: {exc}")

    
    
    
    def _build_prompt(self, service: "GeminiAIService") -> str:
        base_prompt = self._get_text_strategy(service)._build_prompt()
        return base_prompt + """

Analyze this receipt image and extract expense information.
Look for:
- Total amount (usually at the bottom)
- Store/merchant name (usually at the top)
- Date and time
- Payment method (if visible)
- Items purchased to determine category

Focus on the final total amount, not individual item prices.
"""

    
    def _get_text_strategy(self, service: "GeminiAIService") -> ExpenseTextStrategy:
        strategy = service.get_strategy("parse_text_expense")
        if isinstance(strategy, ExpenseTextStrategy):
            return strategy
        # Fallback to a fresh instance if strategy was replaced by a different implementation
        return ExpenseTextStrategy()




class ExpenseVoiceStrategy(AIStrategy):
    """Handle voice recording expense parsing."""

    def __init__(self) -> None:
        super().__init__("parse_voice_expense")

    
    
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

            logger.info("Transcribed expense text: %s", text)
            result = await service.parse_text_expense(text)
            result["transcribed_text"] = text
            return result
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error parsing voice expense: %s", exc)
            raise HTTPException(status_code=500, detail=f"Voice processing error: {exc}")
        finally:
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)
