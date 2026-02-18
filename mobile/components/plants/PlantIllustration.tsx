import type { RelationshipTier, GrowthStage } from "@/types/garden";
import PlantNode from "./PlantNode";
import BonsaiPlant from "./BonsaiPlant";

interface Props {
  tier: RelationshipTier;
  health: number;
  stage: GrowthStage;
  size?: number;
}

/**
 * PlantIllustration — routes to the correct botanical SVG
 * based on relationship tier.
 *
 * Fern, Succulent, Orchid use PlantNode (procedural, data-driven:
 * wilting logic, smooth color/tilt transitions, tier-specific shapes).
 * Bonsai keeps the existing BonsaiPlant illustration.
 */
export default function PlantIllustration({ tier, health, stage, size = 64 }: Props) {
  if (tier === "bonsai") {
    return <BonsaiPlant size={size} health={health} stage={stage} />;
  }
  return (
    <PlantNode
      tier={tier === "orchid" ? "orchid" : tier === "succulent" ? "succulent" : "fern"}
      health={health}
      size={size}
    />
  );
}
