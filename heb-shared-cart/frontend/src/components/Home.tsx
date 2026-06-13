import { useEffect, useState } from "react";
import { createList, getMyLists, joinList } from "../api/client";
import type { SharedList } from "../types";

interface Props {
  onOpenList: (listId: string) => void;
}

export default function Home({ onOpenList }: Props) {
  const [lists, setLists] = useState<SharedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getMyLists();
      setLists(data);
    } catch {
      setError("Couldn't load your lists. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newListName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const list = await createList(newListName.trim());
      onOpenList(list.id);
    } catch {
      setError("Couldn't create the list. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const list = await joinList(inviteCode.trim().toUpperCase());
      onOpenList(list.id);
    } catch {
      setError("That invite code didn't match a list.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <h1>
          Shop together, <span>split fair</span>.
        </h1>
        <p>
          Build a shared grocery list with friends or roommates, add items together in
          real time, then split the bill when you check out.
        </p>
      </div>

      <div className="action-grid">
        <div className="action-card">
          <h3>Start a new list</h3>
          <p>Create a shared cart and invite people with a code.</p>
          <div className="field-row">
            <input
              type="text"
              placeholder="e.g. Sunday Run"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button className="btn" onClick={handleCreate} disabled={busy}>
              Create
            </button>
          </div>
        </div>

        <div className="action-card">
          <h3>Join a list</h3>
          <p>Got an invite code from someone? Enter it to jump into their cart.</p>
          <div className="field-row">
            <input
              type="text"
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button className="btn secondary" onClick={handleJoin} disabled={busy}>
              Join
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="muted center" style={{ color: "var(--heb-red)", marginTop: 16 }}>
          {error}
        </p>
      )}

      <div className="section-title">Your lists</div>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : lists.length === 0 ? (
        <div className="empty-state">
          <div className="big">🛒</div>
          <h3>No lists yet</h3>
          <p>Create one above to get your shopping crew together.</p>
        </div>
      ) : (
        lists.map((list) => (
          <div className="list-row" key={list.id} onClick={() => onOpenList(list.id)}>
            <div>
              <div className="list-row-name">{list.name}</div>
              <div className="list-row-meta">Invite code: {list.invite_code}</div>
            </div>
            <span className={`status-pill ${list.status}`}>
              {list.status.replace("_", " ")}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
