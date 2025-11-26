from app.routers import users, auth, accounts, user_profile, expenses, events, tasks, journal, daily_update
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


app = FastAPI(
    title="LIN: AI-Powered Personal Life Manager API",
    description="A unified web application that empowers users to effortlessly track and reflect on key aspects of their daily lives",
    version="1.0.0",
    redirect_slashes=False,
    swagger_ui_parameters={
        "syntaxHighlight.theme": "monokai",
        "layout": "BaseLayout",
        "filter": True,
        "tryItOutEnabled": True,
        "onComplete": "Ok"
    },
)

# Add CORS middleware with specific origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Include routers
app.include_router(auth.router)
app.include_router(user_profile.router)  # User profile endpoints
app.include_router(events.router)        # Event management endpoints
app.include_router(expenses.router)      # Expense management endpoints
app.include_router(tasks.router)         # Task management endpoints
app.include_router(journal.router)       # Journal management endpoints
app.include_router(daily_update.router)  # Daily update AI agent endpoints
app.include_router(users.router)         # Legacy admin user management
app.include_router(accounts.router)


# Health check endpoint
@app.get("/health", tags=["Health"])
def health_check():
    """API health check endpoint"""
    auth_status = "DISABLED" if settings.disable_auth else "ENABLED"
    return {
        "success": True,
        "message": "LIN API is running successfully",
        "version": "1.0.0",
        "auth_status": auth_status
    }