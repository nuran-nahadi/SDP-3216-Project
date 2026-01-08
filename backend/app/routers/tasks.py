from fastapi import APIRouter, Depends, Query, Path, status, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.facades.task_facade import TaskFacade
from app.repositories.task_repository import TaskRepository
from app.schemas.tasks import (
    TaskCreate, TaskUpdate, TaskParseRequest, TaskCompleteRequest,
    TaskResponse, TasksResponse, MessageResponse, TaskParseResponse,
    TaskPriority, TaskStatus, AITaskParseRequest, AITaskParseResponse, TaskStatsResponse
)
from app.models.models import User
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.services.ai_rate_limit import ai_rate_limit


router = APIRouter(tags=["Tasks"], prefix="/tasks")


def get_task_facade(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
) -> TaskFacade:
    """Instantiate a task facade per request."""
    return TaskFacade(TaskRepository(db), current_user)


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=TasksResponse,
    summary="List tasks",
    description="Retrieve tasks with optional filters and pagination"
)
def get_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status", description="Filter by task status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    due_date: Optional[datetime] = Query(None, description="Filter by due date"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date range"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date range"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    facade: TaskFacade = Depends(get_task_facade),
):
    """List tasks with filters"""
    return facade.get_tasks(
        status_filter=status_filter,
        priority=priority,
        due_date=due_date,
        start_date=start_date,
        end_date=end_date,
        tags=tags,
        search=search,
        page=page,
        limit=limit,
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=TaskResponse,
    summary="Create task",
    description="Create a new task"
)
def create_task(
    task_data: TaskCreate,
    facade: TaskFacade = Depends(get_task_facade),
):
    """Create a new task"""
    return facade.create_task(task_data)


@router.get(
    "/today",
    status_code=status.HTTP_200_OK,
    response_model=TasksResponse,
    summary="Get today's tasks",
    description="Get tasks due today"
)
def get_today_tasks(
    facade: TaskFacade = Depends(get_task_facade),
):
    """Get today's tasks"""
    return facade.get_today_tasks()

@router.get(
    "/stats/today",
    status_code=status.HTTP_200_OK,
    response_model=TaskStatsResponse,
    summary="Get today's task stats",
    description="Get basic task statistics for today (e.g., completed count)"
)
def get_today_task_stats(
    facade: TaskFacade = Depends(get_task_facade),
):
    """Get today's task stats."""
    return facade.get_today_task_stats()


@router.get(
    "/overdue",
    status_code=status.HTTP_200_OK,
    response_model=TasksResponse,
    summary="Get overdue tasks",
    description="Get overdue tasks"
)
def get_overdue_tasks(
    facade: TaskFacade = Depends(get_task_facade),
):
    """Get overdue tasks"""
    return facade.get_overdue_tasks()


@router.get(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    response_model=TaskResponse,
    summary="Get task",
    description="Get a specific task by ID"
)
def get_task(
    task_id: UUID = Path(..., description="Task ID"),
    facade: TaskFacade = Depends(get_task_facade),
):
    """Get a specific task"""
    return facade.get_task(task_id)


@router.put(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    response_model=TaskResponse,
    summary="Update task",
    description="Update an existing task"
)
def update_task(
    task_data: TaskUpdate,
    task_id: UUID = Path(..., description="Task ID"),
    facade: TaskFacade = Depends(get_task_facade),
):
    """Update an existing task"""
    return facade.update_task(task_id, task_data)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    summary="Delete task",
    description="Delete a task"
)
def delete_task(
    task_id: UUID = Path(..., description="Task ID"),
    facade: TaskFacade = Depends(get_task_facade),
):
    """Delete a task"""
    return facade.delete_task(task_id)


@router.patch(
    "/{task_id}/complete",
    status_code=status.HTTP_200_OK,
    response_model=TaskResponse,
    summary="Complete task",
    description="Mark a task as completed"
)
def complete_task(
    complete_data: TaskCompleteRequest,
    task_id: UUID = Path(..., description="Task ID"),
    facade: TaskFacade = Depends(get_task_facade),
):
    """Mark a task as completed"""
    return facade.complete_task(task_id, complete_data.actual_duration)


@router.post(
    "/parse",
    status_code=status.HTTP_200_OK,
    response_model=TaskParseResponse,
    summary="Parse natural language",
    description="Parse natural language text into task data"
)
def parse_task_text(
    parse_data: TaskParseRequest,
    facade: TaskFacade = Depends(get_task_facade),
):
    """Parse natural language text into task data"""
    parsed_data = facade.parse_natural_language(parse_data.text)
    return {
        "success": True,
        "data": parsed_data,
        "message": "Text parsed successfully"
    }

# AI-powered endpoints
@router.post(
    "/ai/parse-text",
    status_code=status.HTTP_200_OK,
    response_model=AITaskParseResponse,
    summary="Parse task from text using AI",
    description="Parse natural language text into task data using Gemini AI (does not create task)"
)
async def parse_text_with_ai(
    request: AITaskParseRequest,
    facade: TaskFacade = Depends(get_task_facade),
):
    """Parse task from natural language text using AI"""
    return await facade.parse_text_with_ai(request.text)

@router.post(
    "/ai/parse-voice",
    status_code=status.HTTP_200_OK,
    response_model=AITaskParseResponse,
    summary="Parse task from voice using AI",
    description="Parse voice recording into task data using Gemini AI (does not create task)"
)
async def parse_voice_with_ai(
    file: UploadFile = File(..., description="Audio file (MP3, WAV, M4A, etc.)"),
    facade: TaskFacade = Depends(get_task_facade),
):
    """Parse task from voice using AI"""
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
    response_model=TaskStatsResponse,
    summary="AI Task Insights",
    description="Generate AI-powered insights and recommendations for the user's tasks"
)
@ai_rate_limit(feature="tasks:insights", key_param="current_user")
async def get_task_ai_insights(
    facade: TaskFacade = Depends(get_task_facade),
):
    """Generate AI-powered insights and recommendations for the user's tasks"""
    return await facade.get_ai_insights()
