from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from models import PaymentMethod, UserRole


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


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------


class ProductCreate(BaseModel):
    name: str
    category: str | None = None
    sku: str | None = None
    price: Decimal
    cost_price: Decimal | None = None
    quantity: int = 0
    low_stock_threshold: int = 5
    # Only used when the requester is the owner — an employee's store_id is
    # always taken from their token, never from this field.
    store_id: int | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    sku: str | None = None
    price: Decimal | None = None
    cost_price: Decimal | None = None
    quantity: int | None = None
    low_stock_threshold: int | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    name: str
    category: str | None
    sku: str | None
    price: Decimal
    cost_price: Decimal | None
    quantity: int
    low_stock_threshold: int
    created_by: int | None
    updated_at: datetime | None


class LowStockGroup(BaseModel):
    store_id: int
    store_name: str
    products: list[ProductResponse]


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------


class EmployeeCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str
    date_of_birth: date
    role_title: str | None = None
    salary: Decimal | None = None
    store_id: int
    initial_password: str


class ResetPasswordRequest(BaseModel):
    new_password: str


class EmployeeUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    date_of_birth: date | None = None
    role_title: str | None = None
    salary: Decimal | None = None
    store_id: int | None = None


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    name: str
    role_title: str | None
    phone: str | None
    email: str
    date_of_birth: date
    employee_code: str
    salary: Decimal | None
    hire_date: date | None
    is_active: bool


class EmployeeSelfResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    name: str
    role_title: str | None
    phone: str | None
    email: str
    date_of_birth: date
    employee_code: str
    hire_date: date | None
    is_active: bool


# ---------------------------------------------------------------------------
# Sales
# ---------------------------------------------------------------------------


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int


class SaleCreate(BaseModel):
    items: list[SaleItemCreate]
    payment_method: PaymentMethod
    # Only used when the requester is the owner — an employee's store_id is
    # always taken from their token, never from this field (same pattern as
    # ProductCreate.store_id).
    store_id: int | None = None


class SaleItemResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    price_at_sale: Decimal
    line_total: Decimal


class SaleResponse(BaseModel):
    id: int
    store_id: int
    employee_id: int | None
    employee_name: str | None
    date: datetime
    total_amount: Decimal
    payment_method: PaymentMethod
    items: list[SaleItemResponse]
