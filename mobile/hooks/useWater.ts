import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { InteractionType } from "@/types/garden";

/**
 * useWater — logs an interaction ("waters" a plant).
 *
 * Inserts into the `interactions` table. The DB trigger automatically:
 *   1. Resets health_score to 1.0
 *   2. Updates last_interaction_at
 *   3. Increments total_interactions
 *   4. Advances growth_stage at milestones
 *
 * This is the "one-tap watering" the product spec demands.
 */
export function useWater() {
  const { user } = useAuth();
  const [watering, setWatering] = useState(false);

  async function water(
    contactId: string,
    type: InteractionType = "other",
    notes?: string
  ) {
    if (!user) throw new Error("Not authenticated");

    setWatering(true);
    try {
      const { error } = await supabase.from("interactions").insert({
        contact_id: contactId,
        user_id: user.id,
        type,
        source: "manual",
        notes: notes ?? null,
        happened_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Water failed:", err);
      throw err;
    } finally {
      setWatering(false);
    }
  }

  return { water, watering };
}
