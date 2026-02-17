/**
 * Core type definitions for Relationship Garden.
 *
 * These mirror the Supabase schema and the Python API contracts.
 */

export type RelationshipTier = "succulent" | "fern" | "orchid" | "bonsai";

export type GrowthStage = "seed" | "sprout" | "sapling" | "mature" | "ancient";

export type HealthStatus = "thriving" | "cooling" | "at_risk" | "dormant";

export type InteractionType =
  | "text"
  | "call"
  | "email"
  | "meeting"
  | "coffee"
  | "video_call"
  | "social_media"
  | "letter"
  | "gift"
  | "other";

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  avatar_url?: string;
  birthday?: string;
  timezone?: string;
  notes?: string;
  tier: RelationshipTier;
  growth_stage: GrowthStage;
  tags: string[];
  last_interaction_at: string;
  health_score: number;
  decay_rate: number;
  total_interactions: number;
  is_archived: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  user_id: string;
  type: InteractionType;
  source: string;
  notes?: string;
  sentiment?: number;
  happened_at: string;
  duration_minutes?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/** Plant data as rendered in the garden grid (enriched by decay engine). */
export interface PlantData {
  id: string;
  name: string;
  tier: RelationshipTier;
  growthStage: GrowthStage;
  healthScore: number;
  status: HealthStatus;
  daysUntilCooling?: number;
  lastInteractionAt: string;
  totalInteractions: number;
  isFavorite: boolean;
  tags: string[];
  company?: string;
  title?: string;
  notes?: string;
}

/** Response from GET /api/v1/garden/{user_id} */
export interface GardenState {
  user_id: string;
  total_plants: number;
  avg_health: number;
  needs_attention: number;
  plants: PlantData[];
  refreshed_at: string;
}

/** Tier display metadata (for UI rendering). */
export const TIER_CONFIG: Record<
  RelationshipTier,
  { label: string; emoji: string; description: string }
> = {
  orchid: {
    label: "Orchid",
    emoji: "🌸", // Only used in dev; production uses SVG illustrations
    description: "High-touch — mentors, close family",
  },
  fern: {
    label: "Fern",
    emoji: "🌿",
    description: "Standard cadence — friends, peers",
  },
  bonsai: {
    label: "Bonsai",
    emoji: "🌲",
    description: "Professional — recruiters, investors",
  },
  succulent: {
    label: "Succulent",
    emoji: "🪴",
    description: "Low-touch — acquaintances, casual",
  },
};

/** Health thresholds — must match backend config. */
export const HEALTH_THRESHOLDS = {
  THRIVING: 0.7,
  COOLING: 0.4,
  DORMANT: 0.1,
} as const;
