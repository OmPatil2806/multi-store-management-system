from pydantic import BaseModel

from models import UserRole


class LoginRequest(BaseModel):
    identifier: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    store_id: int | None = None


class CurrentUserResponse(BaseModel):
    id: int
    role: UserRole
    store_id: int | None = None
