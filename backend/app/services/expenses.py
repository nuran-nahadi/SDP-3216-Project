"""Facade-backed expense service wrappers."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.facades.expense_facade import ExpenseFacade
from app.models.models import User
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expenses import ExpenseCreate, ExpenseUpdate


class ExpenseService:
	"""Maintains the historic service interface while delegating to facades."""

	@staticmethod
	def _facade(db: Session, user: User) -> ExpenseFacade:
		return ExpenseFacade(ExpenseRepository(db), user)

	@staticmethod
	def get_expenses(
		db: Session,
		user: User,
		start_date: Optional[datetime] = None,
		end_date: Optional[datetime] = None,
		category: Optional[str] = None,
		min_amount: Optional[float] = None,
		max_amount: Optional[float] = None,
		search: Optional[str] = None,
		page: int = 1,
		limit: int = 50,
	) -> dict:
		return ExpenseService._facade(db, user).get_expenses(
			start_date=start_date,
			end_date=end_date,
			category=category,
			min_amount=min_amount,
			max_amount=max_amount,
			search=search,
			page=page,
			limit=limit,
		)

	@staticmethod
	def create_expense(db: Session, user: User, expense_data: ExpenseCreate) -> dict:
		return ExpenseService._facade(db, user).create_expense(expense_data)

	@staticmethod
	def get_expense(db: Session, user: User, expense_id: UUID) -> dict:
		return ExpenseService._facade(db, user).get_expense(expense_id)

	@staticmethod
	def update_expense(
		db: Session,
		user: User,
		expense_id: UUID,
		expense_data: ExpenseUpdate,
	) -> dict:
		return ExpenseService._facade(db, user).update_expense(expense_id, expense_data)

	@staticmethod
	def delete_expense(db: Session, user: User, expense_id: UUID) -> dict:
		return ExpenseService._facade(db, user).delete_expense(expense_id)

	@staticmethod
	def get_expense_summary(
		db: Session,
		user: User,
		start_date: Optional[datetime] = None,
		end_date: Optional[datetime] = None,
	) -> dict:
		return ExpenseService._facade(db, user).get_expense_summary(
			start_date=start_date,
			end_date=end_date,
		)

	@staticmethod
	def get_categories_summary(db: Session, user: User) -> dict:
		return ExpenseService._facade(db, user).get_categories_summary()

	@staticmethod
	def get_monthly_expenses(
		db: Session,
		user: User,
		year: int,
		month: int,
	) -> dict:
		return ExpenseService._facade(db, user).get_monthly_expenses(year, month)

	@staticmethod
	async def upload_receipt(
		db: Session,
		user: User,
		expense_id: UUID,
		file: UploadFile,
	) -> dict:
		return await ExpenseService._facade(db, user).upload_receipt(expense_id, file)

	@staticmethod
	def get_recurring_expenses(db: Session, user: User) -> dict:
		return ExpenseService._facade(db, user).get_recurring_expenses()

	@staticmethod
	def export_expenses(
		db: Session,
		user: User,
		format: str = "csv",
		start_date: Optional[datetime] = None,
		end_date: Optional[datetime] = None,
	) -> dict:
		return ExpenseService._facade(db, user).export_expenses(
			format=format,
			start_date=start_date,
			end_date=end_date,
		)

	@staticmethod
	async def parse_text_with_ai(db: Session, user: User, text: str) -> dict:
		return await ExpenseService._facade(db, user).parse_text_with_ai(text)

	@staticmethod
	async def parse_receipt_with_ai(
		db: Session,
		user: User,
		image_file: UploadFile,
	) -> dict:
		return await ExpenseService._facade(db, user).parse_receipt_with_ai(image_file)

	@staticmethod
	async def parse_voice_with_ai(
		db: Session,
		user: User,
		audio_file: UploadFile,
	) -> dict:
		return await ExpenseService._facade(db, user).parse_voice_with_ai(audio_file)

	@staticmethod
	async def get_ai_insights(db: Session, user: User, days: int = 30) -> dict:
		return await ExpenseService._facade(db, user).get_ai_insights(days)

	@staticmethod
	def get_total_spend_dashboard(db: Session, user: User) -> dict:
		return ExpenseService._facade(db, user).get_total_spend_dashboard()

	@staticmethod
	def get_category_breakdown_dashboard(
		db: Session,
		user: User,
		period: str = "current_month",
	) -> dict:
		return ExpenseService._facade(db, user).get_category_breakdown_dashboard(period)

	@staticmethod
	def get_category_trend_dashboard(
		db: Session,
		user: User,
		months: int = 6,
	) -> dict:
		return ExpenseService._facade(db, user).get_category_trend_dashboard(months)

	@staticmethod
	def get_spend_trend_dashboard(
		db: Session,
		user: User,
		period: str = "daily",
		days: int = 30,
	) -> dict:
		return ExpenseService._facade(db, user).get_spend_trend_dashboard(
			period=period,
			days=days,
		)

	@staticmethod
	def get_top_transactions_dashboard(
		db: Session,
		user: User,
		period: str = "monthly",
		limit: int = 5,
	) -> dict:
		return ExpenseService._facade(db, user).get_top_transactions_dashboard(
			period=period,
			limit=limit,
		)
