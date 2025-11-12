# LIN Backend Architecture Overview

## Context
- **Stack**: FastAPI application served via Uvicorn; SQLAlchemy ORM with a PostgreSQL (Supabase-hosted) database; Pydantic v2 (`pydantic_settings`) for configuration; JWT-based authentication; optional Google Gemini-powered AI utilities.
- **Deployment shape**: The FastAPI app lives under `backend/app`. Convenience launchers exist in `backend/run.py` (Uvicorn entrypoint) and `backend/main.py` (imports the ASGI app for other runners). Static uploads are exposed directly by FastAPI.
- **Primary goal**: Provide RESTful APIs for personal productivity features (users, accounts, expenses, events, tasks, journals) consumed by the React frontend in `frontend/`.

## High-Level Structure
| Layer | Description | Key Modules |
| --- | --- | --- |
| API Layer | FastAPI routers define HTTP endpoints, request validation, and dependency wiring. | `backend/app/routers/*.py`
| Service Layer | Business logic, orchestration, and integration with external systems (e.g., AI). | `backend/app/services/*.py`
| Schema Layer | Pydantic models for request/response contracts and validation. | `backend/app/schemas/*.py`
| Data Layer | SQLAlchemy models, database session management, migrations. | `backend/app/models/models.py`, `backend/app/db/database.py`, migration scripts in `backend/`
| Core Utilities | Configuration, dependency toggles, security helpers, shared responses. | `backend/app/core/*`, `backend/app/utils/responses.py`
| Support Scripts & Tests | API doc stubs, integration tests, AI feature tests. | `backend/apidocs`, `backend/apitests`, `backend/test_ai_features.py`

## Runtime Flow
1. **Startup**: `backend/app/main.py` instantiates the FastAPI app with metadata, CORS configuration, and static file mounting.
2. **Routing**: Routers from `app.routers` are registered (auth, user profile, events, expenses, tasks, journal, users, accounts). Each router injects dependencies with FastAPI's `Depends` system.
3. **Authentication**: `app.core.dependencies.get_current_user()` chooses between development or JWT-backed authentication depending on `settings.disable_auth`.
4. **Request Handling**:
   - Request payloads are coerced into Pydantic schemas (`app/schemas`).
   - Router handlers call corresponding service methods, passing the database session (`app.db.database.get_db`) and authenticated `User` model instances.
   - Services execute business rules, compose responses, and raise HTTP exceptions on error. Direct SQLAlchemy queries are used; there is no repository abstraction.
5. **Persistence**: SQLAlchemy models defined in `app.models.models` map to PostgreSQL tables. The `SessionLocal` scoped session mediates transactions; commits/rollbacks happen inside service methods.
6. **Response**: Service results are wrapped into structured responses adhering to schema definitions before returning to the client.

## Configuration & Environment
- `app.core.config.Settings` loads configuration from environment variables (`.env` file) via `BaseSettings`.
- Database URL prefers `supabase_db_url`; otherwise it assembles credentials.
- JWT configuration (secret, algorithm, expirations), optional Cloudinary/AI/email settings, debug toggles, and the `disable_auth` flag live here.
- `app/core/dependencies.py` switches auth dependencies based on configuration (wired for dev environments where real auth is disabled).

## Security & Auth
- Password hashing uses `passlib` (`bcrypt`).
- Bearer tokens validated with `python-jose`; `get_current_authenticated_user` resolves the `User` from the JWT payload and guards against inactive accounts.
- Admin-only routes (e.g., legacy user management) rely on `get_admin_check()` dependency and role-based filtering.
- Response helpers in `app.utils.responses.ResponseHandler` standardize success/error payloads.

## Data Layer Details
- Central models: `User`, `UserPreferences`, `Expense`, `Event`, `Task`, `JournalEntry`. Each maps to UUID primary keys and stores timestamps via Postgres `TIMESTAMP` with server defaults.
- Relationships use SQLAlchemy `relationship` for user-centric joins (e.g., `User.expenses`).
- `Base.metadata.create_all(engine)` executes at import time, which is convenient for local setup but couples model definition and schema migration.
- Database connection uses Supabase via SSL with pre-ping and connection recycling; credentials logged from `DATABASE_URL` (consider removing the `print`).

## Business Logic Layer
- Each resource has a dedicated service (e.g., `app/services/events.py`, `app/services/tasks.py`, etc.).
- Service pattern: static methods accept `(db: Session, user: User, ...)`, perform validation, and return dictionaries shaped for response models.
- Event service includes advanced queries (calendar aggregation, tag filtering) and AI-assisted parsing.
- `app/services/ai_service.py` encapsulates Gemini interactions for expenses, tasks, and events using text, voice, and image inputs. It handles prompt construction, transcription (SpeechRecognition + pydub), image parsing (Pillow), and JSON extraction.

## API Surface
- Routers define summary/description metadata for OpenAPI. Examples:
  - `routers/events.py`: CRUD, filtering, calendar view, and AI parsing endpoints.
  - `routers/tasks.py`, `routers/expenses.py`, etc., follow similar structure with service delegation.
  - `routers/auth.py` handles login/token issuance and may bypass standard auth for development depending on settings.
- Upload endpoints use FastAPI's file handling (`UploadFile`) and serve stored files from `/uploads`.

## Supporting Assets
- **Migration scripts**: `backend/migrate_*.py` scripts migrate legacy or seed data into the Supabase database.
- **Tests**: Simple pytest-based API tests under `backend/apitests`. `backend/test_ai_features.py` validates AI parsing flows.
- **Documentation**: Static API markdown files in `backend/apidocs/` outline endpoint contracts for each domain.
- **Shell tools**: `backend/setup_ai.sh` installs dependencies required for AI features on macOS/Linux.

## Observations & Constraints
- Services operate synchronously even when wrapping async AI calls (mix of sync/async in `events` service); future refactoring may be needed for consistent async handling.
- Direct `create_all` on import simplifies first-run setup but is unsafe for production migrations; consider Alembic or managed migrations.
- No domain-level abstraction between services and SQLAlchemy models; upcoming pattern work may introduce repositories, factories, or strategies.
- The `disable_auth` flag provides a convenient development mode but must be controlled in production deployments.
- Logging around AI services leverages Python `logging`; broader application logging strategy is minimal.

## Request Lifecycle Example (Events API)
1. Client sends `POST /events` with JSON conforming to `EventCreate`.
2. FastAPI validates the payload against `app.schemas.events.EventCreate` and injects `SessionLocal` and authenticated `User`.
3. `EventService.create_event` serializes tags, persists the event, commits the transaction, and builds the response dict.
4. Router wraps the result into an `EventResponse` with metadata and returns 201 Created.
5. Errors (validation, database) raise `HTTPException`, translated into structured HTTP responses by FastAPI.

## Testing & Quality Gates
- `backend/apitests` houses pytest suites that exercise key endpoints using FastAPI's TestClient.
- There is no CI configuration in-repo; manual test execution via `pytest backend/apitests` is implied.
- AI features rely on live external services; tests may require valid API keys and network connectivity.

## Next Steps for Pattern Introduction
- Identify cross-cutting concerns (e.g., error handling, transaction management) that could benefit from design patterns (Factory, Strategy, Adapter) without disrupting current layering.
- Evaluate areas where synchronous service methods should become async or use patterns to isolate I/O-heavy AI integrations.
