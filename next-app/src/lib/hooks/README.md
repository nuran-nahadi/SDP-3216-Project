# Custom Hooks

This directory contains custom React hooks for data fetching, state management, and side effects.

## Structure

- `use-auth.ts` - Authentication hook
- `use-event-bus.ts` - Observer pattern event bus hook
- `use-tasks.ts` - Task data fetching hook
- `use-expenses.ts` - Expense data fetching hook
- `use-events.ts` - Calendar events data fetching hook

## Usage

```typescript
import { useAuth } from '@/lib/hooks/use-auth';
import { useTasks } from '@/lib/hooks/use-tasks';

const { user, login, logout } = useAuth();
const { tasks, loading, error } = useTasks({ status: 'pending' });
```
