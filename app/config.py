import os

from dotenv import load_dotenv

load_dotenv()


DEFAULT_LOCAL_DB = "postgresql+psycopg2://postgres:postgres@localhost:5432/heb_shared"

APP_ENV = os.getenv("APP_ENV", "development").lower()

DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("DATABASE_INTERNAL_URL")
    or os.getenv("DATABASE_EXTERNAL_URL")
)

if not DATABASE_URL:
    if APP_ENV == "development":
        DATABASE_URL = DEFAULT_LOCAL_DB
    else:
        raise RuntimeError(
            "DATABASE_URL is not set. Configure it in your deployment environment."
        )

APP_NAME = os.getenv("APP_NAME", "HEB Shared List & Bill Split API")

