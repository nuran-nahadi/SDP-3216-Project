# Assignment 3: Pattern-Driven Feature Extension

## Design Report: Proactive Daily Update Agent with Decorator-Based Rate Limiting

**Course:** Software Design Patterns  
**Project:** LIN - AI-Powered Personal Life Manager  
**Date:** November 2025  
**GitHub Repository:** [https://github.com/nuran-nahadi/SDP-3216-Project](https://github.com/nuran-nahadi/SDP-3216-Project)

---

## Table of Contents

1. [Feature Proposal](#1-feature-proposal)
2. [Design Blueprint](#2-design-blueprint)
3. [Implementation and Demonstration](#3-implementation-and-demonstration)
4. [Conclusion](#4-conclusion)

---

## 1. Feature Proposal

### 1.1 Overview

We propose implementing a **Proactive Daily Update Agent** - an AI-powered conversational chatbot that conducts natural language interviews with users to capture their daily activities. This feature is protected by a **Decorator Pattern-based Rate Limiting System** that secures all AI endpoints in the application from abuse and ensures fair resource allocation.

### 1.2 The New Feature: Daily Update Chatbot

#### Problem Statement

Users of the LIN personal life manager need to log four types of daily activities:
- **Tasks** - Work completed, to-dos, deadlines
- **Expenses** - Money spent, purchases, bills  
- **Events** - Meetings, appointments, social activities
- **Journal** - Feelings, reflections, mood tracking

The existing system required users to manually navigate to each section and fill out forms individually - a tedious process that led to incomplete tracking and user fatigue.

#### Solution: AI Interviewer Agent

The Daily Update Agent acts as a proactive AI interviewer that:

1. **Initiates Conversation** - Greets the user and asks about their day
2. **Extracts Information** - Uses natural language processing to identify tasks, expenses, events, and journal entries from free-form conversation
3. **Probes for Missing Data** - Tracks which of the 4 categories have been covered and asks follow-up questions for missing ones
4. **Creates Draft Entries** - Automatically generates structured draft entries from the conversation
5. **Supports Voice Input** - Accepts voice recordings for hands-free updates
6. **Review & Accept Flow** - Users review AI-generated drafts before committing to the database

### 1.3 The Design Pattern: Decorator-Based Rate Limiting

#### Problem Statement

The LIN application exposes multiple AI-powered endpoints that consume external API resources (Google Gemini API):

| Existing AI Endpoints | New AI Endpoint |
|-----------------------|-----------------|
| Task Parser (text/voice) | **Daily Update Chatbot** |
| Expense Parser (text/voice/receipt) | |
| Event Parser (text/voice) | |
| Journal AI Insights | |

Without rate limiting, these endpoints are vulnerable to:
- **Resource Exhaustion** - Excessive API calls depleting quotas
- **Cost Overruns** - Uncontrolled usage leading to unexpected billing
- **Denial of Service** - Single users monopolizing resources
- **Performance Degradation** - System slowdown under heavy load

#### Solution: Decorator Pattern

We implemented a **Decorator Pattern** to add rate limiting to all AI endpoints:
- **Non-invasive** - Wraps existing functions without modifying business logic
- **Reusable** - Same decorator applies to all AI endpoints
- **Configurable** - Different limits for different features
- **Transparent** - Original function behavior preserved

### 1.4 Use Cases

| ID | Use Case | Actor | Description |
|----|----------|-------|-------------|
| UC-1 | Start Daily Update Session | User | User initiates a new daily update conversation with the AI |
| UC-2 | Chat with AI Interviewer | User | User sends natural language messages describing their day |
| UC-3 | Voice Input | User | User sends voice recordings instead of text |
| UC-4 | Review Draft Entries | User | User reviews AI-generated draft entries for tasks, expenses, events, journal |
| UC-5 | Accept/Reject Drafts | User | User accepts drafts to commit to database or rejects incorrect ones |
| UC-6 | Batch Accept | User | User accepts all pending drafts at once |
| UC-7 | Rate Limit Triggered | System | System blocks requests when user exceeds rate limit |
| UC-8 | Rate Limit Recovery | User | User waits for window reset and retries |

### 1.5 Planned Design Patterns

| Pattern | Application | Justification |
|---------|-------------|---------------|
| **Strategy** | AI Service Layer | Different AI strategies for different features (existing) |
| **Decorator** | Rate Limiting | Wraps endpoints to add rate limiting without code changes |
| **Singleton** | Rate Limit Manager | Single manager coordinates all rate limiters |
| **Repository** | Data Access | Abstracts database operations (existing) |
| **Facade** | Service Layer | Simplifies complex subsystem interactions (existing) |

---

## 2. Design Blueprint

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LIN Application                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    NEW FEATURE: Daily Update Agent                   │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Start Session│  │  Chat API    │  │ Voice Input  │               │    │
│  │  │    POST      │  │    POST      │  │    POST      │               │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │    │
│  │         │                 │                 │                        │    │
│  │         └─────────────────┼─────────────────┘                        │    │
│  │                           │                                          │    │
│  │                ┌──────────▼──────────┐                               │    │
│  │                │  @ai_rate_limit     │◄── DECORATOR PATTERN          │    │
│  │                │  (6 req/60s)        │                               │    │
│  │                └──────────┬──────────┘                               │    │
│  │                           │                                          │    │
│  │                ┌──────────▼──────────┐                               │    │
│  │                │ DailyUpdateStrategy │◄── STRATEGY PATTERN           │    │
│  │                │ (AI Interviewer)    │                               │    │
│  │                └──────────┬──────────┘                               │    │
│  │                           │                                          │    │
│  │         ┌─────────────────┼─────────────────┐                        │    │
│  │         │                 │                 │                        │    │
│  │  ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼───────┐                │    │
│  │  │Draft Entries│  │   Session    │  │ Conversation │                │    │
│  │  │  (Pending)  │  │  Management  │  │   History    │                │    │
│  │  └─────────────┘  └──────────────┘  └──────────────┘                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              EXISTING AI ENDPOINTS (Now Rate Limited)                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │  /tasks   │  │ /expenses │  │  /events  │  │ /journal  │        │    │
│  │  │   /ai/*   │  │   /ai/*   │  │   /ai/*   │  │   /ai/*   │        │    │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │    │
│  │        │              │              │              │               │    │
│  │        └──────────────┴──────────────┴──────────────┘               │    │
│  │                              │                                       │    │
│  │               ┌──────────────▼──────────────┐                        │    │
│  │               │      @ai_rate_limit         │◄── DECORATOR PATTERN   │    │
│  │               │      (20 req/60s)           │                        │    │
│  │               └─────────────────────────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Rate Limiting Infrastructure                      │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌───────────────────┐      ┌─────────────────────┐                 │    │
│  │  │ RateLimitManager  │─────>│ InMemoryRateLimiter │                 │    │
│  │  │   (Singleton)     │      │    (Strategy)       │                 │    │
│  │  └───────────────────┘      └─────────────────────┘                 │    │
│  │           │                                                          │    │
│  │           ▼                                                          │    │
│  │  ┌───────────────────┐      ┌─────────────────────┐                 │    │
│  │  │RateLimitExceeded  │─────>│ Exception Handler   │                 │    │
│  │  │     Error         │      │   (HTTP 429)        │                 │    │
│  │  └───────────────────┘      └─────────────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 UML Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DAILY UPDATE FEATURE CLASSES                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DailyUpdateSession                                 │
│                              <<Entity>>                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ + id: UUID                                                                  │
│ + user_id: UUID                                                             │
│ + started_at: datetime                                                      │
│ + ended_at: datetime                                                        │
│ + is_active: bool                                                           │
│ + categories_covered: List[str]                                             │
│ + conversation_history: List[Dict]                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ + add_message(role, content)                                                │
│ + mark_category_covered(category)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ has many
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PendingUpdate                                    │
│                              <<Entity>>                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ + id: UUID                                                                  │
│ + user_id: UUID                                                             │
│ + session_id: UUID                                                          │
│ + category: UpdateCategory (task|expense|event|journal)                     │
│ + summary: str                                                              │
│ + structured_data: Dict                                                     │
│ + status: UpdateStatus (pending|accepted|rejected)                          │
│ + created_at: datetime                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ + accept() -> creates actual entity                                         │
│ + reject()                                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DailyUpdateService                                  │
│                             <<Service>>                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ + start_session(db, user) -> DailyUpdateSession                             │
│ + get_active_session(db, user) -> DailyUpdateSession                        │
│ + end_session(db, user, session_id)                                         │
│ + add_conversation_message(db, session, role, content)                      │
│ + create_draft_entry(db, user, entry_data) -> PendingUpdate                 │
│ + accept_pending_update(db, user, update_id)                                │
│ + reject_pending_update(db, user, update_id)                                │
│ + batch_accept(db, user, update_ids)                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       DailyUpdateInterviewerStrategy                         │
│                       <<Strategy Implementation>>                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ - system_instruction: str                                                   │
│ - tools: List[Dict]  (function calling schema)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ + get_greeting() -> str                                                     │
│ + execute(user_message, history, categories_covered) -> Dict                │
│ - _process_function_calls(response) -> List[DraftEntry]                     │
│ - _check_completion(categories_covered) -> bool                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         DECORATOR PATTERN CLASSES                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              <<exception>>                                   │
│                         RateLimitExceededError                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ + feature: str                                                              │
│ + limit: int                                                                │
│ + window_seconds: int                                                       │
│ + retry_after: float                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ + __init__(feature, limit, window_seconds, retry_after)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ raises
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           InMemoryRateLimiter                                │
│                        <<Strategy Implementation>>                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ - requests: int                                                             │
│ - window_seconds: int                                                       │
│ - _lock: threading.Lock                                                     │
│ - _buckets: Dict[str, tuple[int, float]]                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ + __init__(requests: int, window_seconds: int)                              │
│ + check(key: str) -> Optional[float]                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ manages
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RateLimitManager                                  │
│                             <<Singleton>>                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ - default_requests: int                                                     │
│ - default_window_seconds: int                                               │
│ - _limiters: Dict[str, InMemoryRateLimiter]                                 │
│ - _lock: threading.Lock                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ + __init__(default_requests, default_window_seconds)                        │
│ - _limiter(feature, requests, window_seconds) -> InMemoryRateLimiter        │
│ + decorator(feature, key_param, ...) -> Callable                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ wraps
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ai_rate_limit                                    │
│                        <<Decorator Function>>                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Parameters:                                                                 │
│   + feature: str                                                            │
│   + key_param: Optional[str]                                                │
│   + requests: Optional[int]                                                 │
│   + window_seconds: Optional[int]                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ + __call__(func) -> Callable (decorated function)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ decorates
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API Endpoint Functions                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ NEW:                                                                        │
│   + chat_with_ai()           - Daily Update Chatbot (6 req/60s)             │
│                                                                             │
│ EXISTING (now protected):                                                   │
│   + parse_task_from_text()   - Task AI Parser (20 req/60s)                  │
│   + parse_task_from_voice()  - Task Voice Parser (20 req/60s)               │
│   + get_task_ai_insights()   - Task Insights (20 req/60s)                   │
│   + parse_expense_text()     - Expense AI Parser (20 req/60s)               │
│   + parse_expense_receipt()  - Receipt Scanner (20 req/60s)                 │
│   + parse_event_text()       - Event AI Parser (20 req/60s)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 UML Sequence Diagram: Daily Update Conversation Flow

```
┌──────┐     ┌─────────┐     ┌────────────┐     ┌──────────────┐     ┌────────────┐     ┌─────────┐
│Client│     │ Router  │     │@ai_rate    │     │DailyUpdate   │     │ AI Strategy│     │Gemini   │
│      │     │         │     │_limit      │     │Service       │     │            │     │API      │
└──┬───┘     └────┬────┘     └─────┬──────┘     └──────┬───────┘     └─────┬──────┘     └────┬────┘
   │              │                │                   │                   │                 │
   │ POST /sessions/start          │                   │                   │                 │
   │──────────────>                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │              │ start_session()│                   │                   │                 │
   │              │───────────────────────────────────>│                   │                 │
   │              │                │                   │                   │                 │
   │              │                │                   │ get_greeting()    │                 │
   │              │                │                   │──────────────────>│                 │
   │              │                │                   │                   │                 │
   │  201: {session_id, greeting}  │                   │                   │                 │
   │<──────────────────────────────────────────────────────────────────────│                 │
   │              │                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │ POST /sessions/{id}/chat      │                   │                   │                 │
   │ {user_message: "I had lunch   │                   │                   │                 │
   │  at subway for $12"}          │                   │                   │                 │
   │──────────────>                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │              │ check rate limit                   │                   │                 │
   │              │───────────────>│                   │                   │                 │
   │              │                │                   │                   │                 │
   │              │                │ ✓ under limit     │                   │                 │
   │              │                │ (count: 1/6)      │                   │                 │
   │              │<───────────────│                   │                   │                 │
   │              │                │                   │                   │                 │
   │              │ process message│                   │                   │                 │
   │              │───────────────────────────────────>│                   │                 │
   │              │                │                   │                   │                 │
   │              │                │                   │ execute()         │                 │
   │              │                │                   │──────────────────>│                 │
   │              │                │                   │                   │                 │
   │              │                │                   │                   │ generate()      │
   │              │                │                   │                   │────────────────>│
   │              │                │                   │                   │                 │
   │              │                │                   │                   │ AI Response +   │
   │              │                │                   │                   │ function_call:  │
   │              │                │                   │                   │ create_draft    │
   │              │                │                   │                   │<────────────────│
   │              │                │                   │                   │                 │
   │              │                │                   │ draft_entries     │                 │
   │              │                │                   │<──────────────────│                 │
   │              │                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │              │                │  create_draft_entry()                 │                 │
   │              │                │  (expense: Subway $12)                │                 │
   │              │                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │  200: {ai_response: "Got it!  │                   │                   │                 │
   │   Any tasks completed today?",│                   │                   │                 │
   │   drafts: [{expense}]}        │                   │                   │                 │
   │<──────────────────────────────────────────────────────────────────────│                 │
   │              │                │                   │                   │                 │
   │  ... conversation continues ...                   │                   │                 │
   │              │                │                   │                   │                 │
   │ GET /pending-updates          │                   │                   │                 │
   │──────────────>                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │  200: [{expense: Subway $12}, │                   │                   │                 │
   │        {task: Report done},   │                   │                   │                 │
   │        {journal: Good mood}]  │                   │                   │                 │
   │<──────────────                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │ POST /pending-updates/batch-accept                │                   │                 │
   │──────────────>                │                   │                   │                 │
   │              │                │                   │                   │                 │
   │              │ accept_all()   │                   │                   │                 │
   │              │───────────────────────────────────>│                   │                 │
   │              │                │                   │ creates actual    │                 │
   │              │                │                   │ Task, Expense,    │                 │
   │              │                │                   │ Journal entries   │                 │
   │              │                │                   │                   │                 │
   │  200: {accepted: 3}           │                   │                   │                 │
   │<──────────────                │                   │                   │                 │
```

### 2.4 UML Sequence Diagram: Rate Limit Exceeded Flow

```
┌──────┐     ┌─────────┐     ┌────────────┐     ┌──────────────┐     ┌────────────┐
│Client│     │ Router  │     │@ai_rate    │     │RateLimitMgr  │     │ Exception  │
│      │     │         │     │_limit      │     │              │     │ Handler    │
└──┬───┘     └────┬────┘     └─────┬──────┘     └──────┬───────┘     └─────┬──────┘
   │              │                │                   │                   │
   │ [After 6 requests in 60s]     │                   │                   │
   │              │                │                   │                   │
   │ POST /sessions/{id}/chat      │                   │                   │
   │──────────────>                │                   │                   │
   │              │                │                   │                   │
   │              │ invoke decorated                   │                   │
   │              │───────────────>│                   │                   │
   │              │                │                   │                   │
   │              │                │ check(user_key)   │                   │
   │              │                │──────────────────>│                   │
   │              │                │                   │                   │
   │              │                │                   │ ┌─────────────────┐
   │              │                │                   │ │ count=6 >= 6    │
   │              │                │                   │ │ window elapsed: │
   │              │                │                   │ │ 15s of 60s      │
   │              │                │                   │ └─────────────────┘
   │              │                │                   │                   │
   │              │                │  retry_after=45   │                   │
   │              │                │<──────────────────│                   │
   │              │                │                   │                   │
   │              │                │ raise RateLimit   │                   │
   │              │                │ ExceededError     │                   │
   │              │<───────────────│                   │                   │
   │              │                │                   │                   │
   │              │ exception caught                   │                   │
   │              │────────────────────────────────────────────────────────>
   │              │                │                   │                   │
   │              │                │                   │    JSONResponse   │
   │              │                │                   │    status=429     │
   │              │<────────────────────────────────────────────────────────
   │              │                │                   │                   │
   │  429 Too Many Requests        │                   │                   │
   │  Retry-After: 45              │                   │                   │
   │  {                            │                   │                   │
   │    "success": false,          │                   │                   │
   │    "message": "Too many AI    │                   │                   │
   │     requests...",             │                   │                   │
   │    "meta": {                  │                   │                   │
   │      "retry_after": 45        │                   │                   │
   │    }                          │                   │                   │
   │  }                            │                   │                   │
   │<──────────────                │                   │                   │
```

### 2.5 Pattern Interaction Analysis

#### How Patterns Work Together

| Pattern | Component | Interaction |
|---------|-----------|-------------|
| **Strategy** | `DailyUpdateInterviewerStrategy` | Implements AI conversation logic, called by service layer |
| **Decorator** | `@ai_rate_limit` | Wraps chat endpoint, checks limits before invoking strategy |
| **Singleton** | `RateLimitManager` | Single instance manages all feature limiters |
| **Repository** | `DailyUpdateService` | Abstracts database operations for sessions and drafts |

#### Design Challenges Solved

| Challenge | Pattern | Solution |
|-----------|---------|----------|
| Capturing 4 types of data in one conversation | **Strategy** | AI strategy tracks categories, probes for missing ones |
| Adding rate limiting without modifying endpoints | **Decorator** | Wraps functions transparently |
| Per-user rate limiting | **Decorator + Key Extraction** | Extracts user ID from function parameters |
| Different limits per feature | **Parameterized Decorator** | Custom values per endpoint |
| Thread-safe request counting | **Limiter** | Uses threading locks |
| Draft review before commit | **Two-Phase Commit** | PendingUpdate → Accept → Actual Entity |

---

## 3. Implementation and Demonstration

### 3.1 File Structure

```
backend/
├── app/
│   ├── core/
│   │   └── config.py                    # Rate limit configuration
│   ├── models/
│   │   └── daily_update.py              # NEW: Session & PendingUpdate models
│   ├── schemas/
│   │   └── daily_update.py              # NEW: Request/Response schemas
│   ├── services/
│   │   ├── daily_update.py              # NEW: Business logic service
│   │   ├── ai_strategies/
│   │   │   └── daily_update.py          # NEW: AI interviewer strategy
│   │   ├── decorators/
│   │   │   ├── __init__.py
│   │   │   └── rate_limit.py            # NEW: Core decorator
│   │   └── ai_rate_limit.py             # NEW: AI-specific wrapper
│   ├── routers/
│   │   ├── daily_update.py              # NEW: API endpoints
│   │   ├── tasks.py                     # MODIFIED: Added rate limit
│   │   ├── expenses.py                  # MODIFIED: Added rate limit
│   │   └── events.py                    # MODIFIED: Added rate limit
│   └── main.py                          # MODIFIED: Exception handler
├── test_rate_limit.py                   # NEW: Unit tests
└── test_rate_limit_integration.py       # NEW: Integration tests
```

### 3.2 Core Implementation

#### 3.2.1 Daily Update AI Strategy

```python
DAILY_UPDATE_SYSTEM_INSTRUCTION = """
You are the Daily Update Assistant. Your goal is to extract data for 4 categories:
**Tasks, Expenses, Events, and Journal.**

Protocol:
1. Greet warmly and ask about their day
2. Track these 4 boxes as user speaks:
   - ☐ Tasks (work done, to-dos)
   - ☐ Expenses (money spent)
   - ☐ Events (meetings, appointments)
   - ☐ Journal (feelings, reflections)
3. Probe for missing categories
4. Call create_draft_entry() immediately when you have details
5. Summarize when all 4 categories covered
"""

class DailyUpdateInterviewerStrategy(AIStrategy):
    def execute(self, user_message, history, categories_covered):
        response = self.ai_service.generate(
            prompt=user_message,
            history=history,
            system_instruction=DAILY_UPDATE_SYSTEM_INSTRUCTION,
            tools=[CREATE_DRAFT_ENTRY_TOOL]
        )
        
        draft_entries = self._process_function_calls(response)
        return {
            "ai_response": response.text,
            "draft_entries": draft_entries,
            "categories_covered": self._extract_categories(draft_entries)
        }
```

#### 3.2.2 Rate Limit Decorator

```python
class RateLimitManager:
    def decorator(self, feature, *, key_param=None, requests=None, window_seconds=None):
        limiter = self._limiter(feature, requests, window_seconds)

        def _decorator(func):
            @wraps(func)
            async def _wrapper(*args, **kwargs):
                # Extract user key from parameters
                key = self._extract_key(args, kwargs, key_param)
                
                # Check rate limit
                retry_after = limiter.check(key)
                if retry_after is not None:
                    raise RateLimitExceededError(
                        feature, limiter.requests,
                        limiter.window_seconds, retry_after
                    )
                
                # Proceed with original function
                return await func(*args, **kwargs)
            return _wrapper
        return _decorator
```

#### 3.2.3 Decorated Daily Update Endpoint

```python
@router.post("/sessions/{session_id}/chat")
@ai_rate_limit(
    feature="daily_update:chat",
    key_param="current_user",
    requests=settings.daily_update_rate_limit_requests,  # 6
    window_seconds=settings.daily_update_rate_limit_window_seconds,  # 60
)
async def chat_with_ai(
    session_id: UUID,
    request: DailyUpdateConversationRequest,
    current_user: User = Depends(get_current_user())
):
    """Send a message to the AI daily update interviewer."""
    session = DailyUpdateService.get_session_by_id(db, current_user, session_id)
    
    # Process with AI strategy
    result = await daily_update_interviewer_strategy.execute(
        user_message=request.user_message,
        conversation_history=session.conversation_history,
        categories_covered=session.categories_covered
    )
    
    # Create draft entries from AI function calls
    for draft in result["draft_entries"]:
        DailyUpdateService.create_draft_entry(db, current_user, draft)
    
    return {"ai_response": result["ai_response"], "drafts_created": len(result["draft_entries"])}
```

#### 3.2.4 Rate Limited Existing Endpoints

```python
# tasks.py
@router.post("/ai/parse-text")
@ai_rate_limit(feature="tasks:parse_text", key_param="current_user")
async def parse_task_from_text(...):
    ...

# expenses.py  
@router.post("/ai/parse-receipt")
@ai_rate_limit(feature="expenses:parse_receipt", key_param="current_user")
async def parse_receipt(...):
    ...

# events.py
@router.post("/ai/parse-text")
@ai_rate_limit(feature="events:parse_text", key_param="current_user")
async def parse_event_from_text(...):
    ...
```

### 3.3 Configuration

```python
class Settings(BaseSettings):
    # AI Rate Limiting
    ai_rate_limit_enabled: bool = True
    ai_rate_limit_requests_per_window: int = 20    # Default for existing endpoints
    ai_rate_limit_window_seconds: int = 60
    
    # Daily Update specific (stricter due to conversation nature)
    daily_update_rate_limit_requests: int = 6
    daily_update_rate_limit_window_seconds: int = 60
```

### 3.4 All Rate Limited Endpoints

| Endpoint | Feature | Category | Limit |
|----------|---------|----------|-------|
| `POST /daily-updates/sessions/{id}/chat` | `daily_update:chat` | **NEW** | 6/60s |
| `POST /tasks/ai/parse-text` | `tasks:parse_text` | Existing | 20/60s |
| `POST /tasks/ai/parse-voice` | `tasks:parse_voice` | Existing | 20/60s |
| `GET /tasks/ai/insights` | `tasks:insights` | Existing | 20/60s |
| `POST /expenses/ai/parse-text` | `expenses:parse_text` | Existing | 20/60s |
| `POST /expenses/ai/parse-receipt` | `expenses:parse_receipt` | Existing | 20/60s |
| `POST /expenses/ai/parse-voice` | `expenses:parse_voice` | Existing | 20/60s |
| `GET /expenses/ai/insights` | `expenses:insights` | Existing | 20/60s |
| `POST /events/ai/parse-text` | `events:parse_text` | Existing | 20/60s |
| `POST /events/ai/parse-voice` | `events:parse_voice` | Existing | 20/60s |

### 3.5 Test Results

#### Unit Tests

```
============================================================
RATE LIMITING DECORATOR PATTERN - TEST SUITE
============================================================

TEST 1: InMemoryRateLimiter (3 requests per 5 seconds)
  Request 1: ✓ ALLOWED
  Request 2: ✓ ALLOWED
  Request 3: ✓ ALLOWED
  Request 4: ✗ BLOCKED (retry after 5.00s)

TEST 2: RateLimitManager with Sync Function
  Request 1: ✓ Processed for user test_user
  Request 2: ✓ Processed for user test_user
  Request 3: ✗ BLOCKED - sync_feature (retry after 3.00s)

TEST 3: RateLimitManager with Async Function
  Request 1: ✓ Async processed for user async_user
  Request 2: ✓ Async processed for user async_user
  Request 3: ✗ BLOCKED - async_feature (retry after 2.98s)

TEST 4: Per-User Rate Limit Isolation
  User A: 2 allowed, 1 blocked
  User B: 2 allowed, 1 blocked (separate limit)

ALL TESTS COMPLETED ✓
```

#### Integration Tests

```
============================================================
RATE LIMITING INTEGRATION TEST SUITE
============================================================

✓ Server is running at http://localhost:8000
✓ Login successful

============================================================
TEST: Tasks AI Parse Endpoint (limit: 2 requests/60s)
============================================================
  Request  1: ✓ ALLOWED (200)
  Request  2: ✓ ALLOWED (200)
  Request  3: ✗ RATE LIMITED (429) - Retry-After: 23s

  Summary: 2 allowed, 3 blocked ✓

============================================================
TEST: Daily Update Chat Endpoint (limit: 2 requests/60s)
============================================================
  ✓ Session ID: a7af2bbf-5578-49da-983a-0262455969c9

  Request  1: ✓ ALLOWED (200)
  Request  2: ✓ ALLOWED (200)
  Request  3: ✗ RATE LIMITED (429) - Retry-After: 51s

  Summary: 2 allowed, 3 blocked ✓

============================================================
TEST RESULTS
============================================================
  Tasks AI Parse Rate Limit: ✓ WORKING
  Daily Update Chat Rate Limit: ✓ WORKING

  ✓ All rate limits are working correctly!
============================================================
```

### 3.6 Pattern-Based Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Data Entry** | Manual form filling for each category | Single conversation captures all 4 |
| **AI Protection** | No rate limiting on AI endpoints | All AI endpoints protected |
| **Code Changes** | Would require modifying every endpoint | Zero changes to business logic |
| **Configuration** | Hard-coded values | Environment-configurable |
| **Testability** | Difficult to test limits | Decorator tested independently |
| **Extensibility** | Adding limits requires code changes | Just add decorator |

### 3.7 API Response Examples

#### Successful Chat Response

```json
{
  "success": true,
  "data": {
    "ai_response": "Got it! I've noted your lunch at Subway for $12. Any tasks you completed today?",
    "drafts_created": 1,
    "categories_covered": ["expense"]
  },
  "message": "Message processed"
}
```

#### Rate Limited Response (HTTP 429)

```json
{
  "success": false,
  "data": null,
  "message": "Too many AI requests. Please slow down and try again soon.",
  "meta": {
    "feature": "daily_update:chat",
    "limit": 6,
    "window_seconds": 60,
    "retry_after_seconds": 45.2
  }
}
```

**Headers:** `Retry-After: 46`

---

## 4. Conclusion

### 4.1 Summary

We successfully implemented two integrated features:

1. **Proactive Daily Update Agent** - A new AI-powered conversational chatbot that:
   - Conducts natural language interviews with users
   - Tracks 4 categories (Tasks, Expenses, Events, Journal)
   - Probes for missing information
   - Creates draft entries automatically
   - Supports voice input
   - Provides review-before-commit workflow

2. **Decorator-Based Rate Limiting** - A design pattern implementation that:
   - Protects all 11 AI endpoints from abuse
   - Provides per-user rate limiting
   - Uses configurable limits per feature
   - Returns standardized HTTP 429 responses
   - Is completely non-invasive to existing code

### 4.2 Design Patterns Used

| Pattern | Application |
|---------|-------------|
| **Decorator** | Rate limiting without modifying endpoints |
| **Strategy** | AI interviewer logic encapsulation |
| **Singleton** | Centralized rate limit management |
| **Repository** | Data access abstraction |

### 4.3 Benefits Achieved

- ✅ Single conversation replaces 4 separate form entries
- ✅ Natural language and voice input support
- ✅ Draft review prevents incorrect data entry
- ✅ All AI endpoints protected from abuse
- ✅ Per-user fair resource allocation
- ✅ Zero modification to existing business logic
- ✅ Fully configurable via environment variables
- ✅ Comprehensive test coverage

### 4.4 Future Improvements

- Redis backend for distributed rate limiting
- Scheduled daily update reminders
- Analytics dashboard for usage patterns
- Sliding window algorithm for smoother limiting

---

## Appendix A: Repository Information

```
GitHub: https://github.com/nuran-nahadi/SDP-3216-Project
Branch: decorator

Key Files:
- backend/app/services/daily_update.py (NEW)
- backend/app/services/ai_strategies/daily_update.py (NEW)
- backend/app/routers/daily_update.py (NEW)
- backend/app/services/decorators/rate_limit.py (NEW)
- backend/app/services/ai_rate_limit.py (NEW)
- backend/test_rate_limit.py (NEW)
- backend/test_rate_limit_integration.py (NEW)
```

## Appendix B: Running the Application

```bash
# Clone repository
git clone https://github.com/nuran-nahadi/SDP-3216-Project.git
cd SDP-3216-Project

# Start backend
cd backend
pip install -r requirements.txt
python3 run.py

# Run tests
python3 test_rate_limit.py
python3 test_rate_limit_integration.py
```

---

*End of Report*
