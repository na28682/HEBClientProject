from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import schemas
from ..bill_logic import compute_split
from ..database import get_db
from ..deps import get_current_user
from ..models import Bill, BillLine, Item, ListStatus, SharedList, SharedListMember, User

router = APIRouter(prefix="/checkout", tags=["checkout"])


def _require_member(db: Session, list_id: UUID, user: User):
    membership = (
        db.query(SharedListMember)
        .filter(SharedListMember.list_id == list_id, SharedListMember.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this list")


@router.post("/split", response_model=schemas.BillOut)
def checkout_and_split(
    payload: schemas.CheckoutSplitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, payload.list_id, current_user)

    shared_list = db.query(SharedList).filter(SharedList.id == payload.list_id).first()
    if not shared_list:
        raise HTTPException(status_code=404, detail="List not found")

    price_by_item_id = {ci.list_item_id: ci.final_price for ci in payload.items}
    item_ids = list(price_by_item_id.keys())

    items = (
        db.query(Item)
        .options(joinedload(Item.claims))
        .filter(Item.id.in_(item_ids), Item.list_id == payload.list_id)
        .all()
    )

    total, per_user = compute_split(items, price_by_item_id)

    bill = Bill(list_id=payload.list_id, total=total)
    db.add(bill)
    db.flush()

    items_by_id = {item.id: item for item in items}

    bill_per_user = []
    for user_id, entry in per_user.items():
        line_items = []
        for item, amount in entry["items"]:
            db.add(
                BillLine(
                    bill_id=bill.id,
                    item_id=item.id,
                    user_id=user_id,
                    amount=amount,
                )
            )
            line_items.append(
                schemas.BillPerUserItem(item_id=item.id, name=item.name, amount=amount)
            )
        bill_per_user.append(
            schemas.BillPerUser(
                user_id=user_id, amount_owed=entry["amount"], items=line_items
            )
        )

    shared_list.status = ListStatus.checked_out
    db.add(shared_list)
    db.commit()

    return schemas.BillOut(
        id=bill.id, list_id=bill.list_id, total=bill.total, per_user=bill_per_user
    )


@router.get("/{list_id}/bills", response_model=list[schemas.BillOut])
def list_bills(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, list_id, current_user)

    bills = db.query(Bill).filter(Bill.list_id == list_id).all()
    result = []
    for bill in bills:
        lines = db.query(BillLine).filter(BillLine.bill_id == bill.id).all()
        per_user_map: dict = {}
        for line in lines:
            entry = per_user_map.setdefault(line.user_id, {"amount": 0.0, "items": []})
            entry["amount"] += line.amount
            item = db.query(Item).filter(Item.id == line.item_id).first()
            entry["items"].append(
                schemas.BillPerUserItem(
                    item_id=line.item_id,
                    name=item.name if item else "Unknown item",
                    amount=line.amount,
                )
            )
        per_user = [
            schemas.BillPerUser(user_id=uid, amount_owed=v["amount"], items=v["items"])
            for uid, v in per_user_map.items()
        ]
        result.append(
            schemas.BillOut(id=bill.id, list_id=bill.list_id, total=bill.total, per_user=per_user)
        )
    return result
