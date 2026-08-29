from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import hash_password
from database import get_db
from dependencies import get_current_user, require_owner
from models import Employee, Store, User, UserRole
from schemas import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeSelfResponse,
    EmployeeUpdate,
    ResetPasswordRequest,
)
from utils import generate_employee_code

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    store = db.query(Store).filter(Store.id == payload.store_id).first()
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    if db.query(Employee).filter(Employee.email == payload.email).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this email already exists",
        )

    employee_code = generate_employee_code(store, db)

    employee = Employee(
        store_id=store.id,
        name=payload.name,
        role_title=payload.role_title,
        phone=payload.phone,
        salary=payload.salary,
        hire_date=date.today(),
        email=payload.email,
        date_of_birth=payload.date_of_birth,
        employee_code=employee_code,
    )
    db.add(employee)
    db.flush()

    user = User(
        username=employee_code,
        email=employee.email,
        hashed_password=hash_password(payload.initial_password),
        role=UserRole.EMPLOYEE,
        store_id=store.id,
        employee_id=employee.id,
    )
    db.add(user)
    db.commit()
    db.refresh(employee)

    return employee


@router.get("", response_model=list[EmployeeResponse])
def list_employees(
    store_id: int | None = None,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    # Only currently-active employees show up here — deleted (deactivated)
    # employees are still viewable directly via GET /employees/{id}.
    query = db.query(Employee).filter(Employee.is_active.is_(True))

    if store_id is not None:
        query = query.filter(Employee.store_id == store_id)

    return query.all()


@router.get("/me", response_model=EmployeeSelfResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is for employee self-service. Use GET /employees instead.",
        )

    employee = db.query(Employee).filter(Employee.id == current_user.employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    return employee


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    updates = payload.model_dump(exclude_unset=True)

    if "store_id" in updates:
        store = db.query(Store).filter(Store.id == updates["store_id"]).first()
        if store is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    for field, value in updates.items():
        setattr(employee, field, value)

    # Keep the linked User's store_id in sync if the employee was reassigned.
    if "store_id" in updates and employee.user is not None:
        employee.user.store_id = updates["store_id"]

    db.commit()
    db.refresh(employee)
    return employee


@router.put("/{employee_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_employee_password(
    employee_id: int,
    payload: ResetPasswordRequest,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if employee.user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked user account not found")

    employee.user.hashed_password = hash_password(payload.new_password)
    db.commit()


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Soft delete: keep the row (future Sale records reference employee_id)
    # but deactivate both the Employee and their linked User's login.
    employee.is_active = False
    if employee.user is not None:
        employee.user.is_active = False

    db.commit()
