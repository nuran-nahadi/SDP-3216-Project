"""Facade for orchestrating expense workflows."""
from __future__ import annotations

import calendar
import csv
import io
import json
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import String, cast, func

from app.models.models import Expense, User
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expenses import (
    CategoryBreakdownItem,
    CategorySummary,
    CategoryTrendMonth,
    ExpenseCreate,
    ExpenseOut,
    ExpenseSummary,
    ExpenseUpdate,
    MonthlyExpense,
    SpendTrendData,
    TopTransactionData,
    TotalSpendData,
)
from app.utils.upload import upload_receipt_image


class ExpenseFacade:
    """Coordinates repository calls and ancillary validation for expenses."""

    def __init__(self, repository: ExpenseRepository, user: User) -> None:
        self._repository = repository
        self._user = user

    # ------------------------------------------------------------------
    # CRUD operations
    # ------------------------------------------------------------------
    def get_expenses(
        self,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        category: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> dict:
        expenses, total_count = self._repository.list_expenses(
            self._user.id,
            start_date=start_date,
            end_date=end_date,
            category=category,
            min_amount=min_amount,
            max_amount=max_amount,
            search=search,
            page=page,
            limit=limit,
        )

        expense_list = []
        for expense in expenses:
            expense_dict = ExpenseOut.model_validate(expense).model_dump()
            if expense.tags:
                if isinstance(expense.tags, str):
                    try:
                        expense_dict["tags"] = json.loads(expense.tags)
                    except json.JSONDecodeError:
                        expense_dict["tags"] = []
                else:
                    expense_dict["tags"] = expense.tags
            else:
                expense_dict["tags"] = []
            expense_list.append(expense_dict)

        return {
            "success": True,
            "data": expense_list,
            "message": f"Retrieved {len(expense_list)} expenses",
            "meta": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        }

    
    
    def create_expense(self, expense_data: ExpenseCreate) -> dict:
        try:
            payload = {
                "amount": expense_data.amount,
                "currency": expense_data.currency,
                "category": expense_data.category,
                "subcategory": expense_data.subcategory,
                "merchant": expense_data.merchant,
                "description": expense_data.description,
                "date": expense_data.date,
                "payment_method": expense_data.payment_method,
                "is_recurring": expense_data.is_recurring,
                "recurrence_rule": expense_data.recurrence_rule,
                "tags": json.dumps(expense_data.tags) if expense_data.tags else None,
            }

            expense = self._repository.create(self._user.id, payload)
            
            
            
            return {
                "success": True,
                "data": ExpenseOut.model_validate(expense),
                "message": "Expense created successfully",
            }
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create expense: {exc}",
            ) from exc

    
    
    def get_expense(self, expense_id: UUID) -> dict:
        expense = self._repository.get_by_id(self._user.id, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )
        return {
            "success": True,
            "data": ExpenseOut.model_validate(expense),
            "message": "Expense retrieved successfully",
        }

    def update_expense(self, expense_id: UUID, expense_data: ExpenseUpdate) -> dict:
        expense = self._repository.get_by_id(self._user.id, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )

        update_data = expense_data.model_dump(exclude_unset=True)
        if "tags" in update_data:
            update_data["tags"] = (
                json.dumps(update_data["tags"]) if update_data["tags"] else None
            )

        try:
            updated = self._repository.update(expense, update_data)
            return {
                "success": True,
                "data": ExpenseOut.model_validate(updated),
                "message": "Expense updated successfully",
            }
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update expense: {exc}",
            ) from exc

    def delete_expense(self, expense_id: UUID) -> dict:
        expense = self._repository.get_by_id(self._user.id, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )

        try:
            deleted = self._repository.delete(expense)
            return {
                "success": True,
                "data": ExpenseOut.model_validate(deleted),
                "message": "Expense deleted successfully",
            }
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete expense",
            ) from exc

    # ------------------------------------------------------------------
    # Aggregations and summaries
    # ------------------------------------------------------------------
    def get_expense_summary(
        self,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        expenses = self._repository.list_between_dates(
            self._user.id,
            start_date=start_date,
            end_date=end_date,
        )

        if not expenses:
            return {
                "success": True,
                "data": ExpenseSummary(
                    total_amount=0.0,
                    total_count=0,
                    average_amount=0.0,
                    categories=[],
                    period_start=start_date or datetime.min,
                    period_end=end_date or datetime.max,
                ),
                "message": "No expenses found for the specified period",
            }

        total_amount = sum(expense.amount for expense in expenses)
        total_count = len(expenses)
        average_amount = total_amount / total_count if total_count else 0

        category_totals = {}
        for expense in expenses:
            category_totals.setdefault(
                expense.category,
                {"amount": 0.0, "count": 0},
            )
            category_totals[expense.category]["amount"] += expense.amount
            category_totals[expense.category]["count"] += 1

        categories = [
            CategorySummary(
                category=category,
                total_amount=values["amount"],
                count=values["count"],
                percentage=round((values["amount"] / total_amount) * 100, 2)
                if total_amount
                else 0,
            )
            for category, values in category_totals.items()
        ]

        categories.sort(key=lambda x: x.total_amount, reverse=True)

        summary = ExpenseSummary(
            total_amount=total_amount,
            total_count=total_count,
            average_amount=round(average_amount, 2),
            categories=categories,
            period_start=start_date or min(expense.date for expense in expenses),
            period_end=end_date or max(expense.date for expense in expenses),
        )

        return {
            "success": True,
            "data": summary,
            "message": "Expense summary retrieved successfully",
        }

    def get_categories_summary(self) -> dict:
        categories = self._repository.category_breakdown(
            self._user.id,
            start_date=datetime.min,
            end_date=datetime.max,
        )

        total_amount = sum(float(cat[1]) for cat in categories)
        category_summaries = [
            CategorySummary(
                category=category,
                total_amount=float(total_amount_value),
                count=transaction_count,
                percentage=
                round((float(total_amount_value) / total_amount) * 100, 2)
                if total_amount
                else 0,
            )
            for category, total_amount_value, transaction_count in categories
        ]
        category_summaries.sort(key=lambda x: x.total_amount, reverse=True)

        return {
            "success": True,
            "data": category_summaries,
            "message": "Categories retrieved successfully",
        }

    def get_monthly_expenses(self, year: int, month: int) -> dict:
        expenses = self._repository.list_month(self._user.id, year, month)
        if not expenses:
            return {
                "success": True,
                "data": MonthlyExpense(
                    year=year,
                    month=month,
                    total_amount=0.0,
                    count=0,
                    categories=[],
                ),
                "message": f"No expenses found for {month}/{year}",
            }

        total_amount = sum(expense.amount for expense in expenses)
        category_totals = {}
        for expense in expenses:
            category_totals.setdefault(expense.category, {"amount": 0.0, "count": 0})
            category_totals[expense.category]["amount"] += expense.amount
            category_totals[expense.category]["count"] += 1

        categories = [
            CategorySummary(
                category=category,
                total_amount=values["amount"],
                count=values["count"],
                percentage=round((values["amount"] / total_amount) * 100, 2)
                if total_amount
                else 0,
            )
            for category, values in category_totals.items()
        ]

        monthly_expense = MonthlyExpense(
            year=year,
            month=month,
            total_amount=total_amount,
            count=len(expenses),
            categories=categories,
        )

        return {
            "success": True,
            "data": monthly_expense,
            "message": f"Monthly expenses for {month}/{year} retrieved successfully",
        }

    async def upload_receipt(
        self,
        expense_id: UUID,
        file: UploadFile,
    ) -> dict:
        expense = self._repository.get_by_id(self._user.id, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )

        try:
            receipt_url = await upload_receipt_image(file)
            updated = self._repository.update(expense, {"receipt_url": receipt_url})
            return {
                "success": True,
                "data": ExpenseOut.model_validate(updated),
                "message": "Receipt uploaded successfully",
            }
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload receipt: {exc}",
            ) from exc

    def get_recurring_expenses(self) -> dict:
        expenses = self._repository.list_recurring(self._user.id)
        expense_list = [ExpenseOut.model_validate(expense) for expense in expenses]
        return {
            "success": True,
            "data": expense_list,
            "message": f"Retrieved {len(expense_list)} recurring expenses",
        }

    def export_expenses(
        self,
        *,
        format: str = "csv",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        expenses = self._repository.list_between_dates(
            self._user.id,
            start_date=start_date,
            end_date=end_date,
        )

        if format.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(
                [
                    "ID",
                    "Amount",
                    "Currency",
                    "Category",
                    "Subcategory",
                    "Merchant",
                    "Description",
                    "Date",
                    "Payment Method",
                    "Is Recurring",
                    "Tags",
                    "Created At",
                ]
            )
            for expense in expenses:
                tags = json.loads(expense.tags) if expense.tags else []
                writer.writerow(
                    [
                        str(expense.id),
                        expense.amount,
                        expense.currency,
                        expense.category,
                        expense.subcategory or "",
                        expense.merchant or "",
                        expense.description or "",
                        expense.date.isoformat(),
                        expense.payment_method or "",
                        expense.is_recurring,
                        ", ".join(tags),
                        expense.created_at.isoformat(),
                    ]
                )
            csv_content = output.getvalue()
            output.close()
            return {
                "success": True,
                "data": csv_content,
                "message": f"Exported {len(expenses)} expenses to CSV",
            }

        expense_list = [ExpenseOut.model_validate(expense) for expense in expenses]
        return {
            "success": True,
            "data": expense_list,
            "message": f"Exported {len(expenses)} expenses to JSON",
        }

    # ------------------------------------------------------------------
    # AI powered helpers
    # ------------------------------------------------------------------
    async def parse_text_with_ai(self, text: str) -> dict:
        from app.services.ai_service import ai_service

        try:
            parsed_data = await ai_service.parse_text_expense(text)
            if not parsed_data.get("is_expense_related", True):
                return {
                    "success": False,
                    "data": None,
                    "parsed_data": None,
                    "confidence": 0,
                    "message": parsed_data.get(
                        "message",
                        "Please provide a valid expense description.",
                    ),
                }
            if parsed_data.get("confidence", 0) < 0.5:
                return {
                    "success": False,
                    "data": None,
                    "parsed_data": parsed_data,
                    "confidence": parsed_data.get("confidence", 0),
                    "message": "Low confidence in parsing. Please provide more details.",
                }

            expense_create = ExpenseCreate(
                amount=parsed_data["amount"],
                currency=parsed_data.get("currency", "Taka"),
                category=parsed_data["category"],
                subcategory=parsed_data.get("subcategory"),
                merchant=parsed_data.get("merchant"),
                description=parsed_data.get("description"),
                date=datetime.fromisoformat(parsed_data["date"]),
                payment_method=parsed_data.get("payment_method"),
                tags=parsed_data.get("tags", []),
            )
            result = self.create_expense(expense_create)
            return {
                "success": True,
                "data": result["data"],
                "parsed_data": parsed_data,
                "confidence": parsed_data.get("confidence", 0.8),
                "message": "Expense created successfully from text",
            }
        except Exception as exc:  # pragma: no cover - AI fallback
            return {
                "success": False,
                "data": None,
                "parsed_data": None,
                "confidence": 0,
                "message": f"Error parsing text: {exc}",
            }

    async def parse_receipt_with_ai(self, image_file: UploadFile) -> dict:
        from app.services.ai_service import ai_service

        try:
            parsed_data = await ai_service.parse_receipt_image(image_file)
            if parsed_data.get("confidence", 0) < 0.5:
                return {
                    "success": False,
                    "data": None,
                    "parsed_data": parsed_data,
                    "confidence": parsed_data.get("confidence", 0),
                    "message": "Low confidence in receipt parsing. Please verify the image.",
                }

            receipt_url = None
            try:
                await image_file.seek(0)
                receipt_url = await upload_receipt_image(image_file)
            except Exception:  # pragma: no cover - upload optional
                receipt_url = None

            expense_create = ExpenseCreate(
                amount=parsed_data["amount"],
                currency=parsed_data.get("currency", "Taka"),
                category=parsed_data["category"],
                subcategory=parsed_data.get("subcategory"),
                merchant=parsed_data.get("merchant"),
                description=parsed_data.get("description"),
                date=datetime.fromisoformat(parsed_data["date"]),
                payment_method=parsed_data.get("payment_method"),
                tags=parsed_data.get("tags", []),
            )
            result = self.create_expense(expense_create)

            if receipt_url and result["success"]:
                expense_obj = self._repository.get_by_id(
                    self._user.id,
                    result["data"].id,
                )
                if expense_obj:
                    updated = self._repository.update(
                        expense_obj,
                        {"receipt_url": receipt_url},
                    )
                    result["data"] = ExpenseOut.model_validate(updated)

            return {
                "success": True,
                "data": result["data"],
                "parsed_data": parsed_data,
                "confidence": parsed_data.get("confidence", 0.8),
                "message": "Expense created successfully from receipt",
            }
        except Exception as exc:  # pragma: no cover - AI fallback
            return {
                "success": False,
                "data": None,
                "parsed_data": None,
                "confidence": 0,
                "message": f"Error parsing receipt: {exc}",
            }

    async def parse_voice_with_ai(self, audio_file: UploadFile) -> dict:
        from app.services.ai_service import ai_service

        try:
            parsed_data = await ai_service.parse_voice_expense(audio_file)
            if parsed_data.get("confidence", 0) < 0.5:
                return {
                    "success": False,
                    "data": None,
                    "parsed_data": parsed_data,
                    "confidence": parsed_data.get("confidence", 0),
                    "transcribed_text": parsed_data.get("transcribed_text"),
                    "message": "Low confidence in voice parsing. Please speak more clearly.",
                }

            expense_create = ExpenseCreate(
                amount=parsed_data["amount"],
                currency=parsed_data.get("currency", "Taka"),
                category=parsed_data["category"],
                subcategory=parsed_data.get("subcategory"),
                merchant=parsed_data.get("merchant"),
                description=parsed_data.get("description"),
                date=datetime.fromisoformat(parsed_data["date"]),
                payment_method=parsed_data.get("payment_method"),
                tags=parsed_data.get("tags", []),
            )
            result = self.create_expense(expense_create)
            return {
                "success": True,
                "data": result["data"],
                "parsed_data": parsed_data,
                "confidence": parsed_data.get("confidence", 0.8),
                "transcribed_text": parsed_data.get("transcribed_text"),
                "message": "Expense created successfully from voice",
            }
        except Exception as exc:  # pragma: no cover - AI fallback
            return {
                "success": False,
                "data": None,
                "parsed_data": None,
                "confidence": 0,
                "transcribed_text": None,
                "message": f"Error parsing voice: {exc}",
            }

    async def get_ai_insights(self, days: int = 30) -> dict:
        from app.services.ai_service import ai_service

        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            expenses = self._repository.expenses_for_ai(
                self._user.id,
                start_date=start_date,
                end_date=end_date,
            )
            if not expenses:
                return {
                    "success": True,
                    "data": {"insights": "No recent expenses found for analysis."},
                    "message": "No data available for insights",
                }
            payload = [
                {
                    "amount": expense.amount,
                    "currency": expense.currency,
                    "category": expense.category,
                    "merchant": expense.merchant,
                    "description": expense.description,
                    "date": expense.date.isoformat(),
                    "payment_method": expense.payment_method,
                }
                for expense in expenses
            ]
            insights = await ai_service.get_spending_insights(payload)
            return {
                "success": True,
                "data": insights,
                "message": "AI insights generated successfully",
            }
        except Exception as exc:  # pragma: no cover - AI fallback
            return {
                "success": False,
                "data": {"insights": f"Error generating insights: {exc}"},
                "message": f"Error generating insights: {exc}",
            }

    # ------------------------------------------------------------------
    # Dashboard helpers
    # ------------------------------------------------------------------
    def get_total_spend_dashboard(self) -> dict:
        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        _, last_day = calendar.monthrange(now.year, now.month)
        current_month_end = now.replace(
            day=last_day,
            hour=23,
            minute=59,
            second=59,
            microsecond=999_999,
        )

        if now.month == 1:
            prev_year = now.year - 1
            prev_month = 12
        else:
            prev_year = now.year
            prev_month = now.month - 1
        previous_month_start = datetime(prev_year, prev_month, 1)
        _, prev_last_day = calendar.monthrange(prev_year, prev_month)
        previous_month_end = datetime(
            prev_year,
            prev_month,
            prev_last_day,
            23,
            59,
            59,
            999_999,
        )

        current_total = self._repository.sum_amount(
            self._user.id,
            start_date=current_month_start,
            end_date=current_month_end,
        )
        previous_total = self._repository.sum_amount(
            self._user.id,
            start_date=previous_month_start,
            end_date=previous_month_end,
        )

        if previous_total > 0:
            percentage_change = ((current_total - previous_total) / previous_total) * 100
        else:
            percentage_change = 100 if current_total > 0 else 0

        if percentage_change > 0:
            change_direction = "increase"
        elif percentage_change < 0:
            change_direction = "decrease"
        else:
            change_direction = "same"

        data = TotalSpendData(
            current_month=round(current_total, 2),
            previous_month=round(previous_total, 2),
            percentage_change=round(percentage_change, 2),
            change_direction=change_direction,
        )
        return {
            "success": True,
            "data": data,
            "message": "Total spend data retrieved successfully",
        }

    def get_category_breakdown_dashboard(self, period: str = "current_month") -> dict:
        now = datetime.now()
        if period == "current_month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            _, last_day = calendar.monthrange(now.year, now.month)
            end_date = now.replace(
                day=last_day,
                hour=23,
                minute=59,
                second=59,
                microsecond=999_999,
            )
        elif period == "last_30_days":
            end_date = now
            start_date = now - timedelta(days=30)
        elif period == "current_year":
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        else:
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            _, last_day = calendar.monthrange(now.year, now.month)
            end_date = now.replace(
                day=last_day,
                hour=23,
                minute=59,
                second=59,
                microsecond=999_999,
            )

        categories = self._repository.category_breakdown(
            self._user.id,
            start_date=start_date,
            end_date=end_date,
        )
        if not categories:
            return {
                "success": True,
                "data": [],
                "message": "No expenses found for the selected period",
            }

        total_amount = sum(cat[1] for cat in categories)
        breakdown = [
            CategoryBreakdownItem(
                category=category,
                amount=round(total_amount_value, 2),
                percentage=round((total_amount_value / total_amount) * 100, 2)
                if total_amount
                else 0,
                transaction_count=transaction_count,
            )
            for category, total_amount_value, transaction_count in categories
        ]
        breakdown.sort(key=lambda item: item.amount, reverse=True)
        return {
            "success": True,
            "data": breakdown,
            "message": f"Category breakdown for {period} retrieved successfully",
        }

    def get_category_trend_dashboard(self, months: int = 6) -> dict:
        now = datetime.now()
        end_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_year = now.year
        start_month = now.month - months
        while start_month <= 0:
            start_month += 12
            start_year -= 1
        start_date = datetime(start_year, start_month, 1)

        rows = self._repository.category_totals_by_month(
            self._user.id,
            start_date=start_date,
            end_date=end_date,
        )
        if not rows:
            return {
                "success": True,
                "data": [],
                "message": "No expense data found for the specified period",
            }

        months_totals = {}
        month_categories = {}
        for year, month, category, amount in rows:
            month_key = f"{int(year)}-{int(month):02d}"
            months_totals.setdefault(month_key, 0.0)
            month_categories.setdefault(month_key, {})
            months_totals[month_key] += amount
            month_categories[month_key][category] = amount

        trend_data = []
        for month_key, categories in month_categories.items():
            month_total = months_totals[month_key]
            for category, amount in categories.items():
                trend_data.append(
                    CategoryTrendMonth(
                        month=month_key,
                        category=category,
                        amount=round(amount, 2),
                        percentage=round((amount / month_total) * 100, 2)
                        if month_total
                        else 0,
                    )
                )
        trend_data.sort(key=lambda x: (x.month, -x.amount))
        return {
            "success": True,
            "data": trend_data,
            "message": f"Category trend data for last {months} months retrieved successfully",
        }

    def get_spend_trend_dashboard(
        self,
        *,
        period: str = "daily",
        days: int = 30,
    ) -> dict:
        now = datetime.now()
        if period == "daily":
            start_date = now - timedelta(days=days)
            group_expression = func.date(Expense.date)
        elif period == "weekly":
            start_date = now - timedelta(weeks=max(days // 7, 4))
            group_expression = func.concat(
                cast(func.extract('year', Expense.date), String),
                '-W',
                func.lpad(cast(func.extract('week', Expense.date), String), 2, '0'),
            )
        elif period == "monthly":
            start_date = now - timedelta(days=max(days, 90))
            group_expression = func.concat(
                cast(func.extract('year', Expense.date), String),
                '-',
                func.lpad(cast(func.extract('month', Expense.date), String), 2, '0'),
            )
        else:
            start_date = now - timedelta(days=30)
            group_expression = func.date(Expense.date)

        rows = self._repository.spend_trend(
            self._user.id,
            start_date=start_date,
            group_expression=group_expression,
        )
        trend_list = []
        for period_value, total_amount, transaction_count in rows:
            trend_list.append(
                SpendTrendData(
                    date=str(period_value),
                    amount=round(total_amount, 2),
                    transaction_count=transaction_count,
                )
            )
        return {
            "success": True,
            "data": trend_list,
            "message": f"Spend trend data ({period}) retrieved successfully",
        }

    def get_top_transactions_dashboard(
        self,
        *,
        period: str = "monthly",
        limit: int = 5,
    ) -> dict:
        now = datetime.now()
        if period == "weekly":
            start_date = now - timedelta(weeks=1)
        elif period == "monthly":
            if now.month == 1:
                prev_year = now.year - 1
                prev_month = 12
            else:
                prev_year = now.year
                prev_month = now.month - 1
            start_date = datetime(prev_year, prev_month, now.day)
        elif period == "yearly":
            start_date = datetime(now.year - 1, now.month, now.day)
        else:
            if now.month == 1:
                prev_year = now.year - 1
                prev_month = 12
            else:
                prev_year = now.year
                prev_month = now.month - 1
            start_date = datetime(prev_year, prev_month, now.day)

        transactions = self._repository.top_transactions(
            self._user.id,
            start_date=start_date,
            limit=limit,
        )
        transaction_list = [
            TopTransactionData(
                id=item.id,
                amount=round(item.amount, 2),
                category=item.category,
                merchant=item.merchant,
                description=item.description,
                date=item.date,
            )
            for item in transactions
        ]
        return {
            "success": True,
            "data": transaction_list,
            "message": f"Top {limit} transactions ({period}) retrieved successfully",
        }
