"""
Tests for the Decay Engine.

Verifies the core exponential decay formula and status classification.
Run with: pytest backend/tests/ -v
"""

import math
from datetime import datetime, timezone, timedelta

from app.core.decay import (
    calculate_health,
    classify_status,
    days_until_threshold,
    get_default_decay_rate,
)


class TestCalculateHealth:
    """Verify N(t) = N₀ · e^(−λ · t)"""

    def test_health_at_zero_days(self):
        """Just interacted → health should be 1.0."""
        now = datetime.now(timezone.utc)
        health = calculate_health(now, decay_rate=0.05, now=now)
        assert health == 1.0

    def test_health_decays_over_time(self):
        """Health should decrease as days pass."""
        now = datetime.now(timezone.utc)
        one_week_ago = now - timedelta(days=7)
        health = calculate_health(one_week_ago, decay_rate=0.05, now=now)
        expected = math.exp(-0.05 * 7)
        assert abs(health - expected) < 0.001

    def test_fern_30_day_halflife(self):
        """Fern tier (λ=0.0231) should hit ~50% at 30 days."""
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        health = calculate_health(thirty_days_ago, decay_rate=0.0231, now=now)
        assert 0.45 < health < 0.55  # Approximately 50%

    def test_orchid_decays_fast(self):
        """Orchid tier (λ=0.0495) should be quite low at 30 days."""
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        health = calculate_health(thirty_days_ago, decay_rate=0.0495, now=now)
        assert health < 0.25

    def test_succulent_decays_slowly(self):
        """Succulent tier (λ=0.0077) should stay high at 30 days."""
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        health = calculate_health(thirty_days_ago, decay_rate=0.0077, now=now)
        assert health > 0.75

    def test_health_never_below_zero(self):
        """Even after 1000 days, health ≥ 0."""
        now = datetime.now(timezone.utc)
        ancient = now - timedelta(days=1000)
        health = calculate_health(ancient, decay_rate=0.05, now=now)
        assert health >= 0.0

    def test_health_never_above_one(self):
        """Health should be clamped to [0, 1]."""
        now = datetime.now(timezone.utc)
        health = calculate_health(now, decay_rate=0.05, now=now, initial_health=1.0)
        assert health <= 1.0

    def test_future_interaction_returns_one(self):
        """If last_interaction is in the future (clock skew), return 1.0."""
        now = datetime.now(timezone.utc)
        future = now + timedelta(days=1)
        health = calculate_health(future, decay_rate=0.05, now=now)
        assert health == 1.0

    def test_naive_datetime_handled(self):
        """Naive datetimes should be treated as UTC."""
        now = datetime.now(timezone.utc)
        naive = datetime(2024, 1, 1)
        health = calculate_health(naive, decay_rate=0.05, now=now)
        assert 0.0 <= health <= 1.0


class TestClassifyStatus:
    def test_thriving(self):
        assert classify_status(0.85) == "thriving"

    def test_cooling(self):
        assert classify_status(0.55) == "cooling"

    def test_at_risk(self):
        assert classify_status(0.25) == "at_risk"

    def test_dormant(self):
        assert classify_status(0.05) == "dormant"

    def test_boundary_healthy(self):
        assert classify_status(0.7) == "thriving"

    def test_boundary_cooling(self):
        assert classify_status(0.4) == "cooling"


class TestDaysUntilThreshold:
    def test_healthy_contact(self):
        days = days_until_threshold(1.0, 0.0231, 0.5)
        assert days is not None
        assert 28 < days < 32  # ~30 days for fern

    def test_already_below_threshold(self):
        result = days_until_threshold(0.3, 0.05, 0.5)
        assert result is None

    def test_exact_at_threshold(self):
        result = days_until_threshold(0.5, 0.05, 0.5)
        assert result is None


class TestGetDefaultDecayRate:
    def test_known_tiers(self):
        assert get_default_decay_rate("succulent") == 0.0077
        assert get_default_decay_rate("fern") == 0.0231
        assert get_default_decay_rate("orchid") == 0.0495
        assert get_default_decay_rate("bonsai") == 0.0116

    def test_unknown_tier_defaults_to_fern(self):
        assert get_default_decay_rate("unknown") == 0.0231
