import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { calculateHealth, classifyStatus } from "@/lib/decay";
import type { PlantData, Contact } from "@/types/garden";

/**
 * useGarden — fetches contacts from Supabase and computes live health.
 *
 * Architecture: mobile reads directly from Supabase (the "fast path").
 * Health is calculated client-side using the same exponential decay formula
 * as the Python sidecar, so the garden is always fresh without a network hop.
 */
export function useGarden() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGarden = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const { data, error: dbError } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("health_score", { ascending: true });

      if (dbError) throw dbError;

      const now = new Date();
      const mapped: PlantData[] = (data ?? []).map((c: Contact) => {
        const health = calculateHealth(c.last_interaction_at, c.decay_rate, now);
        const roundedHealth = Math.round(health * 1000) / 1000;
        return {
          id: c.id,
          name: c.name,
          tier: c.tier,
          growthStage: c.growth_stage,
          healthScore: roundedHealth,
          status: classifyStatus(roundedHealth),
          lastInteractionAt: c.last_interaction_at,
          totalInteractions: c.total_interactions,
          isFavorite: c.is_favorite,
          tags: c.tags ?? [],
          company: c.company,
          title: c.title,
          notes: c.notes,
        };
      });

      setPlants(mapped);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch garden");
      console.error("useGarden error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGarden();
  }, [fetchGarden]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchGarden();
  }, [fetchGarden]);

  const avgHealth =
    plants.length > 0
      ? plants.reduce((sum, p) => sum + p.healthScore, 0) / plants.length
      : 0;

  const needsAttention = plants.filter(
    (p) => p.status === "at_risk" || p.status === "dormant"
  );

  return {
    plants,
    loading,
    error,
    refresh,
    avgHealth,
    needsAttention,
    totalPlants: plants.length,
  };
}
