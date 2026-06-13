from uuid import UUID

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import User


def get_current_user(
    db: Session = Depends(get_db),
    x_user_id: str = Header(..., alias="X-User-Id"),
    x_user_name: str | None = Header(None, alias="X-User-Name"),
):
    """
    Mock authentication using headers so the API is easy to test.
    If the user does not exist yet, it is created automatically.
    """
    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id header")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, name=x_user_name or "Demo User")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


