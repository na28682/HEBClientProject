import { useEffect, useState } from "react";
import { addItem, searchProducts } from "../api/client";
import type { Product } from "../types";

interface Props {
  listId: string;
  disabled: boolean;
  onItemAdded: () => void;
}

export default function ProductCatalog({ listId, disabled, onItemAdded }: Props) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(query);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function load(q: string) {
    setLoading(true);
    try {
      const data = await searchProducts(q);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(product: Product) {
    setAddingId(product.id);
    try {
      await addItem(listId, {
        name: product.name,
        price_estimate: product.price,
        quantity: 1,
      });
      onItemAdded();
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search aisles, e.g. milk, chips, paper towels..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <p className="muted">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="big">🔎</div>
          <h3>No matches</h3>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {products.map((p) => (
            <button
              key={p.id}
              className="product-card"
              onClick={() => handleAdd(p)}
              disabled={disabled || addingId === p.id}
            >
              <div className="product-emoji">{p.image}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-price">${p.price.toFixed(2)}</div>
              <div className="product-category">{p.category}</div>
              <span className="btn small" style={{ marginTop: 4 }}>
                {addingId === p.id ? "Adding..." : "+ Add to list"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
