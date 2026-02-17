"""
Application configuration.

Uses pydantic-settings to load from environment variables / .env file.
The Python "Intelligence Sidecar" only needs read access to Supabase
to compute decay scores — it never serves as the primary data path.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Service
    app_name: str = "Relationship Garden — Intelligence Service"
    debug: bool = False

    # Supabase connection (the sidecar reads/writes health scores)
    supabase_url: str = ""
    supabase_service_role_key: str = ""  # Service role bypasses RLS for batch updates
    database_url: str = ""               # Direct Postgres connection for bulk ops

    # Decay Engine defaults (λ per tier, daily)
    # Half-life formula:  t½ = ln(2) / λ
    decay_rate_succulent: float = 0.0077   # ~90-day half-life
    decay_rate_fern: float = 0.0231        # ~30-day half-life
    decay_rate_orchid: float = 0.0495      # ~14-day half-life
    decay_rate_bonsai: float = 0.0116      # ~60-day half-life

    # Health thresholds (for status classification)
    threshold_healthy: float = 0.7
    threshold_cooling: float = 0.4
    # Below threshold_cooling → "at_risk"
    # Below 0.1 → "dormant"
    threshold_dormant: float = 0.1

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
