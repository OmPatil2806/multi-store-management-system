from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Product, Sale, SaleItem, Store, User, UserRole
from schemas import SaleCreate, SaleItemResponse, SaleResponse

router = APIRouter(prefix="/sales", tags=["sales"])


def _build_sale_response(sale: Sale) -> SaleResponse:
    return SaleResponse(
        id=sale.id,
        store_id=sale.store_id,
        employee_id=sale.employee_id,
        employee_name=sale.employee.name if sale.employee else None,
        date=sale.date,
        total_amount=sale.total_amount,
        payment_method=sale.payment_method,
        items=[
            SaleItemResponse(
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                price_at_sale=item.price_at_sale,
                line_total=item.price_at_sale * item.quantity,
            )
            for item in sale.items
        ],
    )


def _resolve_store_id(current_user: User, requested_store_id: int | None, db: Session) -> int:
    if current_user.role == UserRole.OWNER:
        if requested_store_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Select a store before checking out",
            )
        store = db.query(Store).filter(Store.id == requested_store_id).first()
        if store is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
        return requested_store_id

    # Employees can never choose a store — always their own, from the token.
    return current_user.store_id


@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    store_id = _resolve_store_id(current_user, payload.store_id, db)

    # Validate every line BEFORE mutating anything — if any line fails, we
    # haven't touched the database yet, so there's nothing to roll back.
    products_by_id = {}
    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")

        product = (
            db.query(Product)
            .filter(Product.id == item.product_id, Product.store_id == store_id)
            .first()
        )
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        if item.quantity > product.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}",
            )

        products_by_id[item.product_id] = product

    total_amount = sum(
        products_by_id[item.product_id].price * item.quantity for item in payload.items
    )

    try:
        sale = Sale(
            store_id=store_id,
            employee_id=current_user.employee_id,
            payment_method=payload.payment_method,
            total_amount=total_amount,
        )
        db.add(sale)
        db.flush()

        for item in payload.items:
            product = products_by_id[item.product_id]
            db.add(
                SaleItem(
                    sale_id=sale.id,
                    product_id=product.id,
                    quantity=item.quantity,
                    price_at_sale=product.price,
                )
            )
            product.quantity -= item.quantity

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(sale)
    return _build_sale_response(sale)


@router.get("", response_model=list[SaleResponse])
def list_sales(
    store_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Sale)

    if current_user.role == UserRole.OWNER:
        if store_id is not None:
            query = query.filter(Sale.store_id == store_id)
    else:
        query = query.filter(Sale.store_id == current_user.store_id)

    sales = query.order_by(Sale.date.desc()).all()
    return [_build_sale_response(sale) for sale in sales]


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if sale is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    if current_user.role != UserRole.OWNER and sale.store_id != current_user.store_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    return _build_sale_response(sale)
