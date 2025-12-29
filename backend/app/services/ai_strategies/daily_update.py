"""
AI Strategy for the Proactive Daily Update Interviewer.
This implements the stateful conversation management for the daily update feature.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, TYPE_CHECKING
from datetime import datetime

from app.services.ai_strategies.base import AIStrategy

if TYPE_CHECKING:
    from app.services.ai_service import GeminiAIService

logger = logging.getLogger(__name__)


# System instruction for the AI "Interviewer" persona
DAILY_UPDATE_SYSTEM_INSTRUCTION = """You are the Daily Update Assistant for a personal life management app. Your goal is to extract structured data for 4 categories: **Tasks, Expenses, Calendar Events, and Journal.**

**Currency rule:**
- The app uses Bangladeshi Taka (BDT) only. Record expense amounts in Taka.
- If the user mentions USD/$/dollars, convert using 1 USD = 120 Taka and note the original amount+currency in the description (e.g., "Original: USD 10.00").

**Protocol:**
1. **Start:** When beginning a session, greet warmly: "Hi! Ready for your daily update. How did your day go?"

2. **Listen & Check:** As the user speaks, mentally track these 4 boxes:
   - ☐ Tasks (work done, to-dos completed or created)
   - ☐ Expenses (money spent)
   - ☐ Events (meetings, appointments, social activities)
   - ☐ Journal (feelings, reflections, mood)

3. **The Probing Loop:**
   - If **Expenses** are mentioned but vague (e.g., "I bought lunch"), ask: "How much was lunch and where did you eat?"
   - If **Tasks** are mentioned (e.g., "I worked on the report"), ask: "Did you finish it? Should I mark it as complete or add it as in-progress?"
   - If **Events** are mentioned vaguely, ask for details: "What time was that? How long did it take?"
   - If a category is **completely missing**, gently ask: "Any expenses today?" or "Did you have any meetings or appointments?"
   - For **Journal**, listen for emotional cues. If they say "It was okay" or "rough day", ask: "Would you like to add that to your journal? How are you feeling?"

4. **Drafting:** When you have clear details for an item, call the `create_draft_entry` function IMMEDIATELY. Do NOT wait for the end of the conversation. Draft as you go.
   - For expenses: Capture amount, currency, merchant/description
   - For tasks: Capture title, status (pending/completed), any due dates
   - For events: Capture title, type (work/social), time if mentioned
   - For journal: Capture mood, brief content about their feelings

5. **Completion:** Only when you have touched on all 4 categories (or the user explicitly says they're done), summarize what you've recorded:
   "Great! Here's what I captured:
   - [X tasks]
   - [X expenses] 
   - [X events]
   - [X journal entries]
   You can review and confirm these in your pending updates. Anything else?"

**Important Guidelines:**
- Be conversational and natural, not robotic
- Don't overwhelm with questions - follow the conversation flow
- If user seems busy, offer to wrap up early
- Always acknowledge what they share before asking follow-up questions
- Use the create_draft_entry function proactively as you gather information
- If unsure about a detail, make reasonable assumptions and note them
"""


# Tool definition for Gemini function calling
CREATE_DRAFT_ENTRY_TOOL = {
    "name": "create_draft_entry",
    "description": "Saves a potential entry to the user's pending review list. Call this immediately when the user confirms a detail. The entry will be reviewed by the user before being finalized.",
    "parameters": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["task", "expense", "event", "journal"],
                "description": "The category of the entry"
            },
            "summary": {
                "type": "string",
                "description": "A short descriptive title (e.g., 'Lunch at Subway', 'Finished quarterly report')"
            },
            "details": {
                "type": "object",
                "description": "Category-specific structured data",
                "properties": {
                    "amount": {"type": "number", "description": "For expenses: the amount spent"},
                    "currency": {"type": "string", "description": "For expenses: always use 'Taka'"},
                    "merchant": {"type": "string", "description": "For expenses: where the money was spent"},
                    "expense_category": {"type": "string", "description": "For expenses: food, transport, entertainment, bills, shopping, health, education, travel, other"},
                    "status": {"type": "string", "description": "For tasks: pending, in_progress, completed"},
                    "priority": {"type": "string", "description": "For tasks: low, medium, high"},
                    "due_date": {"type": "string", "description": "For tasks: ISO date string if mentioned"},
                    "description": {"type": "string", "description": "Additional details or notes"},
                    "event_type": {"type": "string", "description": "For events: work, social, personal, health, other"},
                    "start_time": {"type": "string", "description": "For events: ISO datetime string"},
                    "end_time": {"type": "string", "description": "For events: ISO datetime string"},
                    "location": {"type": "string", "description": "For events: where it took place"},
                    "mood": {"type": "string", "description": "For journal: very_happy, happy, neutral, sad, very_sad, angry, excited, anxious, grateful"},
                    "content": {"type": "string", "description": "For journal: the journal entry content"}
                }
            }
        },
        "required": ["category", "summary", "details"]
    }
}


class DailyUpdateInterviewerStrategy(AIStrategy):
    """
    AI Strategy that acts as a proactive interviewer for daily updates.
    Maintains conversation state and extracts structured data.
    """
    
    def __init__(self) -> None:
        super().__init__("daily_update_interviewer")
        self._all_categories = {"task", "expense", "event", "journal"}
    
    async def execute(
        self,
        service: "GeminiAIService",
        user_message: str,
        conversation_history: List[Dict[str, str]] = None,
        categories_covered: List[str] = None,
        is_new_session: bool = False,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """
        Process a user message in the daily update conversation.
        
        Args:
            service: The GeminiAIService instance
            user_message: The user's input
            conversation_history: Previous messages in the conversation
            categories_covered: Categories already discussed
            is_new_session: Whether this is the start of a new session
            
        Returns:
            Dict containing:
            - ai_response: The AI's text response
            - draft_entries: List of entries to create
            - categories_mentioned: Categories detected in this message
            - is_complete: Whether all categories have been covered
        """
        conversation_history = conversation_history or []
        categories_covered = set(categories_covered or [])
        
        # Build the conversation context
        messages = self._build_conversation_messages(
            conversation_history,
            user_message,
            is_new_session
        )
        
        try:
            # Call Gemini with function calling enabled
            response = await self._call_gemini_with_tools(service, messages)
            
            # Extract any function calls (draft entries)
            draft_entries = self._extract_function_calls(response)
            
            # Detect categories mentioned in user message
            categories_mentioned = self._detect_categories(user_message)
            categories_covered.update(categories_mentioned)
            
            # Add categories from draft entries
            for entry in draft_entries:
                categories_covered.add(entry["category"])
            
            # Get the AI's text response
            ai_response = self._extract_text_response(response)
            
            # Check if conversation is complete
            is_complete = self._check_completion(
                categories_covered,
                user_message,
                ai_response
            )
            
            return {
                "ai_response": ai_response,
                "draft_entries": draft_entries,
                "categories_mentioned": list(categories_mentioned),
                "categories_covered": list(categories_covered),
                "is_complete": is_complete,
                "raw_response": str(response) if kwargs.get("debug") else None
            }
            
        except Exception as e:
            logger.error(f"Error in daily update conversation: {e}")
            return {
                "ai_response": "I'm having trouble processing that. Could you repeat what you said?",
                "draft_entries": [],
                "categories_mentioned": [],
                "categories_covered": list(categories_covered),
                "is_complete": False,
                "error": str(e)
            }
    
    def _build_conversation_messages(
        self,
        history: List[Dict[str, str]],
        user_message: str,
        is_new_session: bool
    ) -> List[Dict[str, str]]:
        """Build the message list for the AI."""
        messages = []
        
        # Add conversation history
        # Note: Gemini uses "model" instead of "assistant" for AI responses
        for msg in history:
            role = msg.get("role", "user")
            # Convert 'assistant' to 'model' for Gemini API
            if role == "assistant":
                role = "model"
            messages.append({
                "role": role,
                "parts": [msg.get("content", "")]
            })
        
        # Add current user message
        if user_message:
            messages.append({
                "role": "user",
                "parts": [user_message]
            })
        
        return messages
    
    async def _call_gemini_with_tools(
        self,
        service: "GeminiAIService",
        messages: List[Dict[str, str]]
    ) -> Any:
        """Call Gemini API with function calling enabled."""
        import google.generativeai as genai
        
        # Configure the model with tools
        model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview",
            system_instruction=DAILY_UPDATE_SYSTEM_INSTRUCTION,
            tools=[{"function_declarations": [CREATE_DRAFT_ENTRY_TOOL]}]
        )
        
        # Start or continue chat
        chat = model.start_chat(history=messages[:-1] if len(messages) > 1 else [])
        
        # Send the latest message
        if messages:
            latest_message = messages[-1].get("parts", [""])[0] if messages[-1].get("parts") else ""
            response = chat.send_message(latest_message)
            return response
        
        return None
    
    def _extract_function_calls(self, response: Any) -> List[Dict[str, Any]]:
        """Extract function calls from the Gemini response."""
        draft_entries = []
        
        if response is None:
            return draft_entries
        
        try:
            # Check for function calls in the response
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        fc = part.function_call
                        if fc.name == "create_draft_entry":
                            # Extract arguments
                            args = dict(fc.args)
                            draft_entries.append({
                                "category": args.get("category"),
                                "summary": args.get("summary"),
                                "details": args.get("details", {})
                            })
        except Exception as e:
            logger.warning(f"Error extracting function calls: {e}")
        
        return draft_entries
    
    def _extract_text_response(self, response: Any) -> str:
        """Extract the text response from Gemini."""
        if response is None:
            return "Hi! Ready for your daily update. How did your day go?"
        
        try:
            # Get text parts from the response
            text_parts = []
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if hasattr(part, 'text') and part.text:
                        text_parts.append(part.text)
            
            return " ".join(text_parts) if text_parts else "I understand. Tell me more about your day."
        except Exception as e:
            logger.warning(f"Error extracting text response: {e}")
            return "I understand. Tell me more about your day."
    
    def _detect_categories(self, text: str) -> set:
        """Detect which categories are mentioned in the user's message."""
        text_lower = text.lower()
        categories = set()
        
        # Task keywords
        task_keywords = [
            "finish", "complete", "done", "work", "task", "project",
            "deadline", "submit", "deliver", "todo", "to-do", "assignment"
        ]
        if any(kw in text_lower for kw in task_keywords):
            categories.add("task")
        
        # Expense keywords
        expense_keywords = [
            "buy", "bought", "spend", "spent", "pay", "paid", "cost",
            "dollar", "money", "$", "price", "purchase", "expense",
            "lunch", "dinner", "coffee", "uber", "taxi", "grocery"
        ]
        if any(kw in text_lower for kw in expense_keywords):
            categories.add("expense")
        
        # Event keywords
        event_keywords = [
            "meet", "meeting", "appointment", "call", "coffee with",
            "lunch with", "dinner with", "party", "event", "hangout",
            "catch up", "visit", "doctor", "dentist"
        ]
        if any(kw in text_lower for kw in event_keywords):
            categories.add("event")
        
        # Journal/mood keywords
        journal_keywords = [
            "feel", "feeling", "felt", "mood", "happy", "sad", "angry",
            "stressed", "anxious", "excited", "grateful", "tired",
            "okay", "rough", "great", "terrible", "amazing"
        ]
        if any(kw in text_lower for kw in journal_keywords):
            categories.add("journal")
        
        return categories
    
    def _check_completion(
        self,
        categories_covered: set,
        user_message: str,
        ai_response: str
    ) -> bool:
        """Check if the conversation should be considered complete."""
        # User explicitly wants to end
        end_phrases = [
            "that's all", "that's it", "i'm done", "nothing else",
            "no more", "we're done", "finish", "end", "bye", "thanks"
        ]
        user_lower = user_message.lower()
        if any(phrase in user_lower for phrase in end_phrases):
            return True
        
        # All categories covered
        if categories_covered >= self._all_categories:
            return True
        
        return False
    
    def get_greeting(self) -> str:
        """Get the initial greeting message."""
        return "Hi! Ready for your daily update. How did your day go?"
    
    def get_missing_categories_prompt(self, covered: List[str]) -> str:
        """Get a prompt asking about missing categories."""
        covered_set = set(covered)
        missing = self._all_categories - covered_set
        
        prompts = {
            "task": "Did you complete any tasks or have any work updates?",
            "expense": "Any expenses today?",
            "event": "Did you have any meetings or appointments?",
            "journal": "How are you feeling overall today?"
        }
        
        if missing:
            category = missing.pop()
            return prompts.get(category, "Anything else you'd like to add?")
        
        return "Anything else you'd like to add?"


# Export the strategy for registration
daily_update_interviewer_strategy = DailyUpdateInterviewerStrategy()
