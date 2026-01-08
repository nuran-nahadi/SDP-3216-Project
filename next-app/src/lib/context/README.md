# Context Providers

This directory contains React Context providers for global state management.

## AuthContext

The `AuthContext` provides authentication state and methods throughout the application.

### Usage

```tsx
import { useAuth } from '@/lib/context/auth-context';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {user ? (
        <p>Welcome, {user.first_name}!</p>
      ) : (
        <button onClick={() => login(email, password)}>Login</button>
      )}
    </div>
  );
}
```

### API

- `user: User | null` - Current authenticated user or null
- `loading: boolean` - Whether authentication state is being loaded
- `login(email: string, password: string): Promise<void>` - Login with credentials
- `signup(data: SignupData): Promise<void>` - Create new account and auto-login
- `logout(): void` - Clear tokens and logout user
- `refreshUser(): Promise<void>` - Refresh current user data

### Features

- Automatic token storage in localStorage
- Automatic user fetching on mount
- Token refresh on 401 errors (handled in API client)
- Observer pattern integration (publishes AUTH_STATE_CHANGED events)
- Protected route support

### Protected Routes

Wrap routes in the `(app)` route group to make them protected. The layout will automatically redirect unauthenticated users to `/login`.

```tsx
// app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  // This page is automatically protected
  const { user } = useAuth();
  return <div>Welcome {user?.first_name}</div>;
}
```
