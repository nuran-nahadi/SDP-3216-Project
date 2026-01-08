# Type Definitions

This directory contains TypeScript type definitions and interfaces for the application.

## Structure

- `api.ts` - API response types
- `task.ts` - Task-related types
- `expense.ts` - Expense-related types
- `event.ts` - Event-related types
- `user.ts` - User-related types

## Usage

```typescript
import type { Task, TaskStatus, TaskPriority } from '@/lib/types/task';
import type { ApiResponse } from '@/lib/types/api';

const task: Task = {
  id: '1',
  title: 'Example task',
  status: 'pending',
  priority: 'high',
  // ...
};
```
