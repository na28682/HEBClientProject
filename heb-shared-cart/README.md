# H‑E‑B Shared List & Bill Split

A mockup of a "shop together" grocery app inspired by H‑E‑B. Friends or roommates
create a shared cart, add items to it together **in real time** (via WebSockets),
browse a mock H‑E‑B product catalog, check items off as they go in-store, and split
the final bill by however each person claims items.

## What's included

- **FastAPI backend** (`app/`) — users, shared lists, items, claims, checkout/bill
  split, and a mock H‑E‑B product catalog. Real-time sync via a WebSocket per list.
- **React + TypeScript frontend** (`frontend/`) — HEB-styled UI: landing page,
  shared list view with live presence indicators, an "Aisles" tab for browsing the
  mock catalog, item splitting, and a checkout/bill-split modal.

## Running locally

### 1. Backend

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

By default (`APP_ENV=development`), the backend connects to a local Postgres
instance at `postgresql+psycopg2://postgres:postgres@localhost:5432/heb_shared`.
If you don't have Postgres running locally, point it at SQLite for quick testing:

```bash
export DATABASE_URL="sqlite:///./dev.db"
export APP_ENV=development
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`. Interactive docs are at
`http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api/*` (including
WebSocket connections) to the backend on port 8000.

Open `http://localhost:5173` in two different browser windows (or a normal +
incognito window) to see real-time sync between two "shoppers."

## How it works

- **Identity**: There's no real auth. Each browser generates a random user ID
  (stored in `localStorage`) and you pick a display name on first visit. This is
  sent as `X-User-Id` / `X-User-Name` headers, and the backend auto-creates a user
  record if one doesn't exist yet (see `app/deps.py`).
- **Shared lists**: Create a list to get an invite code. Anyone who enters that
  code joins as a member and can add/check off/remove items.
- **Real-time sync**: Each list has a WebSocket endpoint (`/lists/{list_id}/ws`).
  When anyone adds, edits, checks off, deletes, or splits an item, the backend
  broadcasts the change to everyone connected to that list, so carts stay in sync
  without refreshing. Presence pings let you see who's currently shopping.
- **Aisles tab**: A small mock H‑E‑B product catalog (`app/routers/mock_heb.py`)
  with realistic-ish names, prices, and categories — tap a product to add it to the
  shared list with its price pre-filled.
- **Splitting items**: Tap the scale icon on any item to assign percentage shares
  to members of the list (defaults to splitting evenly).
- **Checkout**: Once items are checked off into the cart, "Checkout & Split"
  computes a per-person total based on each item's claimed shares and records a
  `Bill` with `BillLine`s for each person/item.

## Deploying to Render (or any cloud host)

1. Provision a managed Postgres database. Copy its connection string:

   ```
   postgresql://USER:PASSWORD@HOST:PORT/DBNAME
   ```

2. In your web service's environment variables, set:

   - `APP_ENV=production`
   - `DATABASE_URL=<connection string>`

   Render lets you add this via **Environment → Add From Database** so you don't
   expose credentials.

3. Deploy with:

   ```
   build: pip install -r requirements.txt
   start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. For the frontend, run `npm run build` in `frontend/` and serve the `dist/`
   folder as static assets (or deploy as its own static site), pointing its `/api`
   requests at your backend's URL.

In production, if `DATABASE_URL` is missing, the app fails fast with a clear error
message rather than attempting to connect to `localhost`.

## Project structure

```
app/
  main.py            FastAPI app, CORS, router registration
  config.py          Env config (DATABASE_URL, APP_NAME)
  database.py        SQLAlchemy engine/session setup
  models.py          ORM models (users, lists, items, claims, bills)
  schemas.py         Pydantic request/response models
  deps.py            Mock header-based auth dependency
  bill_logic.py      Per-user bill split calculation
  ws_manager.py      WebSocket connection manager
  routers/
    users.py         Current user profile
    lists.py         Lists, members, items, claims, WebSocket endpoint
    checkout.py      Checkout + bill split + bill history
    mock_heb.py      Mock product catalog

frontend/
  src/
    api/client.ts          REST client
    hooks/useIdentity.ts    Mock-auth identity (localStorage)
    hooks/useListSocket.ts  WebSocket hook with auto-reconnect
    components/             UI components (Home, ListPage, ProductCatalog, ...)
    App.tsx, main.tsx, index.css
```
