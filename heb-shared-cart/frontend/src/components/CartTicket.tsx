import type { Item, Member } from "../types";

interface Props {
  item: Item;
  members: Member[];
  onToggleInCart: (item: Item) => void;
  onDelete: (item: Item) => void;
  onOpenClaims: (item: Item) => void;
  claimCount: number;
}

export default function CartTicket({
  item,
  members,
  onToggleInCart,
  onDelete,
  onOpenClaims,
  claimCount,
}: Props) {
  const addedBy = members.find((m) => m.user_id === item.added_by_user_id);
  const lineTotal =
    item.price_estimate != null ? item.price_estimate * item.quantity : null;

  return (
    <div className={`ticket ${item.is_in_cart ? "in-cart" : ""}`}>
      <button
        className="ticket-check"
        onClick={() => onToggleInCart(item)}
        title={item.is_in_cart ? "Move back to list" : "Mark as in cart"}
      >
        {item.is_in_cart ? "✓" : ""}
      </button>
      <div className="ticket-body">
        <div className="ticket-name">
          {item.name}
          {item.quantity !== 1 ? ` × ${item.quantity}` : ""}
        </div>
        <div className="ticket-meta">
          {addedBy && <span className="who">added by {addedBy.name}</span>}
          {claimCount > 0 && <span>· split {claimCount} way{claimCount > 1 ? "s" : ""}</span>}
        </div>
      </div>
      <div className="ticket-price">
        {lineTotal != null ? `$${lineTotal.toFixed(2)}` : "—"}
      </div>
      <div className="ticket-actions">
        <button className="icon-btn" onClick={() => onOpenClaims(item)} title="Split this item">
          ⚖️
        </button>
        <button className="icon-btn danger" onClick={() => onDelete(item)} title="Remove">
          ✕
        </button>
      </div>
    </div>
  );
}
