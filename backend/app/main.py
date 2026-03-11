import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401
from app.routers import (
    auth as auth_router,
    bookings as bookings_router,
    finances as finances_router,
    quotations as quotations_router,
    exports as exports_router,
)


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Event Business Tracker API", version="0.1.0")

frontend_origin = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://event-business-tracker-web-production.up.railway.app",
    "https://event-business-tracker-web-staging.up.railway.app",
    frontend_origin,
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(bookings_router.router)
app.include_router(finances_router.router)
app.include_router(quotations_router.router)
app.include_router(exports_router.router)


@app.get("/health")
def read_health():
    return {"status": "ok"}
