import { useState } from "react";
import { claimItem } from "../api/client";
import type { Item, Member } from "../types";

interface Props {
  item: Item;
  members: Member[];
  existingClaims: Record<string, number>;
  listId: string;
  onClose: () => void;
  onSaved: (item: Item, shares: Record<string, number>) => void;
}

export default function ClaimsModal({
  item,
  members,
  existingClaims,
  listId,
  onClose,
  onSaved,
}: Props) {
  const [shares, setShares] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    members.forEach((m) => {
      initial[m.user_id] = existingClaims[m.user_id] ?? 0;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Object.values(shares).reduce((a, b) => a + b, 0);

  function splitEvenly() {
    const evenShare = Math.round((100 / members.length)) ;
    const updated: Record<string, number> = {};
    members.forEach((m, i) => {
      // give remainder to first member so it sums to 100
      updated[m.user_id] = i === 0 ? 100 - evenShare * (members.length - 1) : evenShare;
    });
    setShares(updated);
  }

  async function handleSave() {
    if (Math.round(total) !== 100) {
      setError("Shares must add up to 100%.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let lastItem: Item | null = null;
      for (const m of members) {
        const pct = shares[m.user_id] || 0;
        if (pct > 0) {
          lastItem = await claimItem(listId, item.id, m.user_id, pct / 100);
        }
      }
      if (lastItem) onSaved(lastItem, shares);
      onClose();
    } catch {
      setError("Couldn't save the split. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal page-narrow" onClick={(e) => e.stopPropagation()}>
        <h2>Split "{item.name}"</h2>
        <p className="sub">
          Choose how much of this item each person is responsible for. Shares should
          add up to 100%.
        </p>

        <div className="claims-list">
          {members.map((m) => (
            <div className="claim-row" key={m.user_id}>
              <span>{m.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={shares[m.user_id] ?? 0}
                  onChange={(e) =>
                    setShares((prev) => ({
                      ...prev,
                      [m.user_id]: Number(e.target.value),
                    }))
                  }
                />
                <span className="muted">%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="muted" style={{ fontSize: "0.85rem" }}>
          Total: {total}% {Math.round(total) !== 100 && "(should be 100%)"}
        </div>

        {error && (
          <p style={{ color: "var(--heb-red)", fontSize: "0.85rem" }}>{error}</p>
        )}

        <div className="modal-actions">
          <button className="btn ghost" onClick={splitEvenly} disabled={saving}>
            Split evenly
          </button>
          <button className="btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : "Save split"}
          </button>
        </div>
      </div>
    </div>
  );
}
