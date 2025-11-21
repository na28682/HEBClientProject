from uuid import UUID
import uuid as uuid_lib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Item, ItemClaim, ListStatus, MemberRole, SharedList, SharedListMember
from ..schemas import ClaimCreateIn, CreateListIn, ItemCreateIn, ItemOut, SharedListOut


router = APIRouter(prefix="/lists", tags=["lists"])


@router.post("", response_model=SharedListOut)
def create_list(
    payload: CreateListIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    shared_list = SharedList(
        name=payload.name,
        owner_id=current_user.id,
        invite_code=str(uuid_lib.uuid4())[:8],
    )
    db.add(shared_list)
    db.flush()

    member = SharedListMember(
        list_id=shared_list.id,
        user_id=current_user.id,
        role=MemberRole.admin,
    )
    db.add(member)
    db.commit()
    db.refresh(shared_list)
    return shared_list


@router.get("/{list_id}", response_model=SharedListOut)
def get_list(list_id: UUID, db: Session = Depends(get_db)):
    shared_list = db.query(SharedList).filter(SharedList.id == list_id).first()
    if not shared_list:
        raise HTTPException(status_code=404, detail="List not found")
    return shared_list


@router.post("/{list_id}/items", response_model=ItemOut)
def add_item(
    list_id: UUID,
    payload: ItemCreateIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    shared_list = db.query(SharedList).filter(SharedList.id == list_id).first()
    if not shared_list:
        raise HTTPException(status_code=404, detail="List not found")

    item = Item(
        list_id=list_id,
        name=payload.name,
        price_estimate=payload.price_estimate,
        added_by_user_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{list_id}/items", response_model=list[ItemOut])
def list_items(list_id: UUID, db: Session = Depends(get_db)):
    items = db.query(Item).filter(Item.list_id == list_id).all()
    return items


@router.post("/{list_id}/items/{item_id}/claims")
def create_claim(
    list_id: UUID,
    item_id: UUID,
    payload: ClaimCreateIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.list_id == list_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.percentage <= 0 or payload.percentage > 1:
        raise HTTPException(status_code=400, detail="percentage must be (0,1]")

    claim = ItemClaim(
        item_id=item_id,
        user_id=payload.user_id,
        percentage=payload.percentage,
    )
    db.add(claim)
    db.commit()
    return {"status": "ok"}


@router.post("/{list_id}/lock")
def lock_list(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    shared_list = db.query(SharedList).filter(SharedList.id == list_id).first()
    if not shared_list:
        raise HTTPException(status_code=404, detail="List not found")

    if shared_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can lock")

    shared_list.status = ListStatus.locked
    db.commit()
    return {"status": "locked"}


