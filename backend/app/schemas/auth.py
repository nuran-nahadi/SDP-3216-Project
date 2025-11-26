from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional
from uuid import UUID



# Base
class BaseConfig:
    from_attributes = True


class UserBase(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    timezone: str
    profile_picture_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config(BaseConfig):
        pass


class Signup(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: str
    password: str

    class Config(BaseConfig):
        pass


class UserOut(BaseModel):
    message: str
    data: UserBase

    class Config(BaseConfig):
        pass


# Token
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'Bearer'
    expires_in: int
    refresh_token_expires_in: int
