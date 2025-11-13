from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, TYPE_CHECKING

from fastapi import HTTPException

from app.services.ai_strategies.base import AIStrategy

if TYPE_CHECKING:
    from app.services.ai_service import GeminiAIService

logger = logging.getLogger(__name__)


class SpendingInsightsStrategy(AIStrategy):
    """Generate insights from expense data."""

    def __init__(self) -> None:
        super().__init__("get_spending_insights")

    async def execute(self, service: "GeminiAIService", **kwargs: Any) -> Dict[str, Any]:
        expenses_data: List[Dict[str, Any]] = kwargs.get("expenses_data", [])

        if not expenses_data:
            return {"insights": "No expense data available for analysis."}

        try:
            total_amount = sum(expense.get("amount", 0) for expense in expenses_data)
            categories: Dict[str, float] = {}
            for expense in expenses_data:
                category = expense.get("category", "other")
                categories[category] = categories.get(category, 0.0) + expense.get("amount", 0.0)

            prompt = self._build_prompt(total_amount, categories, len(expenses_data))
            response = service.model.generate_content(prompt)
            raw_result = service.parse_json_response(response.text)
            return raw_result or {"insights": "Unable to generate insights at this time."}
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Error generating spending insights: %s", exc)
            return {"insights": f"Error generating insights: {exc}"}

    def _build_prompt(self, total_amount: float, categories: Dict[str, float], count: int) -> str:
        return f"""
Analyze the following expense data and provide insights in JSON format:

Total spending: {total_amount} Taka
Category breakdown: {json.dumps(categories, indent=2)}
Number of transactions: {count}

Provide insights in this JSON format:
{{
    "total_spending": {total_amount},
    "top_category": "category_name",
    "top_category_amount": amount,
    "insights": [
        "Brief insight 1",
        "Brief insight 2",
        "Brief insight 3"
    ],
    "recommendations": [
        "Brief recommendation 1",
        "Brief recommendation 2"
    ],
    "spending_trend": "increasing/decreasing/stable"
}}

Focus on:
1. Spending patterns
2. Budget optimization suggestions
3. Unusual spending alerts
4. Category-wise analysis
"""
