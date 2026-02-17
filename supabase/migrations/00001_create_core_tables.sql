-- ============================================================
-- Relationship Garden — Core Schema
-- Migration: 00001_create_core_tables
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM: Relationship tiers (botanical metaphor)
-- Tiers govern default decay rates AND visual plant style.
--   succulent  → low-maintenance (casual/dormant contacts)
--   fern       → medium-maintenance (peers, casual friends)
--   orchid     → high-maintenance (mentors, close family)
--   bonsai     → professional, variable cadence (recruiters, investors)
-- ============================================================
CREATE TYPE relationship_tier AS ENUM ('succulent', 'fern', 'orchid', 'bonsai');

-- ============================================================
-- ENUM: Plant growth stage (narrative progression)
-- ============================================================
CREATE TYPE growth_stage AS ENUM ('seed', 'sprout', 'sapling', 'mature', 'ancient');

-- ============================================================
-- ENUM: Interaction types
-- ============================================================
CREATE TYPE interaction_type AS ENUM (
    'text', 'call', 'email', 'meeting', 'coffee',
    'video_call', 'social_media', 'letter', 'gift', 'other'
);

-- ============================================================
-- ENUM: Interaction source (how was it captured?)
-- ============================================================
CREATE TYPE interaction_source AS ENUM (
    'manual', 'gmail_import', 'calendar_sync', 'csv_import', 'share_intent'
);

-- ============================================================
-- TABLE: contacts  (The "Assets" — each row is a plant)
-- ============================================================
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identity
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    company         TEXT,
    title           TEXT,
    avatar_url      TEXT,
    birthday        DATE,
    timezone        TEXT,
    notes           TEXT,                              -- Freeform "context note"

    -- Relationship metadata
    tier            relationship_tier NOT NULL DEFAULT 'fern',
    growth_stage    growth_stage NOT NULL DEFAULT 'seed',
    tags            TEXT[] DEFAULT '{}',                -- e.g. {'ucsd', 'quant', 'mentor'}

    -- The Decay Engine inputs
    last_interaction_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    health_score         FLOAT NOT NULL DEFAULT 1.0     -- 0.0 (Dormant) → 1.0 (Thriving)
        CHECK (health_score >= 0.0 AND health_score <= 1.0),
    decay_rate           FLOAT NOT NULL DEFAULT 0.05    -- λ (lambda) — daily decay constant
        CHECK (decay_rate > 0.0),
    total_interactions   INTEGER NOT NULL DEFAULT 0,

    -- Flags
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    is_favorite     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: interactions  (The "Watering Events")
-- ============================================================
CREATE TABLE interactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What happened
    type            interaction_type NOT NULL DEFAULT 'other',
    source          interaction_source NOT NULL DEFAULT 'manual',
    notes           TEXT,
    sentiment       FLOAT,                             -- Optional: -1.0 (negative) to 1.0 (positive)

    -- When
    happened_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    duration_minutes INTEGER,                          -- For calls/meetings
    metadata        JSONB DEFAULT '{}',                -- Flexible store for import-specific data

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Optimized for the "Garden View" query pattern
-- ============================================================

-- Primary query: "Give me all plants for this user, sorted by health"
CREATE INDEX idx_contacts_user_health
    ON contacts(user_id, health_score ASC)
    WHERE is_archived = FALSE;

-- "Who needs attention?" query (wilting plants)
CREATE INDEX idx_contacts_user_wilting
    ON contacts(user_id, health_score ASC)
    WHERE is_archived = FALSE AND health_score < 0.5;

-- Interaction history for a contact
CREATE INDEX idx_interactions_contact_date
    ON interactions(contact_id, happened_at DESC);

-- User-level interaction feed
CREATE INDEX idx_interactions_user_date
    ON interactions(user_id, happened_at DESC);

-- Birthday lookup (for the "Critical Watering Events" feature)
CREATE INDEX idx_contacts_birthday
    ON contacts(user_id, birthday)
    WHERE birthday IS NOT NULL;

-- ============================================================
-- TRIGGER: auto-update `updated_at` on contacts
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: on new interaction → update contact metadata
--   1. Reset health_score to 1.0
--   2. Update last_interaction_at
--   3. Increment total_interactions
--   4. Advance growth_stage at milestones
-- ============================================================
CREATE OR REPLACE FUNCTION on_interaction_created()
RETURNS TRIGGER AS $$
DECLARE
    current_total INTEGER;
    new_stage growth_stage;
BEGIN
    -- Get current total
    SELECT total_interactions INTO current_total
    FROM contacts WHERE id = NEW.contact_id;

    current_total := current_total + 1;

    -- Determine growth stage based on total interactions
    new_stage := CASE
        WHEN current_total >= 50 THEN 'ancient'
        WHEN current_total >= 25 THEN 'mature'
        WHEN current_total >= 10 THEN 'sapling'
        WHEN current_total >= 3  THEN 'sprout'
        ELSE 'seed'
    END;

    -- Update the contact
    UPDATE contacts SET
        health_score = 1.0,
        last_interaction_at = NEW.happened_at,
        total_interactions = current_total,
        growth_stage = new_stage,
        updated_at = NOW()
    WHERE id = NEW.contact_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_interaction_created
    AFTER INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION on_interaction_created();

-- ============================================================
-- ROW LEVEL SECURITY — Users can only see their own data
-- ============================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Contacts: users see only their own
CREATE POLICY "Users can view own contacts"
    ON contacts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
    ON contacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
    ON contacts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
    ON contacts FOR DELETE
    USING (auth.uid() = user_id);

-- Interactions: users see only their own
CREATE POLICY "Users can view own interactions"
    ON interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
    ON interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
    ON interactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- DEFAULT DECAY RATES per tier (reference constants)
-- These are used by the Python Decay Engine and the seed script.
--
-- Tier        | λ (decay_rate) | Half-life   | Meaning
-- ------------|----------------|-------------|---------------------------
-- succulent   | 0.0077         | ~90 days    | Casual, slow fade
-- fern        | 0.0231         | ~30 days    | Standard cadence
-- orchid      | 0.0495         | ~14 days    | High-touch, fades fast
-- bonsai      | 0.0116         | ~60 days    | Professional, moderate
-- ============================================================
-- (These are encoded in the Python service config, not stored in DB.
--  The per-contact `decay_rate` column allows individual overrides.)
