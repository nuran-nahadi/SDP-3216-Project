# Facade Pattern Integration for Backend Domain Aggregates

## Why this change
- **Problem**: Routers, services, and utilities were tightly coupled. Endpoints orchestrated raw SQLAlchemy queries, JSON handling, and validation logic directly against models.
- **Goal**: Introduce a clear orchestration layer so that domain-specific workflows are centralized, improving readability, maintainability, and opportunities for reuse/testing.
- **Solution**: Apply the Facade pattern per aggregate (`ExpenseFacade`, `EventFacade`). Facades coordinate repository operations, validation, and ancillary behaviours (AI helpers, upload utilities, dashboard analytics).

## New structure
```
backend/app/
  facades/
    __init__.py
    expense_facade.py
    event_facade.py
  repositories/
    __init__.py
    expense_repository.py
    event_repository.py
  services/
    expenses.py        # thin wrappers delegating to ExpenseFacade
    events.py          # thin wrappers delegating to EventFacade
  routers/
    expenses.py        # now depends on ExpenseFacade via Depends()
    events.py          # now depends on EventFacade via Depends()
```

### Repository layer
- `ExpenseRepository` and `EventRepository` encapsulate *all* direct database interactions per aggregate.
- Responsibilities: filtering, pagination, aggregates, date-scoped queries, rolling up totals, and transactions (commit/rollback).
- Benefits: decouples ORM details from higher layers; unit tests can mock repositories without hitting DB.

### Facade layer
- `ExpenseFacade` and `EventFacade` orchestrate workflows: converting schemas, handling tags JSON encoding/decoding, coordinating AI helpers, upload integrations, and composing dashboard analytics.
- Enforces domain logic boundaries (e.g., monthly checks, AI fallbacks) in a single place.
- Provides clean API consumed by both services and routers.

### Service layer updates
- `ExpenseService` & `EventService` are now lightweight shims: `ExpenseService._facade(db, user)` instantiates the corresponding facade and forwards calls.
- Maintains legacy import points to minimise changes for other modules (e.g., tests relying on `ExpenseService`).

### Router updates
- Routers no longer juggle raw repositories/services. Instead they resolve a facade via FastAPI dependency injection (`get_expense_facade`, `get_event_facade`).
- Endpoint bodies simply call the appropriate facade method, focusing the router on HTTP concerns (validation, response formatting, request metadata).

## Behavioural notes
- Error handling mirrors the previous behaviour: HTTP exceptions raised at the facade layer propagate to routers.
- JSON/tag conversions centralised in facades; routers and services no longer decode/encode tags manually.
- Dashboard and AI utilities moved wholesale into facades, ensuring cross-cutting workflows stay coherent.
- Services retain asynchronous methods (receipt upload, AI parsing) by awaiting the facade equivalents.

## Extensibility & testing
- New repositories make it straightforward to add domain-specific queries without touching routers.
- Facades offer a single chokepoint for orchestrating new behaviours (e.g., adding auditing or caching) with minimal surface change.
- Unit tests can mock repositories when exercising facade logic, or mock facades when testing routers.

## Suggested follow-up tasks
1. Add repository-level unit tests covering common query filters and aggregates.
2. Cover facade orchestrations with tests to ensure error cases (e.g., missing expenses, invalid AI responses) remain consistent.
3. Update higher-level architecture diagrams (`current_architecture.md`) to reference the new repository/facade layers.
4. Consider extending the pattern to other aggregates (journal, tasks, etc.) for consistency.

## Quick usage reference
```python
# Inside routers or background jobs
from app.facades.expense_facade import ExpenseFacade
from app.repositories.expense_repository import ExpenseRepository

facade = ExpenseFacade(ExpenseRepository(db_session), current_user)
result = facade.get_expense_summary(start_date=start, end_date=end)
```
- Routers obtain facades via the provided dependency helpers; other consumers can instantiate directly with a `Session` and current `User`.

## Summary
This refactor introduces a Facade layer (supported by repositories) to provide a clean, testable, and expressive domain API for the backend. Routers and services are now thin, freeing them to focus on HTTP concerns while facades coordinate business logic across repositories, AI helpers, and utilities.
