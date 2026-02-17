"""
Relationship Garden — Intelligence Sidecar

This FastAPI service is the "brain" of the garden.
It does NOT serve as the primary data API (that's Supabase direct).
It handles:
  1. Decay calculations (exponential health scoring)
  2. Batch refresh (cron-triggered score updates)
  3. Future: ML predictions, smart nudges, context recall
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .api.v1.garden import router as garden_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Intelligence sidecar for Relationship Garden — handles decay logic and ML.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(garden_router, prefix="/api/v1", tags=["garden"])


@app.get("/health")
async def health_check():
    return {"status": "alive", "service": "intelligence-sidecar"}
