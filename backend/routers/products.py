from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_owner
from models import Product, Store, User, UserRole
from schemas import LowStockGroup, ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _get_scoped_product_or_404(product_id: int, current_user: User, db: Session) -> Product:
    """Fetch a product, 404ing if it doesn't exist OR belongs to a store the
    requester (an employee) can't access — same response either way, so an
    employee can't tell the difference between "doesn't exist" and
    "exists in another store"."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if current_user.role != UserRole.OWNER and product.store_id != current_user.store_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.OWNER:
        if payload.store_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="store_id is required when the owner creates a product",
            )
        store = db.query(Store).filter(Store.id == payload.store_id).first()
        if store is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
        store_id = payload.store_id
    else:
        # Employees can never choose a store — silently override any store_id
        # they sent with the one from their own verified token.
        store_id = current_user.store_id

    product = Product(
        store_id=store_id,
        name=payload.name,
        category=payload.category,
        sku=payload.sku,
        price=payload.price,
        cost_price=payload.cost_price,
        quantity=payload.quantity,
        low_stock_threshold=payload.low_stock_threshold,
        created_by=current_user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductResponse])
def list_products(
    store_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if current_user.role == UserRole.OWNER:
        if store_id is not None:
            query = query.filter(Product.store_id == store_id)
    else:
        # Employees are always scoped to their own store — any store_id they
        # pass is ignored, never used to widen or redirect the query.
        query = query.filter(Product.store_id == current_user.store_id)

    return query.all()


@router.get("/low-stock", response_model=list[LowStockGroup])
def low_stock_products(
    store_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.quantity < Product.low_stock_threshold)

    if current_user.role == UserRole.OWNER:
        if store_id is not None:
            query = query.filter(Product.store_id == store_id)
    else:
        query = query.filter(Product.store_id == current_user.store_id)

    low_stock = query.all()

    groups: dict[int, LowStockGroup] = {}
    for product in low_stock:
        if product.store_id not in groups:
            groups[product.store_id] = LowStockGroup(
                store_id=product.store_id,
                store_name=product.store.name,
                products=[],
            )
        groups[product.store_id].products.append(ProductResponse.model_validate(product))

    return list(groups.values())


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_scoped_product_or_404(product_id, current_user, db)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = _get_scoped_product_or_404(product_id, current_user, db)

    updates = payload.model_dump(exclude_unset=True)

    if current_user.role != UserRole.OWNER:
        price_fields_sent = {"price", "cost_price"} & updates.keys()
        if price_fields_sent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owner can change price or cost_price",
            )

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    db.delete(product)
    db.commit()
