# Authentication & Account API

## Authentication

### Signup
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
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

**Error Responses:**
- `400 Bad Request`: User with email/username already exists
- `500 Internal Server Error`: Database error

### Login
**POST** `/auth/login`

Authenticate user and receive JWT tokens.

**Request (Form Data):**
- `username`: string (required)
- `password`: string (required)

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 1800,
  "refresh_token_expires_in": 604800
}
```

**Notes:**
- `expires_in`: Access token expiration in seconds (1800 = 30 minutes)
- `refresh_token_expires_in`: Refresh token expiration in seconds (604800 = 7 days)

**Error Responses:**
- `403 Forbidden`: Invalid credentials

### Refresh Token
**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Header:**
```
refresh_token: <your_refresh_token>
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 1800,
  "refresh_token_expires_in": 604800
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token

---

## Account Management
All endpoints require: `Authorization: Bearer <access_token>`

### Get Current User
**GET** `/me/`

Get current authenticated user's information.

**Response (200 OK):**
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

### Update Current User
**PUT** `/me/`

Update current user's information. All fields are optional.

**Request Body:**
```json
{
  "username": "newusername",
  "email": "new@example.com",
  "first_name": "Updated",
  "last_name": "Name",
  "timezone": "America/New_York"
}
```

**Response (200 OK):**
```json
{
  "message": "newusername with id <uuid> updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "newusername",
    "email": "new@example.com",
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

### Delete Account
**DELETE** `/me/`

Permanently delete the current user account and all associated data.

**Response (200 OK):**
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

**⚠️ Warning:** This action is irreversible.

---

## Admin Endpoints
Require admin role

### List Users
**GET** `/users/?page=1&limit=10&search=john&role=user`

### Get User
**GET** `/users/{user_id}`

### Create User
**POST** `/users/`

**Request Body:**
```json
{
  "first_name": "First",
  "last_name": "Last",
  "username": "newuser",
  "email": "user@example.com",
  "password": "password"
}
```

**Note:** Role is automatically set to "user". Only admins can create users via this endpoint.

### Update User
**PUT** `/users/{user_id}`
```json
{
  "is_active": false,
  "role": "admin"
}
```

### Delete User
**DELETE** `/users/{user_id}`

---

## Health Check
**GET** `/health`
```json
{
  "success": true,
  "message": "LIN API is running successfully",
  "version": "1.0.0",
  "auth_status": "ENABLED"
}
```
