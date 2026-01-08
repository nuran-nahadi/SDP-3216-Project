# API Layer

This directory contains API client configuration and service functions for communicating with the backend.

## Structure

- `client.ts` - Axios instance with interceptors for authentication
- `auth.ts` - Authentication API calls (login, signup, refresh)
- `tasks.ts` - Task management API calls
- `expenses.ts` - Expense tracking API calls
- `events.ts` - Calendar events API calls
- `profile.ts` - User profile API calls

## Usage

```typescript
import { getTasks, createTask } from '@/lib/api/tasks';

const tasks = await getTasks({ status: 'pending' });
const newTask = await createTask({ title: 'New task' });
```
