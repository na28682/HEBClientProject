from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import APP_NAME
from .database import Base, engine
from .routers import checkout, lists, mock_heb, users


Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(lists.router)
app.include_router(checkout.router)
app.include_router(mock_heb.router)


