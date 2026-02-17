"""
The Decay Engine — core intelligence of Relationship Garden.

Implements exponential decay:  N(t) = N₀ · e^(−λ · t)

Where:
  N₀  = initial health (1.0 after a "watering" interaction)
  λ   = decay_rate (per-contact, defaults set by tier)
  t   = days since last interaction
  N(t)= current health_score ∈ [0.0, 1.0]

Design decisions:
  - Exponential (not linear) because relationships don't decay uniformly.
    The first week of silence is barely noticeable; week 6 is alarming.
  - Per-contact λ allows the user to tune individual relationships.
  - The engine is stateless: given (last_interaction, decay_rate, now),
    it computes the score. No side effects.
"""

import math
from datetime import datetime, timezone
from typing import Optional

from .config import get_settings


def calculate_health(
    last_interaction_at: datetime,
    decay_rate: float,
    now: Optional[datetime] = None,
    initial_health: float = 1.0,
) -> float:
    """
    Calculate current health score using exponential decay.

    Args:
        last_interaction_at: Timestamp of the most recent interaction.
        decay_rate: λ — the daily decay constant for this contact.
        now: Current time (defaults to UTC now). Injected for testability.
        initial_health: Health right after last interaction (default 1.0).

    Returns:
        Float in [0.0, 1.0] representing relationship health.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    # Ensure timezone-aware comparison
    if last_interaction_at.tzinfo is None:
        last_interaction_at = last_interaction_at.replace(tzinfo=timezone.utc)

    delta = now - last_interaction_at
    days_elapsed = max(delta.total_seconds() / 86400.0, 0.0)

    # N(t) = N₀ · e^(−λ · t)
    health = initial_health * math.exp(-decay_rate * days_elapsed)

    return max(0.0, min(1.0, health))


def classify_status(health_score: float) -> str:
    """
    Map a numeric health score to a human-readable status.

    Uses ordinal labels (not fake-precision percentages) per the
    design guidelines: "Health score should be ordinal, not a
    suspicious 87/100."
    """
    settings = get_settings()

    if health_score >= settings.threshold_healthy:
        return "thriving"
    elif health_score >= settings.threshold_cooling:
        return "cooling"
    elif health_score >= settings.threshold_dormant:
        return "at_risk"
    else:
        return "dormant"


def days_until_threshold(
    current_health: float,
    decay_rate: float,
    threshold: float = 0.5,
) -> Optional[float]:
    """
    Estimate how many days until health drops below a threshold.
    Useful for scheduling proactive nudges.

    Returns None if already below threshold.
    """
    if current_health <= threshold:
        return None
    if decay_rate <= 0:
        return None

    # Solve: threshold = current_health · e^(−λ · t)
    #    →  t = −ln(threshold / current_health) / λ
    t = -math.log(threshold / current_health) / decay_rate
    return round(t, 1)


def get_default_decay_rate(tier: str) -> float:
    """Return the default λ for a given tier."""
    settings = get_settings()
    rates = {
        "succulent": settings.decay_rate_succulent,
        "fern": settings.decay_rate_fern,
        "orchid": settings.decay_rate_orchid,
        "bonsai": settings.decay_rate_bonsai,
    }
    return rates.get(tier, settings.decay_rate_fern)
