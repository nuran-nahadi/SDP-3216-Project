from fastapi import APIRouter, Depends, Query, Path, status, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.facades.event_facade import EventFacade
from app.repositories.event_repository import EventRepository
from app.schemas.events import (
    EventCreate, EventUpdate, EventParseRequest,
    EventResponse, EventsResponse, CalendarResponse, 
    MessageResponse, EventParseResponse, AIEventParseRequest, AIEventParseResponse
)
from app.models.models import User
from typing import Optional, List
from datetime import datetime
from uuid import UUID


router = APIRouter(tags=["Events"], prefix="/events")


def get_event_facade(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
) -> EventFacade:
    """Instantiate the event facade for a request."""
    return EventFacade(EventRepository(db), current_user)


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=EventsResponse,
    summary="List events",
    description="Retrieve events with optional filters and pagination"
)
def get_events(
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    search: Optional[str] = Query(None, description="Search in title, description, location"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    facade: EventFacade = Depends(get_event_facade)
):
    """List events with filters"""
    result = facade.get_events(
        start_date=start_date,
        end_date=end_date,
        tags=tags,
        search=search,
        page=page,
        limit=limit,
    )
    return {
        "success": True,
        "data": result["data"],
        "message": "Events retrieved successfully",
        "meta": result["meta"]
    }


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=EventResponse,
    summary="Create new event",
    description="Create a new event"
)
def create_event(
    event: EventCreate,
    facade: EventFacade = Depends(get_event_facade)
):
    """Create a new event"""
    result = facade.create_event(event)
    return {
        "success": True,
        "data": result["data"],
        "message": "Event created successfully",
        "meta": {"timestamp": datetime.utcnow()}
    }


@router.get(
    "/upcoming",
    status_code=status.HTTP_200_OK,
    response_model=EventsResponse,
    summary="Get upcoming events",
    description="Get upcoming events for the next 7 days"
)
def get_upcoming_events(
    days: int = Query(7, ge=1, le=30, description="Number of days to look ahead"),
    facade: EventFacade = Depends(get_event_facade)
):
    """Get upcoming events for the next N days"""
    try:
        result = facade.get_upcoming_events(days)
        return {
            "success": True,
            "data": result["data"],
            "message": "Upcoming events retrieved successfully",
            "meta": result["meta"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve upcoming events: {str(e)}"
        )


@router.get(
    "/calendar/{year}/{month}",
    status_code=status.HTTP_200_OK,
    response_model=CalendarResponse,
    summary="Get calendar view",
    description="Get calendar view for a specific month"
)
def get_calendar_view(
    year: int = Path(..., ge=1900, le=3000, description="Year"),
    month: int = Path(..., ge=1, le=12, description="Month"),
    facade: EventFacade = Depends(get_event_facade)
):
    """Get calendar view for a specific month"""
    try:
        result = facade.get_calendar_view(year, month)
        return {
            "success": True,
            "data": result["data"],
            "message": "Calendar view retrieved successfully",
            "meta": {"timestamp": datetime.utcnow()}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve calendar view: {str(e)}"
        )


@router.get(
    "/{event_id}",
    status_code=status.HTTP_200_OK,
    response_model=EventResponse,
    summary="Get specific event",
    description="Retrieve a specific event by ID"
)
def get_event(
    event_id: UUID,
    facade: EventFacade = Depends(get_event_facade)
):
    """Get a specific event by ID"""
    result = facade.get_event_by_id(event_id)
    return {
        "success": True,
        "data": result["data"],
        "message": "Event retrieved successfully",
        "meta": {"timestamp": datetime.utcnow()}
    }


@router.put(
    "/{event_id}",
    status_code=status.HTTP_200_OK,
    response_model=EventResponse,
    summary="Update event",
    description="Update an existing event"
)
def update_event(
    event_id: UUID,
    event: EventUpdate,
    facade: EventFacade = Depends(get_event_facade)
):
    """Update an existing event"""
    result = facade.update_event(event_id, event)
    return {
        "success": True,
        "data": result["data"],
        "message": "Event updated successfully",
        "meta": {"timestamp": datetime.utcnow()}
    }


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    summary="Delete event",
    description="Delete an existing event"
)
def delete_event(
    event_id: UUID,
    facade: EventFacade = Depends(get_event_facade)
):
    """Delete an existing event"""
    facade.delete_event(event_id)
    return {
        "success": True,
        "message": "Event deleted successfully",
        "meta": {"timestamp": datetime.utcnow()}
    }





@router.post(
    "/parse",
    status_code=status.HTTP_200_OK,
    response_model=EventParseResponse,
    summary="Parse natural language",
    description="Parse natural language into event data"
)
def parse_natural_language(
    request: EventParseRequest,
    facade: EventFacade = Depends(get_event_facade)
):
    """Parse natural language text into event data"""
    result = facade.parse_natural_language(request.text)
    return {
        "success": True,
        "data": result["data"],
        "message": "Text parsed successfully",
        "meta": {"timestamp": datetime.utcnow()}
    }


@router.post(
    "/ai/parse-text",
    status_code=status.HTTP_201_CREATED,
    response_model=AIEventParseResponse,
    summary="Parse event from text using AI",
    description="Parse natural language text into event data using Gemini AI"
)
async def parse_text_with_ai(
    request: AIEventParseRequest,
    facade: EventFacade = Depends(get_event_facade)
):
    """Parse event from natural language text using AI"""
    return await facade.parse_text_with_ai(request.text)

@router.post(
    "/ai/parse-voice",
    status_code=status.HTTP_201_CREATED,
    response_model=AIEventParseResponse,
    summary="Parse event from voice using AI",
    description="Parse voice recording into event data using Gemini AI"
)
async def parse_voice_with_ai(
    file: UploadFile = File(..., description="Audio file (MP3, WAV, M4A, etc.)"),
    facade: EventFacade = Depends(get_event_facade)
):
    """Parse event from voice using AI"""
    allowed_audio_types = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a']
    if not file.content_type or file.content_type not in allowed_audio_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file (MP3, WAV, M4A)"
        )
    return await facade.parse_voice_with_ai(file)
