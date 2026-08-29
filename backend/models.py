import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import relationship

from database import Base


class UserRole(str, enum.Enum):
    OWNER = "owner"
    EMPLOYEE = "employee"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    UPI = "upi"
    OTHER = "other"


# ---------------------------------------------------------------------------
# Store & User
# ---------------------------------------------------------------------------


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="store")
    employees = relationship("Employee", back_populates="store")
    products = relationship("Product", back_populates="store")
    sales = relationship("Sale", back_populates="store")


class User(Base):
    __tablename__ = "users"

    # Login identity differs by role (enforced in Phase 2, not here):
    # owner logs in with `email`; employee logs in with their `employee_code`,
    # which is looked up through the linked Employee record via employee_id.
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SqlEnum(UserRole), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    store = relationship("Store", back_populates="users")
    employee = relationship("Employee", back_populates="user")


# ---------------------------------------------------------------------------
# Employee & Product
# ---------------------------------------------------------------------------


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String, nullable=False)
    role_title = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    salary = Column(Numeric(10, 2), nullable=True)
    hire_date = Column(Date, nullable=True)
    email = Column(String, unique=True, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    # Business-facing ID, e.g. "GRO-0001" — auto-generated via
    # generate_employee_code() in utils.py, never typed by hand.
    employee_code = Column(String, unique=True, nullable=False)
    # Soft-delete flag: False means "removed" by the owner. Kept as a row
    # (not hard-deleted) so historical Sale records tied to employee_id
    # stay intact once Phase 7 adds sales.
    is_active = Column(Boolean, nullable=False, default=True)

    store = relationship("Store", back_populates="employees")
    user = relationship("User", back_populates="employee", uselist=False)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    sku = Column(String, nullable=True, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    low_stock_threshold = Column(Integer, nullable=False, default=5)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    store = relationship("Store", back_populates="products")
    sale_items = relationship("SaleItem", back_populates="product")


# ---------------------------------------------------------------------------
# Sale & SaleItem
# ---------------------------------------------------------------------------


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    # Nullable: the owner can also process a checkout, and the owner has no
    # Employee record — NULL here means "the owner processed this sale".
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    total_amount = Column(Numeric(10, 2), nullable=False, default=0)
    payment_method = Column(SqlEnum(PaymentMethod), nullable=False)

    store = relationship("Store", back_populates="sales")
    employee = relationship("Employee")
    items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_sale = Column(Numeric(10, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")
