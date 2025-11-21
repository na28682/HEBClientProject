import React, { useEffect, useMemo, useState } from "react";
import {
  addItem,
  BillPerUser,
  createList,
  fetchItems,
  getUserId,
  Item,
  mockCheckout,
} from "./api";

const HEB_RED = "#e11b22";
const HEB_DARK = "#242424";
const HEB_CARD_DARK = "#333333";
const HEB_BLUE = "#0078b5";

const App: React.FC = () => {
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bill, setBill] = useState<BillPerUser[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const userId = useMemo(() => getUserId(), []);

  useEffect(() => {
    const setup = async () => {
      setIsLoading(true);
      try {
        const storedListId = localStorage.getItem("heb_list_id");
        let id = storedListId;
        if (!id) {
          const list = await createList("My H‑E‑B Trip");
          id = list.id;
          localStorage.setItem("heb_list_id", id);
        }
        setListId(id);
        const listItems = await fetchItems(id);
        setItems(listItems);
      } finally {
        setIsLoading(false);
      }
    };
    void setup();
  }, []);

  const handleAddItem = async () => {
    if (!listId || !newItemName.trim()) return;
    setIsLoading(true);
    try {
      const price = newItemPrice ? parseFloat(newItemPrice) : undefined;
      const created = await addItem(listId, newItemName.trim(), price);
      setItems((prev) => [...prev, created]);
      setNewItemName("");
      setNewItemPrice("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickClaimAll = () => {
    // For now, we visually mark current user as payer; backend claims can be added later.
    alert("In a full build, this would call the claim API for each item for you.");
  };

  const handleSplitBill = async () => {
    if (!listId) return;
    setIsLoading(true);
    try {
      const res = await mockCheckout(listId);
      setBill(res.per_user);
      setTotal(res.total);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-root">
      <div className="phone-frame">
        <header className="app-header">
          <div className="header-top">
            <span className="header-time">12:58</span>
            <span className="header-title">Split bill</span>
          </div>
          <div className="header-wave" />
        </header>

        <main className="app-main">
          <section className="list-section">
            <h2 className="section-title">In Produce</h2>
            <div className="card">
              {items.length === 0 && (
                <div className="empty-state">No items yet. Add something below.</div>
              )}
              {items.map((item) => (
                <div key={item.id} className="item-row">
                  <div className="item-dot" />
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-meta">
                      Estimated: $
                      {item.price_estimate != null
                        ? item.price_estimate.toFixed(2)
                        : "—"}
                    </div>
                  </div>
                  <button className="pill-button pill-secondary">Claim</button>
                </div>
              ))}
            </div>
          </section>

          <section className="add-section">
            <div className="add-row">
              <input
                className="input"
                placeholder="Add an item"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <input
                className="input price-input"
                placeholder="$"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
              <button className="pill-button" onClick={handleAddItem}>
                + Add
              </button>
            </div>
            <button className="link-button" onClick={handleQuickClaimAll}>
              Claim all for me ({userId.slice(0, 8)})
            </button>
          </section>

          <section className="bill-section">
            <div className="bill-summary">
              <div>
                <div className="bill-label">Estimated total</div>
                <div className="bill-value">
                  $
                  {items
                    .reduce(
                      (sum, i) => sum + (i.price_estimate != null ? i.price_estimate : 0),
                      0,
                    )
                    .toFixed(2)}
                </div>
              </div>
              <button className="pill-button primary" onClick={handleSplitBill}>
                Split at checkout
              </button>
            </div>

            {bill && (
              <div className="bill-breakdown">
                <h3 className="section-title">Bill breakdown</h3>
                <div className="bill-total-row">
                  <span>Total</span>
                  <span>${total?.toFixed(2)}</span>
                </div>
                {bill.map((p) => (
                  <div key={p.user_id} className="bill-user">
                    <div className="bill-user-header">
                      <div className="avatar">
                        {p.user_id.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="bill-user-info">
                        <div className="bill-user-name">
                          User {p.user_id.slice(0, 6)}
                        </div>
                        <div className="bill-user-amount">
                          Owes ${p.amount_owed.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <ul className="bill-items">
                      {p.items.map((it) => (
                        <li key={it.item_id}>
                          <span>{it.name}</span>
                          <span>${it.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="app-footer">
          <button className="footer-button secondary">Add an item</button>
          <button className="footer-button primary">Move items</button>
        </footer>

        {isLoading && <div className="loading-overlay">Loading…</div>}
      </div>
    </div>
  );
};

export default App;


