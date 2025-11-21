# H‑E‑B Shared List & Bill Split

## Running locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend defaults to a local Postgres instance (`postgresql+psycopg2://postgres:postgres@localhost:5432/heb_shared`) when `APP_ENV` is `development`.

## Deploying to Render (or any cloud host)

1. Provision a managed Postgres database. Copy its connection string:

   ```
   postgresql://USER:PASSWORD@HOST:PORT/DBNAME
   ```

2. In your web service’s environment variables, set:

   - `APP_ENV=production`
   - `DATABASE_URL=<connection string>`

   Render lets you add this via **Environment → Add From Database** so you don’t expose credentials.

3. Deploy with:

   ```
   build: pip install -r requirements.txt
   start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

In production, if `DATABASE_URL` is missing the app now fails fast with a clear error message rather than attempting to connect to `localhost`. This prevents the “connection refused” errors you saw when deploying without a remote database URL.


