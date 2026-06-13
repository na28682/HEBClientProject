from typing import Dict, List, Tuple
from uuid import UUID

from .models import Item


def compute_split(
    items: List[Item],
    price_by_item_id: Dict[UUID, float],
) -> Tuple[float, Dict[UUID, Dict]]:
    """
    Compute per-user bill breakdown.

    Returns:
        total: overall bill total
        per_user: mapping user_id -> {'amount': float, 'items': List[(Item, amount)]}
    """
    per_user: Dict[UUID, Dict] = {}
    total = 0.0

    for item in items:
        price = price_by_item_id.get(item.id) or item.price_estimate or 0.0
        total += price

        if not item.claims:
            # For now, unclaimed items are ignored in the per-user breakdown.
            # This can be changed to assign to the list owner/admin.
            continue

        sum_percentage = sum(c.percentage for c in item.claims) or 1.0

        for claim in item.claims:
            normalized = claim.percentage / sum_percentage
            amount = price * normalized

            entry = per_user.setdefault(
                claim.user_id, {"amount": 0.0, "items": []}
            )
            entry["amount"] += amount
            entry["items"].append((item, amount))

    return total, per_user


