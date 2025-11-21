from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bill_logic import compute_split
from ..database import get_db
from ..deps import get_current_user
from ..models import Bill, BillLine, Item, SharedList
from ..schemas import BillOut, BillPerUser, BillPerUserItem, CheckoutSplitIn


router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("/split", response_model=BillOut)
def checkout_split(
    payload: CheckoutSplitIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    shared_list = (
        db.query(SharedList).filter(SharedList.id == payload.list_id).first()
    )
    if not shared_list:
        raise HTTPException(status_code=404, detail="List not found")

    items = db.query(Item).filter(Item.list_id == payload.list_id).all()
    price_by_item_id = {ci.list_item_id: ci.final_price for ci in payload.items}

    total, per_user_raw = compute_split(items, price_by_item_id)

    bill = Bill(list_id=payload.list_id, total=total)
    db.add(bill)
    db.flush()

    per_user_dtos: list[BillPerUser] = []

    for user_id, data in per_user_raw.items():
        amount_total = data["amount"]
        user_items_dtos: list[BillPerUserItem] = []

        for item, amount in data["items"]:
            line = BillLine(
                bill_id=bill.id,
                item_id=item.id,
                user_id=user_id,
                amount=amount,
            )
            db.add(line)
            user_items_dtos.append(
                BillPerUserItem(
                    item_id=item.id,
                    name=item.name,
                    amount=amount,
                )
            )

        per_user_dtos.append(
            BillPerUser(
                user_id=user_id,
                amount_owed=amount_total,
                items=user_items_dtos,
            )
        )

    db.commit()

    return BillOut(
        id=bill.id,
        list_id=bill.list_id,
        total=bill.total,
        per_user=per_user_dtos,
    )


