"""
Pydantic schemas for API request/response validation.

These are the "contract" between the Python Intelligence Sidecar
and the mobile client (via Supabase).
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class TierEnum(str, Enum):
    succulent = "succulent"
    fern = "fern"
    orchid = "orchid"
    bonsai = "bonsai"


class GrowthStageEnum(str, Enum):
    seed = "seed"
    sprout = "sprout"
    sapling = "sapling"
    mature = "mature"
    ancient = "ancient"


class StatusEnum(str, Enum):
    thriving = "thriving"
    cooling = "cooling"
    at_risk = "at_risk"
    dormant = "dormant"


class InteractionTypeEnum(str, Enum):
    text = "text"
    call = "call"
    email = "email"
    meeting = "meeting"
    coffee = "coffee"
    video_call = "video_call"
    social_media = "social_media"
    letter = "letter"
    gift = "gift"
    other = "other"


# -- Response models --

class PlantHealth(BaseModel):
    """A single contact rendered as a plant in the garden."""
    id: str
    name: str
    tier: TierEnum
    growth_stage: GrowthStageEnum
    health_score: float = Field(ge=0.0, le=1.0)
    status: StatusEnum
    days_until_cooling: Optional[float] = None
    last_interaction_at: datetime
    total_interactions: int
    is_favorite: bool = False
    tags: list[str] = []


class GardenResponse(BaseModel):
    """The full garden state for a user."""
    user_id: str
    total_plants: int
    avg_health: float
    needs_attention: int  # count of at_risk + dormant
    plants: list[PlantHealth]
    refreshed_at: datetime


class RefreshRequest(BaseModel):
    """Request body for POST /refresh-garden."""
    user_id: str


class RefreshResult(BaseModel):
    """Response after recalculating all scores."""
    user_id: str
    contacts_updated: int
    avg_health: float
    refreshed_at: datetime


class WaterRequest(BaseModel):
    """Log an interaction (= "water" a plant)."""
    contact_id: str
    user_id: str
    type: InteractionTypeEnum = InteractionTypeEnum.other
    notes: Optional[str] = None
    happened_at: Optional[datetime] = None


class WaterResponse(BaseModel):
    """Response after watering a plant."""
    contact_id: str
    new_health: float
    new_stage: GrowthStageEnum
    status: StatusEnum
