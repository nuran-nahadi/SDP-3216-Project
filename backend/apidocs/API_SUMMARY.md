# LIN API Endpoints Summary

**Base URL:** `http://localhost:8000`  
**Version:** 1.0.0

---

## 📋 Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
- [Account Management Endpoints](#account-management-endpoints)
- [User Profile Endpoints](#user-profile-endpoints)
- [Common Response Formats](#common-response-formats)
- [Error Codes](#error-codes)

---

## 🔐 Authentication Endpoints

### 1. Signup
**POST** `/auth/signup`

Create a new user account.

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "message": "johndoe with id <uuid> created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true,
    "is_verified": false,
    "timezone": "UTC",
    "profile_picture_url": null,
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T10:00:00Z"
  }
}
```

**Errors:**
- `400`: Email or username already exists
- `500`: Database error

---

### 2. Login
**POST** `/auth/login`

Authenticate and receive JWT tokens.

**Request (Form Data):**
```
username: johndoe
password: SecurePass123
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 1800,
  "refresh_token_expires_in": 604800
}
```

**Token Details:**
- `access_token`: Valid for 30 minutes (1800 seconds)
- `refresh_token`: Valid for 7 days (604800 seconds)

**Errors:**
- `403`: Invalid credentials

---

### 3. Refresh Token
**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Header:**
```
refresh_token: <your_refresh_token>
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 1800,
  "refresh_token_expires_in": 604800
}
```

**Errors:**
- `401`: Invalid or expired refresh token

---

## 👤 Account Management Endpoints

**All endpoints require:** `Authorization: Bearer <access_token>`

### 4. Get Current User
**GET** `/me/`

Retrieve current user's account information.

**Response (200):**
```json
{
  "message": "Details for johndoe with id <uuid>",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true,
    "is_verified": false,
    "timezone": "UTC",
    "profile_picture_url": null,
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T10:00:00Z"
  }
}
```

**Errors:**
- `401`: Unauthorized (invalid/missing token)
- `404`: User not found

---

### 5. Update Current User
**PUT** `/me/`

Update current user's information.

**Request (all fields optional):**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "first_name": "Updated",
  "last_name": "Name",
  "timezone": "America/New_York"
}
```

**Response (200):**
```json
{
  "message": "newusername with id <uuid> updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "newusername",
    "email": "newemail@example.com",
    "first_name": "Updated",
    "last_name": "Name",
    "role": "user",
    "is_active": true,
    "is_verified": false,
    "timezone": "America/New_York",
    "profile_picture_url": null,
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T12:00:00Z"
  }
}
```

**Errors:**
- `400`: Validation error (invalid email, username taken, etc.)
- `401`: Unauthorized
- `404`: User not found

---

### 6. Delete Account
**DELETE** `/me/`

Permanently delete the current user account and all data.

**Response (200):**
```json
{
  "message": "johndoe with id <uuid> deleted successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true,
    "is_verified": false,
    "timezone": "UTC",
    "profile_picture_url": null,
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T15:00:00Z"
  }
}
```

**⚠️ Warning:** This action is irreversible and deletes:
- User profile
- User preferences
- All tasks
- All events
- All expenses
- All journal entries

**Errors:**
- `401`: Unauthorized
- `404`: User not found

---

## 🔧 User Profile Endpoints

**All endpoints require:** `Authorization: Bearer <access_token>`

### 7. Get User Profile
**GET** `/users/me`

Get detailed user profile (alternative to `/me/`).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": false,
    "profile_picture_url": null,
    "timezone": "UTC",
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T10:00:00Z"
  },
  "message": "User profile retrieved successfully"
}
```

---

### 8. Update User Profile
**PUT** `/users/me`

Update user profile information.

**Request (all fields optional):**
```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "username": "newusername",
  "timezone": "America/New_York"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "newusername",
    "email": "john@example.com",
    "first_name": "Updated",
    "last_name": "Name",
    "is_verified": false,
    "profile_picture_url": null,
    "timezone": "America/New_York",
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T12:00:00Z"
  },
  "message": "User profile updated successfully"
}
```

---

### 9. Upload Profile Picture
**POST** `/users/me/avatar`

Upload profile picture.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Supported formats: JPG, JPEG, PNG, GIF, WebP
- Max size: 5MB

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": false,
    "profile_picture_url": "/uploads/profiles/uuid.jpg",
    "timezone": "UTC",
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T12:30:00Z"
  },
  "message": "Profile picture uploaded successfully"
}
```

**Errors:**
- `400`: Invalid file format or size exceeded

---

### 10. Remove Profile Picture
**DELETE** `/users/me/avatar`

Remove current profile picture.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile picture removed successfully"
}
```

---

### 11. Get User Preferences
**GET** `/users/me/preferences`

Get user preferences settings.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pref-uuid",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "default_task_priority": "medium",
    "default_expense_currency": "USD",
    "notification_settings": {
      "email": true,
      "push": false,
      "in_app": true
    },
    "theme": "auto",
    "language": "en",
    "date_format": "YYYY-MM-DD",
    "time_format": "12h",
    "week_start_day": "monday",
    "ai_insights_enabled": true,
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T10:00:00Z"
  },
  "message": "User preferences retrieved successfully"
}
```

---

### 12. Update User Preferences
**PUT** `/users/me/preferences`

Update user preferences.

**Request (all fields optional):**
```json
{
  "default_task_priority": "high",
  "default_expense_currency": "EUR",
  "notification_settings": {
    "email": true,
    "push": true,
    "in_app": true
  },
  "theme": "dark",
  "language": "en",
  "date_format": "DD/MM/YYYY",
  "time_format": "24h",
  "week_start_day": "sunday",
  "ai_insights_enabled": false
}
```

**Valid Enum Values:**
- `default_task_priority`: "low", "medium", "high"
- `theme`: "light", "dark", "auto"
- `time_format`: "12h", "24h"
- `week_start_day`: "monday", "sunday"

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pref-uuid",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "default_task_priority": "high",
    "default_expense_currency": "EUR",
    "notification_settings": {
      "email": true,
      "push": true,
      "in_app": true
    },
    "theme": "dark",
    "language": "en",
    "date_format": "DD/MM/YYYY",
    "time_format": "24h",
    "week_start_day": "sunday",
    "ai_insights_enabled": false,
    "created_at": "2025-06-23T10:00:00Z",
    "updated_at": "2025-06-23T14:00:00Z"
  },
  "message": "User preferences updated successfully"
}
```

---

### 13. Delete User Account (Profile Endpoint)
**DELETE** `/users/me`

Alternative endpoint to delete user account (same as `/me/`).

**Response:** Same as endpoint #6

---

## 📋 Common Response Formats

### Success Response Pattern 1 (Legacy)
```json
{
  "message": "Operation description",
  "data": { /* entity data */ }
}
```

### Success Response Pattern 2 (Modern)
```json
{
  "success": true,
  "data": { /* entity data */ },
  "message": "Operation description"
}
```

### Error Response
```json
{
  "detail": "Error message description"
}
```

---

## ⚠️ Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `400` | Bad Request | Invalid input, validation errors, duplicate username/email |
| `401` | Unauthorized | Missing/invalid/expired token |
| `403` | Forbidden | Invalid credentials, account deactivated |
| `404` | Not Found | User/resource not found |
| `500` | Internal Server Error | Database error, server error |

---

## 🔑 Authentication Flow

1. **Register**: `POST /auth/signup` → Get user data
2. **Login**: `POST /auth/login` → Get access_token + refresh_token
3. **Use APIs**: Include `Authorization: Bearer <access_token>` header
4. **Token Expires**: After 30 minutes
5. **Refresh**: `POST /auth/refresh` with refresh_token header → Get new tokens
6. **Refresh Token Expires**: After 7 days → Login again

---

## 📊 User Data Model

```typescript
{
  id: UUID (string)                  // Unique identifier
  username: string                   // Unique username
  email: string                      // Unique email
  first_name: string                 // First name
  last_name: string                  // Last name
  role: "user" | "admin"            // User role
  is_active: boolean                 // Account active status
  is_verified: boolean               // Email verification status
  timezone: string                   // IANA timezone (e.g., "UTC", "America/New_York")
  profile_picture_url: string | null // Profile picture path
  created_at: datetime               // Account creation timestamp
  updated_at: datetime               // Last update timestamp
}
```

---

## 🎯 Key Changes from Previous Documentation

### ✅ Fixed
1. **`full_name` removed** - Now uses `first_name` and `last_name` separately
2. **`id` type corrected** - Changed from `int` to UUID string
3. **Password field removed** - No longer returned in responses
4. **Token expiration documented** - 30 minutes for access, 7 days for refresh
5. **`refresh_token_expires_in` added** - Now documented in login/refresh responses
6. **Missing fields added** - `is_verified`, `timezone`, `profile_picture_url`, `updated_at`
7. **Response formats standardized** - Documented both legacy and modern patterns

### 📝 Endpoint Clarifications
- `/me/` endpoints (Account Management) - Legacy style responses
- `/users/me` endpoints (User Profile) - Modern style responses with `success` flag
- Both work but return slightly different response structures

---

## 🧪 Testing

### Using Swagger UI
Visit: `http://localhost:8000/docs`

### Using curl

**1. Signup:**
```bash
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**2. Login:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=johndoe&password=SecurePass123"
```

**3. Get Profile:**
```bash
curl -X GET "http://localhost:8000/me/" \
  -H "Authorization: Bearer <your_access_token>"
```

**4. Update Profile:**
```bash
curl -X PUT "http://localhost:8000/me/" \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "timezone": "America/New_York"
  }'
```

---

## 📞 Support

For issues or questions:
- Check the full API documentation in `/apidocs/` folder
- Run the development server: `uvicorn app.main:app --reload`
- View interactive docs: `http://localhost:8000/docs`
