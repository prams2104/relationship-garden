"""
Garden endpoints — the "read" side of the Intelligence Sidecar.

GET  /garden/{user_id}    → Full garden state with live-calculated health.
POST /refresh-garden       → Batch recalculate and persist health scores.
POST /water/{contact_id}   → Log interaction, reset health to 1.0.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from supabase import create_client

from ...core.config import get_settings
from ...core.decay import calculate_health, classify_status, days_until_threshold
from ...models.schemas import (
    GardenResponse,
    PlantHealth,
    RefreshRequest,
    RefreshResult,
    WaterRequest,
    WaterResponse,
    GrowthStageEnum,
)

router = APIRouter()


def _get_supabase():
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("/garden/{user_id}", response_model=GardenResponse)
async def get_garden(user_id: str):
    """
    Fetch all non-archived contacts for a user and compute live health.

    This calculates health on-the-fly (not from the stored column)
    so the garden is always fresh — no stale cache issues.
    """
    supabase = _get_supabase()
    now = datetime.now(timezone.utc)

    response = (
        supabase.table("contacts")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_archived", False)
        .order("health_score", desc=False)
        .execute()
    )

    plants: list[PlantHealth] = []
    total_health = 0.0
    needs_attention = 0

    for contact in response.data:
        last_interaction = datetime.fromisoformat(contact["last_interaction_at"])
        health = calculate_health(last_interaction, contact["decay_rate"], now)
        status = classify_status(health)
        cooling_days = days_until_threshold(health, contact["decay_rate"], 0.4)

        if status in ("at_risk", "dormant"):
            needs_attention += 1

        total_health += health

        plants.append(PlantHealth(
            id=contact["id"],
            name=contact["name"],
            tier=contact["tier"],
            growth_stage=contact["growth_stage"],
            health_score=round(health, 4),
            status=status,
            days_until_cooling=cooling_days,
            last_interaction_at=last_interaction,
            total_interactions=contact["total_interactions"],
            is_favorite=contact.get("is_favorite", False),
            tags=contact.get("tags", []),
        ))

    total = len(plants)
    avg = round(total_health / total, 4) if total > 0 else 0.0

    return GardenResponse(
        user_id=user_id,
        total_plants=total,
        avg_health=avg,
        needs_attention=needs_attention,
        plants=plants,
        refreshed_at=now,
    )


@router.post("/refresh-garden", response_model=RefreshResult)
async def refresh_garden(req: RefreshRequest):
    """
    Batch recalculate health scores and persist to DB.

    This is the "cron job" endpoint — called periodically (or on app open)
    to update stored health_score values so Supabase queries can sort/filter
    without hitting the Python service every time.
    """
    supabase = _get_supabase()
    now = datetime.now(timezone.utc)

    response = (
        supabase.table("contacts")
        .select("id, last_interaction_at, decay_rate")
        .eq("user_id", req.user_id)
        .eq("is_archived", False)
        .execute()
    )

    total_health = 0.0
    updated = 0

    for contact in response.data:
        last_interaction = datetime.fromisoformat(contact["last_interaction_at"])
        health = calculate_health(last_interaction, contact["decay_rate"], now)
        health = round(health, 4)
        total_health += health

        supabase.table("contacts").update({
            "health_score": health,
        }).eq("id", contact["id"]).execute()

        updated += 1

    avg = round(total_health / updated, 4) if updated > 0 else 0.0

    return RefreshResult(
        user_id=req.user_id,
        contacts_updated=updated,
        avg_health=avg,
        refreshed_at=now,
    )


@router.post("/water/{contact_id}", response_model=WaterResponse)
async def water_plant(contact_id: str, req: WaterRequest):
    """
    Log an interaction for a contact ("water" the plant).

    1. Insert into `interactions` table.
    2. The DB trigger automatically resets health to 1.0 and
       advances the growth stage.
    3. Return the new plant state.
    """
    supabase = _get_supabase()
    now = req.happened_at or datetime.now(timezone.utc)

    # Verify the contact exists
    contact_resp = (
        supabase.table("contacts")
        .select("id, growth_stage, total_interactions")
        .eq("id", contact_id)
        .eq("user_id", req.user_id)
        .single()
        .execute()
    )

    if not contact_resp.data:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Insert the interaction (DB trigger handles the rest)
    supabase.table("interactions").insert({
        "contact_id": contact_id,
        "user_id": req.user_id,
        "type": req.type.value,
        "source": "manual",
        "notes": req.notes,
        "happened_at": now.isoformat(),
    }).execute()

    # Fetch the updated contact to return new state
    updated = (
        supabase.table("contacts")
        .select("health_score, growth_stage, total_interactions")
        .eq("id", contact_id)
        .single()
        .execute()
    )

    data = updated.data
    return WaterResponse(
        contact_id=contact_id,
        new_health=data["health_score"],
        new_stage=data["growth_stage"],
        status=classify_status(data["health_score"]),
    )
