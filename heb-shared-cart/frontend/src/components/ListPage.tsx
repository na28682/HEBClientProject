import { useEffect, useMemo, useRef, useState } from "react";
import { addItem, deleteItem, getList, updateItem } from "../api/client";
import { useListSocket } from "../hooks/useListSocket";
import type { Item, SharedList, WsMessage } from "../types";
import PresenceBar from "./PresenceBar";
import CartTicket from "./CartTicket";
import ProductCatalog from "./ProductCatalog";
import ClaimsModal from "./ClaimsModal";
import CheckoutModal from "./CheckoutModal";

interface Props {
  listId: string;
  userId: string;
  userName: string;
  onBack: () => void;
}

type Tab = "list" | "aisles";

interface ToastMsg {
  id: string;
  text: string;
}

export default function ListPage({ listId, userId, userName, onBack }: Props) {
  const [list, setList] = useState<SharedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("list");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set([userId]));
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [claimsItem, setClaimsItem] = useState<Item | null>(null);
  const [claimsByItem, setClaimsByItem] = useState<Record<string, Record<string, number>>>({});
  const [showCheckout, setShowCheckout] = useState(false);

  const toastTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const listRef = useRef<SharedList | null>(null);
  listRef.current = list;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  async function load() {
    setLoading(true);
    try {
      const data = await getList(listId);
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  function pushToast(text: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, text }]);
    toastTimer.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  function memberName(uid: string): string {
    return listRef.current?.members.find((m) => m.user_id === uid)?.name ?? "Someone";
  }

  function handleWsMessage(msg: WsMessage) {
    switch (msg.type) {
      case "item_added": {
        const item = msg.item as Item;
        setList((prev) => {
          if (!prev) return prev;
          if (prev.items.some((i) => i.id === item.id)) return prev;
          return { ...prev, items: [...prev.items, item] };
        });
        if (msg.by !== userId) {
          pushToast(`${memberName(msg.by ?? "")} added ${item.name}`);
        }
        break;
      }
      case "item_updated": {
        const item = msg.item as Item;
        setList((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((i) => (i.id === item.id ? item : i)),
          };
        });
        if (msg.by !== userId && item.is_in_cart) {
          pushToast(`${memberName(msg.by ?? "")} checked off ${item.name}`);
        }
        break;
      }
      case "item_deleted": {
        const itemId = msg.item_id as string;
        setList((prev) => {
          if (!prev) return prev;
          return { ...prev, items: prev.items.filter((i) => i.id !== itemId) };
        });
        break;
      }
      case "item_claimed": {
        const item = msg.item as Item;
        setList((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((i) => (i.id === item.id ? item : i)),
          };
        });
        if (msg.by !== userId) {
          pushToast(`${memberName(msg.by ?? "")} updated a split`);
        }
        break;
      }
      case "presence": {
        const uid = msg.user_id as string;
        if (uid) {
          setOnlineIds((prev) => new Set(prev).add(uid));
        }
        break;
      }
      default:
        break;
    }
  }

  const { send } = useListSocket(listId, handleWsMessage);

  // Announce presence on connect and periodically
  useEffect(() => {
    send({ type: "presence", user_id: userId, user_name: userName });
    const interval = setInterval(() => {
      send({ type: "presence", user_id: userId, user_name: userName });
    }, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, userId, userName]);

  useEffect(() => {
    return () => {
      Object.values(toastTimer.current).forEach(clearTimeout);
    };
  }, []);

  const listItems = useMemo(() => list?.items.filter((i) => !i.is_in_cart) ?? [], [list]);
  const cartItems = useMemo(() => list?.items.filter((i) => i.is_in_cart) ?? [], [list]);

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + (i.price_estimate ?? 0) * i.quantity,
    0
  );

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    setAdding(true);
    try {
      await addItem(listId, {
        name: newItemName.trim(),
        price_estimate: newItemPrice ? parseFloat(newItemPrice) : null,
        quantity: 1,
      });
      setNewItemName("");
      setNewItemPrice("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleInCart(item: Item) {
    await updateItem(listId, item.id, { is_in_cart: !item.is_in_cart });
  }

  async function handleDelete(item: Item) {
    await deleteItem(listId, item.id);
  }

  if (loading || !list) {
    return (
      <div className="page center">
        <p className="muted">Loading list...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="toast-stack">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            {t.text}
          </div>
        ))}
      </div>

      <button className="btn ghost small" onClick={onBack} style={{ marginBottom: 16 }}>
        ← My lists
      </button>

      <div className="list-header">
        <div className="list-title-block">
          <h1>{list.name}</h1>
          <div className="invite-code">
            Invite code <strong>{list.invite_code}</strong>
          </div>
        </div>
        <PresenceBar members={list.members} onlineIds={onlineIds} />
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "list" ? "active" : ""}`} onClick={() => setTab("list")}>
          List ({listItems.length})
        </button>
        <button className={`tab ${tab === "aisles" ? "active" : ""}`} onClick={() => setTab("aisles")}>
          Aisles
        </button>
      </div>

      {tab === "list" ? (
        <>
          <div className="add-item-bar">
            <input
              type="text"
              placeholder="Add an item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <input
              type="number"
              className="price-input"
              placeholder="$ est."
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              step="0.01"
              min="0"
            />
            <button className="btn" onClick={handleAddItem} disabled={adding}>
              Add
            </button>
          </div>

          {listItems.length === 0 && cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="big">📝</div>
              <h3>List is empty</h3>
              <p>Add items above or browse the Aisles tab for ideas.</p>
            </div>
          ) : (
            <>
              {listItems.map((item) => (
                <CartTicket
                  key={item.id}
                  item={item}
                  members={list.members}
                  onToggleInCart={handleToggleInCart}
                  onDelete={handleDelete}
                  onOpenClaims={setClaimsItem}
                  claimCount={Object.keys(claimsByItem[item.id] ?? {}).length}
                />
              ))}

              {cartItems.length > 0 && (
                <>
                  <div className="section-title">In the cart</div>
                  {cartItems.map((item) => (
                    <CartTicket
                      key={item.id}
                      item={item}
                      members={list.members}
                      onToggleInCart={handleToggleInCart}
                      onDelete={handleDelete}
                      onOpenClaims={setClaimsItem}
                      claimCount={Object.keys(claimsByItem[item.id] ?? {}).length}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </>
      ) : (
        <ProductCatalog listId={listId} disabled={list.status !== "open"} onItemAdded={() => {}} />
      )}

      {claimsItem && (
        <ClaimsModal
          item={claimsItem}
          members={list.members}
          existingClaims={claimsByItem[claimsItem.id] ?? {}}
          listId={listId}
          onClose={() => setClaimsItem(null)}
          onSaved={(updated, shares) => {
            setClaimsByItem((prev) => ({
              ...prev,
              [updated.id]: Object.fromEntries(
                Object.entries(shares).filter(([, v]) => v > 0)
              ),
            }));
            setList((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                items: prev.items.map((i) => (i.id === updated.id ? updated : i)),
              };
            });
          }}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          listId={listId}
          cartItems={cartItems}
          members={list.members}
          onClose={() => setShowCheckout(false)}
          onComplete={load}
        />
      )}

      <div className="cart-bar">
        <div className="cart-bar-inner">
          <div className="cart-bar-total">
            <span className="label">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
            </span>
            ${cartTotal.toFixed(2)}
          </div>
          <button className="btn" onClick={() => setShowCheckout(true)}>
            Checkout & Split
          </button>
        </div>
      </div>
    </div>
  );
}
