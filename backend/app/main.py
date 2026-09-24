from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .ai import files  # noqa: F401  (ensures optional parsers import cleanly at startup)
from .database import Base, engine
from .routers import ai, deviations

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AIVOA Deviation Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router)
app.include_router(deviations.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
