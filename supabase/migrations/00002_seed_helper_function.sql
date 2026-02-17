-- ============================================================
-- Helper function for the seed script.
-- Inserts an interaction WITHOUT triggering the health-reset trigger,
-- so we can seed contacts with realistic decay variety.
-- This function should be removed or disabled in production.
-- ============================================================

CREATE OR REPLACE FUNCTION seed_interaction(
    p_contact_id UUID,
    p_user_id UUID,
    p_type interaction_type,
    p_source interaction_source,
    p_notes TEXT,
    p_happened_at TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
    -- Temporarily disable the trigger
    ALTER TABLE interactions DISABLE TRIGGER trg_interaction_created;

    INSERT INTO interactions (contact_id, user_id, type, source, notes, happened_at)
    VALUES (p_contact_id, p_user_id, p_type, p_source, p_notes, p_happened_at);

    -- Re-enable the trigger
    ALTER TABLE interactions ENABLE TRIGGER trg_interaction_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
