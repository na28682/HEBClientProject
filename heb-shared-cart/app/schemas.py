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
        from_attributes = True


class CreateListIn(BaseModel):
    name: str


class SharedListOut(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    status: ListStatus
    invite_code: Optional[str]

    class Config:
        from_attributes = True


class MemberOut(BaseModel):
    user_id: UUID
    name: str
    avatar_url: Optional[str]
    role: str

    class Config:
        from_attributes = True


class JoinListIn(BaseModel):
    invite_code: str


class SharedListDetailOut(SharedListOut):
    members: List[MemberOut] = []
    items: List["ItemOut"] = []


class ItemCreateIn(BaseModel):
    name: str
    price_estimate: Optional[float] = None
    quantity: float = 1


class ItemUpdateIn(BaseModel):
    name: Optional[str] = None
    price_estimate: Optional[float] = None
    quantity: Optional[float] = None
    is_in_cart: Optional[bool] = None


class ItemOut(BaseModel):
    id: UUID
    list_id: UUID
    name: str
    price_estimate: Optional[float]
    quantity: float
    is_in_cart: bool
    added_by_user_id: UUID

    class Config:
        from_attributes = True


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


SharedListDetailOut.model_rebuild()


