# Daily Update API Documentation

## Overview

The **Proactive Daily Update Agent** is an AI-powered conversational feature that helps users capture their daily activities through natural conversation. The AI acts as an "interviewer" that systematically gathers information about:

- **Tasks** - Work completed, to-dos, projects
- **Expenses** - Money spent during the day
- **Events** - Meetings, appointments, social activities  
- **Journal** - Feelings, mood, reflections

All captured data goes to a **"pending updates"** staging area where users can review, edit, and confirm before the data moves to the actual tables.

---

## Base URL

```
/api/daily-updates
```

---

## Endpoints

### Session Management

#### Start a New Session

```http
POST /daily-updates/sessions/start
```

Starts a new AI-assisted daily update conversation. Automatically ends any previous active sessions.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "started_at": "2024-01-15T18:00:00Z",
    "ended_at": null,
    "is_active": true,
    "categories_covered": [],
    "total_items_captured": 0
  },
  "message": "Daily update session started",
  "meta": {
    "greeting": "Hi! Ready for your daily update. How did your day go?"
  }
}
```

---

#### Get Active Session

```http
GET /daily-updates/sessions/active
```

Retrieves the user's current active session.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "started_at": "2024-01-15T18:00:00Z",
    "ended_at": null,
    "is_active": true,
    "categories_covered": ["task", "expense"],
    "total_items_captured": 3
  },
  "message": "Active session retrieved",
  "meta": {
    "pending_items_count": 3,
    "items_by_category": {
      "task": 1,
      "expense": 2,
      "event": 0,
      "journal": 0
    }
  }
}
```

---

#### End a Session

```http
POST /daily-updates/sessions/{session_id}/end
```

Ends a daily update session.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | UUID | The session ID |

---

#### Get Conversation State

```http
GET /daily-updates/sessions/{session_id}/state
```

Get detailed state of the conversation including category coverage.

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "categories_status": [
      { "category": "task", "is_covered": true, "items_count": 1 },
      { "category": "expense", "is_covered": true, "items_count": 2 },
      { "category": "event", "is_covered": false, "items_count": 0 },
      { "category": "journal", "is_covered": false, "items_count": 0 }
    ],
    "is_complete": false,
    "pending_items_count": 3,
    "last_ai_response": "Got it! Any expenses today?"
  },
  "message": "Conversation state retrieved"
}
```

---

### AI Conversation

#### Chat with AI

```http
POST /daily-updates/sessions/{session_id}/chat
```

Send a message to the AI interviewer and receive a response. The AI may automatically create draft entries.

**Request Body:**
```json
{
  "session_id": "uuid",
  "user_message": "I finished the quarterly report today. Also grabbed coffee with Mike for $5."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ai_response": "Nice work on the quarterly report! I've logged that as completed. For the coffee with Mike - was that a work meeting or social catch-up? And any other expenses today?",
    "created_entries": [
      {
        "id": "uuid",
        "category": "task",
        "summary": "Finished quarterly report"
      },
      {
        "id": "uuid",
        "category": "expense",
        "summary": "Coffee with Mike"
      }
    ],
    "categories_covered": ["task", "expense"],
    "is_complete": false
  },
  "message": "Message processed",
  "meta": {
    "categories_mentioned": ["task", "expense"]
  }
}
```

---

### Pending Updates Management

#### List Pending Updates

```http
GET /daily-updates/pending
```

Get all pending updates awaiting review.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (`task`, `expense`, `event`, `journal`) |
| `status` | string | Filter by status (`pending`, `accepted`, `rejected`) |
| `session_id` | UUID | Filter by session |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 50, max: 100) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "category": "expense",
      "summary": "Coffee with Mike",
      "raw_text": "grabbed coffee with Mike for $5",
      "structured_data": {
        "amount": 5,
        "currency": "USD",
        "merchant": "Coffee shop",
        "expense_category": "food"
      },
      "status": "pending",
      "session_id": "uuid",
      "created_at": "2024-01-15T18:30:00Z",
      "updated_at": "2024-01-15T18:30:00Z"
    }
  ],
  "message": "Pending updates retrieved",
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 50,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

#### Get Pending Summary

```http
GET /daily-updates/pending/summary
```

Get a summary count of pending updates.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_pending": 3,
    "by_category": {
      "task": 1,
      "expense": 2,
      "event": 0,
      "journal": 0
    },
    "has_pending": true
  },
  "message": "3 pending items from your Daily Update"
}
```

---

#### Get Single Pending Update

```http
GET /daily-updates/pending/{update_id}
```

---

#### Edit Pending Update

```http
PATCH /daily-updates/pending/{update_id}
```

Edit a pending update before accepting it.

**Request Body:**
```json
{
  "summary": "Coffee at Starbucks with Mike",
  "structured_data": {
    "amount": 5.50,
    "currency": "USD",
    "merchant": "Starbucks"
  }
}
```

---

#### Delete Pending Update

```http
DELETE /daily-updates/pending/{update_id}
```

---

### Accept/Reject Actions

#### Accept Pending Update

```http
POST /daily-updates/pending/{update_id}/accept
```

Accept a pending update and transfer it to the real table (tasks, expenses, events, or journal).

**Response:**
```json
{
  "success": true,
  "data": {
    "pending_update_id": "uuid",
    "category": "expense",
    "created_item_id": "uuid",
    "success": true
  },
  "message": "Expense created successfully"
}
```

---

#### Reject Pending Update

```http
POST /daily-updates/pending/{update_id}/reject
```

Mark a pending update as rejected (soft delete).

---

#### Accept All Pending Updates

```http
POST /daily-updates/pending/accept-all
```

Accept all pending updates at once.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | UUID | Only accept from this session (optional) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "pending_update_id": "uuid",
      "category": "task",
      "created_item_id": "uuid",
      "success": true
    },
    {
      "pending_update_id": "uuid",
      "category": "expense",
      "created_item_id": "uuid",
      "success": true
    }
  ],
  "message": "Accepted 2 items",
  "meta": {
    "successful": 2,
    "failed": 0,
    "total": 2
  }
}
```

---

#### Create Pending Update Manually

```http
POST /daily-updates/pending
```

Create a pending update without AI (for manual entry).

**Request Body:**
```json
{
  "category": "expense",
  "summary": "Lunch at Subway",
  "raw_text": null,
  "structured_data": {
    "amount": 12.50,
    "currency": "USD",
    "merchant": "Subway",
    "expense_category": "food"
  }
}
```

---

## Data Models

### PendingUpdate

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `user_id` | UUID | Owner user |
| `category` | enum | `task`, `expense`, `event`, `journal` |
| `summary` | string | Short title/description |
| `raw_text` | string | Original user statement |
| `structured_data` | JSON | Extracted category-specific data |
| `status` | enum | `pending`, `accepted`, `rejected` |
| `session_id` | UUID | Link to daily update session |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

### DailyUpdateSession

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `user_id` | UUID | Owner user |
| `started_at` | timestamp | Session start time |
| `ended_at` | timestamp | Session end time (null if active) |
| `is_active` | boolean | Whether session is ongoing |
| `categories_covered` | JSON array | Categories discussed |
| `conversation_history` | JSON array | Full conversation transcript |

---

## Structured Data Formats

### For Expenses

```json
{
  "amount": 15.00,
  "currency": "USD",
  "merchant": "Subway",
  "expense_category": "food",
  "description": "Lunch sandwich"
}
```

### For Tasks

```json
{
  "status": "completed",
  "priority": "high",
  "due_date": "2024-01-15T17:00:00Z",
  "description": "Quarterly financial report"
}
```

### For Events

```json
{
  "event_type": "social",
  "start_time": "2024-01-15T14:00:00Z",
  "end_time": "2024-01-15T15:00:00Z",
  "location": "Starbucks on Main St"
}
```

### For Journal

```json
{
  "mood": "happy",
  "content": "Had a productive day. Feeling accomplished after finishing the big report."
}
```

---

## Usage Flow

### Typical Conversation Flow

1. **Start Session** → `POST /sessions/start`
2. **Get Greeting** → Response includes AI greeting
3. **User Speaks** → `POST /sessions/{id}/chat` with user message
4. **AI Responds** → Get AI response + any auto-created drafts
5. **Repeat** steps 3-4 until conversation complete
6. **End Session** → `POST /sessions/{id}/end`
7. **Review Pending** → `GET /pending` to see all captured items
8. **Edit if Needed** → `PATCH /pending/{id}` to fix any errors
9. **Accept All** → `POST /pending/accept-all` to confirm

### Frontend Implementation Tips

1. **Pending Card**: Show a notification card on the home screen when there are pending items
2. **Review Modal**: Display pending items in a list with Accept/Edit/Reject buttons
3. **Category Icons**: Use icons to show which categories have been covered
4. **Progress Indicator**: Show 4 checkboxes for categories covered during conversation
