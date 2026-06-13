import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload

from .. import schemas
from ..database import get_db
from ..deps import get_current_user
from ..models import (
    Item,
    ItemClaim,
    ListStatus,
    MemberRole,
    SharedList,
    SharedListMember,
    User,
)
from ..ws_manager import manager

router = APIRouter(prefix="/lists", tags=["lists"])


def _generate_invite_code() -> str:
    return secrets.token_hex(3).upper()


def _get_list_or_404(db: Session, list_id: UUID) -> SharedList:
    shared_list = (
        db.query(SharedList)
        .options(joinedload(SharedList.members).joinedload(SharedListMember.user))
        .filter(SharedList.id == list_id)
        .first()
    )
    if not shared_list:
        raise HTTPException(status_code=404, detail="List not found")
    return shared_list


def _require_member(db: Session, list_id: UUID, user: User) -> SharedListMember:
    membership = (
        db.query(SharedListMember)
        .filter(SharedListMember.list_id == list_id, SharedListMember.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this list")
    return membership


def _serialize_list(shared_list: SharedList) -> schemas.SharedListDetailOut:
    members = [
        schemas.MemberOut(
            user_id=m.user_id,
            name=m.user.name,
            avatar_url=m.user.avatar_url,
            role=m.role.value,
        )
        for m in shared_list.members
    ]
    items = [schemas.ItemOut.model_validate(i) for i in shared_list.items]
    return schemas.SharedListDetailOut(
        id=shared_list.id,
        name=shared_list.name,
        owner_id=shared_list.owner_id,
        status=shared_list.status,
        invite_code=shared_list.invite_code,
        members=members,
        items=items,
    )


@router.get("", response_model=list[schemas.SharedListOut])
def list_my_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = (
        db.query(SharedListMember)
        .filter(SharedListMember.user_id == current_user.id)
        .all()
    )
    list_ids = [m.list_id for m in memberships]
    if not list_ids:
        return []
    return db.query(SharedList).filter(SharedList.id.in_(list_ids)).all()


@router.post("", response_model=schemas.SharedListDetailOut)
def create_list(
    payload: schemas.CreateListIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shared_list = SharedList(
        name=payload.name,
        owner_id=current_user.id,
        status=ListStatus.open,
        invite_code=_generate_invite_code(),
    )
    db.add(shared_list)
    db.flush()

    membership = SharedListMember(
        list_id=shared_list.id, user_id=current_user.id, role=MemberRole.admin
    )
    db.add(membership)
    db.commit()
    db.refresh(shared_list)
    return _serialize_list(_get_list_or_404(db, shared_list.id))


@router.post("/join", response_model=schemas.SharedListDetailOut)
def join_list(
    payload: schemas.JoinListIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shared_list = (
        db.query(SharedList)
        .filter(SharedList.invite_code == payload.invite_code.upper())
        .first()
    )
    if not shared_list:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    existing = (
        db.query(SharedListMember)
        .filter(
            SharedListMember.list_id == shared_list.id,
            SharedListMember.user_id == current_user.id,
        )
        .first()
    )
    if not existing:
        membership = SharedListMember(
            list_id=shared_list.id, user_id=current_user.id, role=MemberRole.editor
        )
        db.add(membership)
        db.commit()

    return _serialize_list(_get_list_or_404(db, shared_list.id))


@router.get("/{list_id}", response_model=schemas.SharedListDetailOut)
def get_list(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, list_id, current_user)
    return _serialize_list(_get_list_or_404(db, list_id))


@router.post("/{list_id}/items", response_model=schemas.ItemOut)
async def add_item(
    list_id: UUID,
    payload: schemas.ItemCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, list_id, current_user)
    shared_list = _get_list_or_404(db, list_id)
    if shared_list.status != ListStatus.open:
        raise HTTPException(status_code=400, detail="List is not open for edits")

    item = Item(
        list_id=list_id,
        name=payload.name,
        price_estimate=payload.price_estimate,
        quantity=payload.quantity,
        added_by_user_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    item_out = schemas.ItemOut.model_validate(item)
    await manager.broadcast(
        list_id,
        {"type": "item_added", "item": item_out.model_dump(mode="json"), "by": str(current_user.id)},
    )
    return item_out


@router.patch("/{list_id}/items/{item_id}", response_model=schemas.ItemOut)
async def update_item(
    list_id: UUID,
    item_id: UUID,
    payload: schemas.ItemUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, list_id, current_user)
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.list_id == list_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)

    item_out = schemas.ItemOut.model_validate(item)
    await manager.broadcast(
        list_id,
        {"type": "item_updated", "item": item_out.model_dump(mode="json"), "by": str(current_user.id)},
    )
    return item_out


@router.delete("/{list_id}/items/{item_id}")
async def delete_item(
    list_id: UUID,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, list_id, current_user)
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.list_id == list_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.query(ItemClaim).filter(ItemClaim.item_id == item_id).delete()
    db.delete(item)
    db.commit()

    await manager.broadcast(
        list_id,
        {"type": "item_deleted", "item_id": str(item_id), "by": str(current_user.id)},
    )
    return {"ok": True}


@router.post("/{list_id}/items/{item_id}/claims", response_model=schemas.ItemOut)
async def claim_item(
    list_id: UUID,
    item_id: UUID,
    payload: schemas.ClaimCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, list_id, current_user)
    item = (
        db.query(Item)
        .options(joinedload(Item.claims))
        .filter(Item.id == item_id, Item.list_id == list_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing_claim = (
        db.query(ItemClaim)
        .filter(ItemClaim.item_id == item_id, ItemClaim.user_id == payload.user_id)
        .first()
    )
    if existing_claim:
        existing_claim.percentage = payload.percentage
        db.add(existing_claim)
    else:
        db.add(
            ItemClaim(
                item_id=item_id,
                user_id=payload.user_id,
                percentage=payload.percentage,
            )
        )
    db.commit()
    db.refresh(item)

    item_out = schemas.ItemOut.model_validate(item)
    await manager.broadcast(
        list_id,
        {"type": "item_claimed", "item": item_out.model_dump(mode="json"), "by": str(current_user.id)},
    )
    return item_out


@router.websocket("/{list_id}/ws")
async def list_websocket(websocket: WebSocket, list_id: UUID):
    await manager.connect(list_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Lightweight presence / cursor relay: broadcast as-is to others.
            data["from_socket"] = True
            await manager.broadcast(list_id, data)
    except WebSocketDisconnect:
        manager.disconnect(list_id, websocket)
