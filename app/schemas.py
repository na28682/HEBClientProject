from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from .models import ListStatus


class UserCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None


class UserOut(BaseModel):
    id: UUID
    name: str
    avatar_url: Optional[str]

    class Config:
        orm_mode = True


class CreateListIn(BaseModel):
    name: str


class SharedListOut(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    status: ListStatus
    invite_code: Optional[str]

    class Config:
        orm_mode = True


class ItemCreateIn(BaseModel):
    name: str
    price_estimate: Optional[float] = None


class ItemOut(BaseModel):
    id: UUID
    list_id: UUID
    name: str
    price_estimate: Optional[float]
    added_by_user_id: UUID

    class Config:
        orm_mode = True


class ClaimCreateIn(BaseModel):
    user_id: UUID
    percentage: float


class CartItemIn(BaseModel):
    list_item_id: UUID
    name: str
    final_price: float


class CheckoutSplitIn(BaseModel):
    list_id: UUID
    items: List[CartItemIn]


class BillPerUserItem(BaseModel):
    item_id: UUID
    name: str
    amount: float


class BillPerUser(BaseModel):
    user_id: UUID
    amount_owed: float
    items: List[BillPerUserItem]


class BillOut(BaseModel):
    id: UUID
    list_id: UUID
    total: float
    per_user: List[BillPerUser]


