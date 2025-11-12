"""Data access helpers for expense domain."""
from __future__ import annotations

from datetime import datetime
from typing import Dict, Iterable, List, Optional, Sequence, Tuple
from uuid import UUID

from sqlalchemy import and_, desc, extract, func, or_
from sqlalchemy.orm import Session

from app.models.models import Expense


class ExpenseRepository:
    """Encapsulates all direct database access for expenses."""

    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Core CRUD helpers
    # ------------------------------------------------------------------
    def list_expenses(
        self,
        user_id: UUID,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        category: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Tuple[List[Expense], int]:
        """Return paginated expenses plus total count for the current filters."""
        query = self._base_query(user_id)

        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)
        if category:
            query = query.filter(Expense.category == category)
        if min_amount is not None:
            query = query.filter(Expense.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Expense.amount <= max_amount)
        if search:
            like_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Expense.description.ilike(like_pattern),
                    Expense.merchant.ilike(like_pattern),
                    Expense.subcategory.ilike(like_pattern),
                )
            )

        total_count = query.count()
        expenses = (
            query.order_by(desc(Expense.date))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return expenses, total_count

    def get_by_id(self, user_id: UUID, expense_id: UUID) -> Optional[Expense]:
        """Return a single expense for the user or ``None`` if missing."""
        return (
            self._base_query(user_id)
            .filter(Expense.id == expense_id)
            .first()
        )

    def create(self, user_id: UUID, payload: Dict[str, object]) -> Expense:
        """Persist a new expense and return the stored instance."""
        expense = Expense(user_id=user_id, **payload)
        self._db.add(expense)
        self._db.commit()
        self._db.refresh(expense)
        return expense

    def update(self, expense: Expense, update_data: Dict[str, object]) -> Expense:
        """Apply the provided field changes to the expense."""
        for key, value in update_data.items():
            setattr(expense, key, value)
        self._db.commit()
        self._db.refresh(expense)
        return expense

    def delete(self, expense: Expense) -> Expense:
        """Delete the provided expense instance."""
        self._db.delete(expense)
        self._db.commit()
        return expense

    # ------------------------------------------------------------------
    # Domain specific query helpers
    # ------------------------------------------------------------------
    def list_between_dates(
        self,
        user_id: UUID,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        order_desc: bool = True,
    ) -> List[Expense]:
        """Return all expenses for a user between ``start_date`` and ``end_date``."""
        query = self._base_query(user_id)
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)
        if order_desc:
            query = query.order_by(desc(Expense.date))
        return query.all()

    def list_month(self, user_id: UUID, year: int, month: int) -> List[Expense]:
        """Return all expenses for the given month."""
        return (
            self._base_query(user_id)
            .filter(
                and_(
                    extract('year', Expense.date) == year,
                    extract('month', Expense.date) == month,
                )
            )
            .order_by(desc(Expense.date))
            .all()
        )

    def list_recurring(self, user_id: UUID) -> List[Expense]:
        """Return all recurring expenses for a user."""
        return (
            self._base_query(user_id)
            .filter(Expense.is_recurring.is_(True))
            .order_by(desc(Expense.date))
            .all()
        )

    def top_transactions(
        self,
        user_id: UUID,
        *,
        start_date: datetime,
        limit: int,
    ) -> List[Expense]:
        """Return the top ``limit`` transactions after ``start_date``."""
        return (
            self._base_query(user_id)
            .filter(Expense.date >= start_date)
            .order_by(desc(Expense.amount))
            .limit(limit)
            .all()
        )

    def category_breakdown(
        self,
        user_id: UUID,
        *,
        start_date: datetime,
        end_date: datetime,
    ) -> List[Tuple[str, float, int]]:
        """Return total and count per category between the provided dates."""
        rows: Sequence[Tuple[str, float, int]] = (
            self._db.query(
                Expense.category,
                func.sum(Expense.amount).label('total_amount'),
                func.count(Expense.id).label('transaction_count'),
            )
            .filter(
                and_(
                    Expense.user_id == user_id,
                    Expense.date >= start_date,
                    Expense.date <= end_date,
                )
            )
            .group_by(Expense.category)
            .all()
        )
        return list(rows)

    def category_totals_by_month(
        self,
        user_id: UUID,
        *,
        start_date: datetime,
        end_date: datetime,
    ) -> List[Tuple[int, int, str, float]]:
        """Return (year, month, category, total) tuples across a range."""
        rows: Sequence[Tuple[int, int, str, float]] = (
            self._db.query(
                extract('year', Expense.date).label('year'),
                extract('month', Expense.date).label('month'),
                Expense.category,
                func.sum(Expense.amount).label('total_amount'),
            )
            .filter(
                and_(
                    Expense.user_id == user_id,
                    Expense.date >= start_date,
                    Expense.date < end_date,
                )
            )
            .group_by('year', 'month', Expense.category)
            .all()
        )
        return list(rows)

    def spend_trend(
        self,
        user_id: UUID,
        *,
        start_date: datetime,
        group_expression,
    ) -> List[Tuple[object, float, int]]:
        """Return aggregated spend trend data grouped by ``group_expression``."""
        rows: Sequence[Tuple[object, float, int]] = (
            self._db.query(
                group_expression.label('period'),
                func.sum(Expense.amount).label('total_amount'),
                func.count(Expense.id).label('transaction_count'),
            )
            .filter(
                and_(
                    Expense.user_id == user_id,
                    Expense.date >= start_date,
                )
            )
            .group_by(group_expression)
            .order_by(group_expression)
            .all()
        )
        return list(rows)

    def sum_amount(
        self,
        user_id: UUID,
        *,
        start_date: datetime,
        end_date: datetime,
    ) -> float:
        """Return the sum of amounts for a user in period."""
        return (
            self._db.query(func.sum(Expense.amount))
            .filter(
                and_(
                    Expense.user_id == user_id,
                    Expense.date >= start_date,
                    Expense.date <= end_date,
                )
            )
            .scalar()
            or 0.0
        )

    def expenses_for_ai(
        self,
        user_id: UUID,
        *,
        start_date: datetime,
        end_date: datetime,
    ) -> List[Expense]:
        """Return expenses for AI insight generation."""
        return (
            self._base_query(user_id)
            .filter(
                and_(
                    Expense.date >= start_date,
                    Expense.date <= end_date,
                )
            )
            .all()
        )

    # ------------------------------------------------------------------
    # Transaction helpers
    # ------------------------------------------------------------------
    def rollback(self) -> None:
        self._db.rollback()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _base_query(self, user_id: UUID):
        return self._db.query(Expense).filter(Expense.user_id == user_id)
