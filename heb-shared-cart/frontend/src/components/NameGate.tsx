import { useState } from "react";

interface Props {
  initialName: string;
  onSave: (name: string) => void;
}

export default function NameGate({ initialName, onSave }: Props) {
  const [name, setName] = useState(initialName === "Shopper" ? "" : initialName);

  return (
    <div className="modal-overlay">
      <div className="modal page-narrow">
        <h2>Welcome to the cart 🛒</h2>
        <p className="sub">
          What should other shoppers call you? This is how your name shows up on shared
          lists.
        </p>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSave(name.trim());
          }}
        />
        <div className="modal-actions">
          <button
            className="btn"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
          >
            Start shopping
          </button>
        </div>
      </div>
    </div>
  );
}
