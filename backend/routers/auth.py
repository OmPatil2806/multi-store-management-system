from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import create_access_token, verify_password
from database import get_db
from dependencies import get_current_user
from models import Employee, User, UserRole
from schemas import CurrentUserResponse, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials",
)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.role == UserRole.OWNER, User.email == payload.identifier)
        .first()
    )

    if user is None:
        employee = (
            db.query(Employee)
            .filter(Employee.employee_code == payload.identifier)
            .first()
        )
        if employee is not None:
            user = (
                db.query(User)
                .filter(User.employee_id == employee.id)
                .first()
            )

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise INVALID_CREDENTIALS

    token = create_access_token(
        data={
            "user_id": user.id,
            "role": user.role.value,
            "store_id": user.store_id,
            "employee_id": user.employee_id,
        }
    )

    return TokenResponse(access_token=token, role=user.role, store_id=user.store_id)


@router.get("/me", response_model=CurrentUserResponse)
def me(current_user: User = Depends(get_current_user)):
    return CurrentUserResponse(
        id=current_user.id,
        role=current_user.role,
        store_id=current_user.store_id,
    )
