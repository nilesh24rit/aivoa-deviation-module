from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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


# Serve the built React SPA same-origin when frontend/dist exists (production
# on Render). Local dev keeps using the Vite server + proxy as before.
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = _DIST / full_path if full_path else None
        if candidate is not None and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_DIST / "index.html")
