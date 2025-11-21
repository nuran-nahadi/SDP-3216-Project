from fastapi import APIRouter, Depends, Query, UploadFile, File, status, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.facades.expense_facade import ExpenseFacade
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expenses import (
    ExpenseCreate, ExpenseUpdate, ExpenseParseRequest, ExpenseBulkImport,
    ExpenseResponse, ExpensesResponse, ExpenseSummaryResponse, 
    MonthlyExpenseResponse, CategoriesResponse, MessageResponse,
    AIExpenseParseRequest, AIExpenseParseResponse, AIInsightsResponse,
    TotalSpendResponse, CategoryBreakdownResponse, CategoryTrendResponse,
    SpendTrendResponse, TopTransactionsResponse
)
from app.models.models import User
from typing import Optional
from datetime import datetime
from uuid import UUID


router = APIRouter(tags=["Expenses"], prefix="/expenses")


def get_expense_facade(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
) -> ExpenseFacade:
    """Instantiate an expense facade per request."""
    return ExpenseFacade(ExpenseRepository(db), current_user)


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=ExpensesResponse,
    summary="List expenses",
    description="Retrieve expenses with optional filters and pagination"
)
def get_expenses(
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_amount: Optional[float] = Query(None, description="Filter by minimum amount"),
    max_amount: Optional[float] = Query(None, description="Filter by maximum amount"),
    search: Optional[str] = Query(None, description="Search in description, merchant, subcategory"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """List expenses with filters"""
    return facade.get_expenses(
        start_date=start_date,
        end_date=end_date,
        category=category,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search,
        page=page,
        limit=limit,
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ExpenseResponse,
    summary="Create new expense",
    description="Create a new expense entry"
)
def create_expense(
    expense_data: ExpenseCreate,
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Create new expense"""
    return facade.create_expense(expense_data)


@router.get(
    "/{expense_id}",
    status_code=status.HTTP_200_OK,
    response_model=ExpenseResponse,
    summary="Get specific expense",
    description="Retrieve a specific expense by ID"
)
def get_expense(
    expense_id: UUID,
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get specific expense"""
    return facade.get_expense(expense_id)


@router.put(
    "/{expense_id}",
    status_code=status.HTTP_200_OK,
    response_model=ExpenseResponse,
    summary="Update expense",
    description="Update an existing expense"
)
def update_expense(
    expense_id: UUID,
    expense_data: ExpenseUpdate,
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Update expense"""
    return facade.update_expense(expense_id, expense_data)


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_200_OK,
    response_model=ExpenseResponse,
    summary="Delete expense",
    description="Delete an expense"
)
def delete_expense(
    expense_id: UUID,
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Delete expense"""
    return facade.delete_expense(expense_id)





@router.get(
    "/summary",
    status_code=status.HTTP_200_OK,
    response_model=ExpenseSummaryResponse,
    summary="Get spending summary",
    description="Get spending summary with category breakdown for a period"
)
def get_expense_summary(
    start_date: Optional[datetime] = Query(None, description="Summary start date"),
    end_date: Optional[datetime] = Query(None, description="Summary end date"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get spending summary"""
    return facade.get_expense_summary(start_date=start_date, end_date=end_date)


@router.get(
    "/categories",
    status_code=status.HTTP_200_OK,
    response_model=CategoriesResponse,
    summary="Get expense categories",
    description="Get expense categories with totals"
)
def get_categories(
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get expense categories with totals"""
    return facade.get_categories_summary()


@router.get(
    "/monthly/{year}/{month}",
    status_code=status.HTTP_200_OK,
    response_model=MonthlyExpenseResponse,
    summary="Get monthly expenses",
    description="Get expenses for a specific month"
)
def get_monthly_expenses(
    year: int,
    month: int,
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get monthly expenses"""
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12"
        )

    return facade.get_monthly_expenses(year, month)


@router.post(
    "/{expense_id}/receipt",
    status_code=status.HTTP_200_OK,
    response_model=ExpenseResponse,
    summary="Upload receipt",
    description="Upload receipt image for an expense"
)
async def upload_receipt(
    expense_id: UUID,
    file: UploadFile = File(..., description="Receipt image file"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Upload receipt image"""
    return await facade.upload_receipt(expense_id, file)


@router.get(
    "/recurring",
    status_code=status.HTTP_200_OK,
    response_model=ExpensesResponse,
    summary="Get recurring expenses",
    description="Get all recurring expenses"
)
def get_recurring_expenses(
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get recurring expenses"""
    return facade.get_recurring_expenses()


# @router.post(
#     "/bulk",
#     status_code=status.HTTP_201_CREATED,
#     response_model=ExpensesResponse,
#     summary="Bulk import expenses",
#     description="Import multiple expenses at once"
# )
# def bulk_import_expenses(
#     bulk_data: ExpenseBulkImport,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user())
# ):
#     """Bulk import expenses"""
#     return ExpenseService.bulk_import_expenses(db, current_user, bulk_data)


@router.get(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export expenses",
    description="Export expenses to CSV or JSON format"
)
def export_expenses(
    format: str = Query("csv", enum=["csv", "json"], description="Export format"),
    start_date: Optional[datetime] = Query(None, description="Export start date"),
    end_date: Optional[datetime] = Query(None, description="Export end date"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Export expenses"""
    return facade.export_expenses(
        format=format,
        start_date=start_date,
        end_date=end_date,
    )

# AI-powered endpoints
@router.post(
    "/ai/parse-text",
    status_code=status.HTTP_201_CREATED,
    response_model=AIExpenseParseResponse,
    summary="Parse expense from text using AI",
    description="Parse natural language text into expense data using Gemini AI"
)
async def parse_text_with_ai(
    request: AIExpenseParseRequest,
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Parse expense from natural language text using AI"""
    return await facade.parse_text_with_ai(request.text)


@router.post(
    "/ai/parse-receipt",
    status_code=status.HTTP_201_CREATED,
    response_model=AIExpenseParseResponse,
    summary="Parse expense from receipt image using AI",
    description="Parse receipt image into expense data using Gemini AI"
)
async def parse_receipt_with_ai(
    file: UploadFile = File(..., description="Receipt image file (JPG, PNG, etc.)"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Parse expense from receipt image using AI"""
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

    return await facade.parse_receipt_with_ai(file)


@router.post(
    "/ai/parse-voice",
    status_code=status.HTTP_201_CREATED,
    response_model=AIExpenseParseResponse,
    summary="Parse expense from voice recording using AI",
    description="Parse voice recording into expense data using speech recognition and Gemini AI"
)
async def parse_voice_with_ai(
    file: UploadFile = File(..., description="Audio file (MP3, WAV, M4A, etc.)"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Parse expense from voice recording using AI"""
    # Validate file type
    allowed_audio_types = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/webm']
    if not file.content_type or file.content_type not in allowed_audio_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file (MP3, WAV, M4A, WebM)"
        )

    return await facade.parse_voice_with_ai(file)


@router.get(
    "/ai/insights",
    status_code=status.HTTP_200_OK,
    response_model=AIInsightsResponse,
    summary="Get AI spending insights",
    description="Get AI-powered insights about spending patterns and recommendations"
)
async def get_ai_insights(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get AI-powered spending insights"""
    return await facade.get_ai_insights(days)


# ================================ DASHBOARD ENDPOINTS ================================

@router.get(
    "/dashboard/total-spend",
    status_code=status.HTTP_200_OK,
    response_model=TotalSpendResponse,
    summary="Get total spend dashboard data",
    description="Get current month total spend vs previous month with percentage change"
)
def get_total_spend_dashboard(
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get total spend dashboard data"""
    return facade.get_total_spend_dashboard()


@router.get(
    "/dashboard/category-breakdown",
    status_code=status.HTTP_200_OK,
    response_model=CategoryBreakdownResponse,
    summary="Get category breakdown dashboard data",
    description="Get spending breakdown by category for pie chart visualization"
)
def get_category_breakdown_dashboard(
    period: str = Query("current_month", enum=["current_month", "last_30_days", "current_year"], 
                       description="Time period for breakdown"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get category breakdown dashboard data"""
    return facade.get_category_breakdown_dashboard(period)


@router.get(
    "/dashboard/category-trend",
    status_code=status.HTTP_200_OK,
    response_model=CategoryTrendResponse,
    summary="Get category trend dashboard data",
    description="Get category spending trend over time showing how each category evolves"
)
def get_category_trend_dashboard(
    months: int = Query(6, ge=3, le=24, description="Number of months to analyze"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get category trend dashboard data"""
    return facade.get_category_trend_dashboard(months)


@router.get(
    "/dashboard/spend-trend",
    status_code=status.HTTP_200_OK,
    response_model=SpendTrendResponse,
    summary="Get spend trend dashboard data",
    description="Get spending trend over time for line chart visualization"
)
def get_spend_trend_dashboard(
    period: str = Query("daily", enum=["daily", "weekly", "monthly"], 
                       description="Time period granularity"),
    days: int = Query(30, ge=7, le=365, description="Number of days to analyze"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get spend trend dashboard data"""
    return facade.get_spend_trend_dashboard(period=period, days=days)


@router.get(
    "/dashboard/top-transactions",
    status_code=status.HTTP_200_OK,
    response_model=TopTransactionsResponse,
    summary="Get top transactions dashboard data",
    description="Get top transactions by amount for specified period"
)
def get_top_transactions_dashboard(
    period: str = Query("monthly", enum=["weekly", "monthly", "yearly"], 
                       description="Time period for top transactions"),
    limit: int = Query(5, ge=3, le=10, description="Number of top transactions to return"),
    facade: ExpenseFacade = Depends(get_expense_facade)
):
    """Get top transactions dashboard data"""
    return facade.get_top_transactions_dashboard(period=period, limit=limit)
