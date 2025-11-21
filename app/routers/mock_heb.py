from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Item
from ..schemas import BillOut, CartItemIn, CheckoutSplitIn
from . import checkout as checkout_router


router = APIRouter(prefix="/mock-heb", tags=["mock-heb"])


@router.post("/checkout/{list_id}", response_model=BillOut)
def mock_checkout(
    list_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Simulate H-E-B sending final cart prices at checkout.
    Uses each item's price_estimate as the final price.
    """
    items = db.query(Item).filter(Item.list_id == list_id).all()
    cart_items = [
        CartItemIn(
            list_item_id=item.id,
            name=item.name,
            final_price=item.price_estimate or 1.0,
        )
        for item in items
    ]
    payload = CheckoutSplitIn(list_id=list_id, items=cart_items)
    # Reuse the real checkout split handler.
    return checkout_router.checkout_split(payload)  # type: ignore[arg-type]


