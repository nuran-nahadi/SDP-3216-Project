from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List



class AccountBase(BaseModel):
    id: str
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    timezone: str
    profile_picture_url: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    timezone: str | None = None


class AccountOut(BaseModel):
    message: str
    data: AccountBase

    class Config:
        from_attributes = True
