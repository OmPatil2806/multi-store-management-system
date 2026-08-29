from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import PaymentMethod, Product, Sale, SaleItem, Store, User, UserRole
from schemas import (
    DashboardResponse,
    PaymentMethodBreakdown,
    RevenueByDay,
    StockByCategory,
    StoreMetrics,
    TopProduct,
)

router = APIRouter(prefix="/reports", tags=["reports"])

RANGE_DAYS = {"today": 0, "7d": 7, "30d": 30}


def _range_since(range_param: str) -> datetime:
    now = datetime.now()
    if range_param == "today":
        return datetime(now.year, now.month, now.day)
    return now - timedelta(days=RANGE_DAYS.get(range_param, 7))


def _compute_metrics(db: Session, store_ids: list[int], since: datetime) -> dict:
    """One efficient, aggregated snapshot for the given set of stores."""

    revenue_row = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0), func.count(Sale.id))
        .filter(Sale.store_id.in_(store_ids), Sale.date >= since)
        .one()
    )
    total_revenue, total_sales_count = revenue_row

    stock_value = (
        db.query(func.coalesce(func.sum(Product.quantity * Product.price), 0))
        .filter(Product.store_id.in_(store_ids))
        .scalar()
    )

    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.store_id.in_(store_ids), Product.quantity < Product.low_stock_threshold)
        .scalar()
    )

    revenue_by_day_rows = (
        db.query(func.date(Sale.date).label("day"), func.sum(Sale.total_amount))
        .filter(Sale.store_id.in_(store_ids), Sale.date >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    revenue_by_day = [RevenueByDay(date=day, revenue=revenue) for day, revenue in revenue_by_day_rows]

    top_product_rows = (
        db.query(
            Product.name,
            func.sum(SaleItem.quantity),
            func.sum(SaleItem.quantity * SaleItem.price_at_sale),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .join(Product, SaleItem.product_id == Product.id)
        .filter(Sale.store_id.in_(store_ids), Sale.date >= since)
        .group_by(Product.id)
        .order_by(func.sum(SaleItem.quantity * SaleItem.price_at_sale).desc())
        .limit(5)
        .all()
    )
    top_products = [
        TopProduct(product_name=name, quantity_sold=qty, revenue=revenue)
        for name, qty, revenue in top_product_rows
    ]

    payment_rows = (
        db.query(Sale.payment_method, func.sum(Sale.total_amount))
        .filter(Sale.store_id.in_(store_ids), Sale.date >= since)
        .group_by(Sale.payment_method)
        .all()
    )
    payment_totals = {method.value: 0 for method in PaymentMethod}
    for method, total in payment_rows:
        payment_totals[method.value] = total
    sales_by_payment_method = PaymentMethodBreakdown(**payment_totals)

    category_rows = (
        db.query(Product.category, func.sum(Product.quantity))
        .filter(Product.store_id.in_(store_ids))
        .group_by(Product.category)
        .all()
    )
    stock_by_category = [
        StockByCategory(category=category, total_quantity=total) for category, total in category_rows
    ]

    return {
        "total_revenue": total_revenue,
        "total_sales_count": total_sales_count,
        "stock_value": stock_value,
        "low_stock_count": low_stock_count,
        "revenue_by_day": revenue_by_day,
        "top_products": top_products,
        "sales_by_payment_method": sales_by_payment_method,
        "stock_by_category": stock_by_category,
    }


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    range: str = "7d",
    store_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = _range_since(range)

    if current_user.role == UserRole.OWNER:
        if store_id is not None:
            store = db.query(Store).filter(Store.id == store_id).first()
            if store is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
            metrics = _compute_metrics(db, [store_id], since)
            return DashboardResponse(**metrics)

        all_stores = db.query(Store).order_by(Store.id).all()
        combined = _compute_metrics(db, [s.id for s in all_stores], since)
        per_store = [
            StoreMetrics(store_id=s.id, store_name=s.name, **_compute_metrics(db, [s.id], since))
            for s in all_stores
        ]
        return DashboardResponse(**combined, per_store=per_store)

    # Employees are always scoped to their own store — any store_id they
    # pass is ignored, same pattern as products/sales.
    metrics = _compute_metrics(db, [current_user.store_id], since)
    return DashboardResponse(**metrics)
