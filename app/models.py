import enum
import uuid

from sqlalchemy import CheckConstraint, Column, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


class ListStatus(str, enum.Enum):
    open = "open"
    locked = "locked"
    checked_out = "checked_out"


class MemberRole(str, enum.Enum):
    admin = "admin"
    editor = "editor"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)

    lists = relationship("SharedListMember", back_populates="user")


class SharedList(Base):
    __tablename__ = "shared_lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ListStatus), nullable=False, default=ListStatus.open)
    invite_code = Column(String, unique=True, nullable=True)

    owner = relationship("User")
    members = relationship("SharedListMember", back_populates="shared_list")
    items = relationship("Item", back_populates="shared_list")
    bills = relationship("Bill", back_populates="shared_list")


class SharedListMember(Base):
    __tablename__ = "shared_list_members"

    list_id = Column(UUID(as_uuid=True), ForeignKey("shared_lists.id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    role = Column(Enum(MemberRole), nullable=False, default=MemberRole.editor)

    shared_list = relationship("SharedList", back_populates="members")
    user = relationship("User", back_populates="lists")


class Item(Base):
    __tablename__ = "items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    list_id = Column(UUID(as_uuid=True), ForeignKey("shared_lists.id"), nullable=False)
    name = Column(String, nullable=False)
    price_estimate = Column(Float, nullable=True)
    added_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    shared_list = relationship("SharedList", back_populates="items")
    added_by = relationship("User")
    claims = relationship("ItemClaim", back_populates="item")


class ItemClaim(Base):
    __tablename__ = "item_claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    percentage = Column(Float, nullable=False)

    item = relationship("Item", back_populates="claims")
    user = relationship("User")

    __table_args__ = (
        CheckConstraint("percentage > 0 AND percentage <= 1", name="chk_percentage_0_1"),
    )


class Bill(Base):
    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    list_id = Column(UUID(as_uuid=True), ForeignKey("shared_lists.id"), nullable=False)
    total = Column(Float, nullable=False)

    shared_list = relationship("SharedList", back_populates="bills")
    lines = relationship("BillLine", back_populates="bill")


class BillLine(Base):
    __tablename__ = "bill_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)

    bill = relationship("Bill", back_populates="lines")
    item = relationship("Item")
    user = relationship("User")


