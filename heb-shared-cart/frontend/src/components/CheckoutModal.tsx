import { useState } from "react";
import { checkoutSplit } from "../api/client";
import type { Bill, Item, Member } from "../types";

interface Props {
  listId: string;
  cartItems: Item[];
  members: Member[];
  onClose: () => void;
  onComplete: () => void;
}

export default function CheckoutModal({
  listId,
  cartItems,
  members,
  onClose,
  onComplete,
}: Props) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedTotal = cartItems.reduce(
    (sum, i) => sum + (i.price_estimate ?? 0) * i.quantity,
    0
  );

  function memberName(userId: string) {
    return members.find((m) => m.user_id === userId)?.name ?? "Unknown";
  }

  async function handleCheckout() {
    setBusy(true);
    setError(null);
    try {
      const result = await checkoutSplit(
        listId,
        cartItems.map((i) => ({
          list_item_id: i.id,
          name: i.name,
          final_price: (i.price_estimate ?? 0) * i.quantity,
        }))
      );
      setBill(result);
    } catch {
      setError("Couldn't check out. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!bill ? (
          <>
            <h2>Ready to check out?</h2>
            <p className="sub">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in the cart ·
              estimated total ${estimatedTotal.toFixed(2)}
            </p>
            {cartItems.length === 0 ? (
              <div className="empty-state">
                <div className="big">🧺</div>
                <h3>Cart's empty</h3>
                <p>Check off items first to add them to the cart.</p>
              </div>
            ) : (
              <div className="claims-list">
                {cartItems.map((i) => (
                  <div className="claim-row" key={i.id}>
                    <span>
                      {i.name}
                      {i.quantity !== 1 ? ` × ${i.quantity}` : ""}
                    </span>
                    <span>${((i.price_estimate ?? 0) * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p style={{ color: "var(--heb-red)", fontSize: "0.85rem" }}>{error}</p>
            )}
            <div className="modal-actions">
              <button className="btn ghost" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleCheckout}
                disabled={busy || cartItems.length === 0}
              >
                {busy ? <span className="spinner" /> : "Check out & split"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Here's the split 🧾</h2>
            <p className="sub">
              Total: <strong>${bill.total.toFixed(2)}</strong>
            </p>
            {bill.per_user.length === 0 ? (
              <p className="muted">
                No one claimed any items, so there's nothing to split.
              </p>
            ) : (
              bill.per_user.map((pu) => (
                <div className="bill-row" key={pu.user_id}>
                  <div>
                    <div className="name">{memberName(pu.user_id)}</div>
                    <div className="sub-items">
                      {pu.items.map((it) => it.name).join(", ")}
                    </div>
                  </div>
                  <div className="amount">${pu.amount_owed.toFixed(2)}</div>
                </div>
              ))
            )}
            <div className="modal-actions">
              <button
                className="btn"
                onClick={() => {
                  onComplete();
                  onClose();
                }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
