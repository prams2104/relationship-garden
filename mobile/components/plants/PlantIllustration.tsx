import type { RelationshipTier, GrowthStage } from "@/types/garden";
import OrchidPlant from "./OrchidPlant";
import FernPlant from "./FernPlant";
import BonsaiPlant from "./BonsaiPlant";
import SucculentPlant from "./SucculentPlant";

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
 * Each plant type responds to health (0→1) and growth stage,
 * changing its visual density, color saturation, and posture.
 */
export default function PlantIllustration({ tier, health, stage, size = 64 }: Props) {
  switch (tier) {
    case "orchid":
      return <OrchidPlant size={size} health={health} stage={stage} />;
    case "fern":
      return <FernPlant size={size} health={health} stage={stage} />;
    case "bonsai":
      return <BonsaiPlant size={size} health={health} stage={stage} />;
    case "succulent":
      return <SucculentPlant size={size} health={health} stage={stage} />;
    default:
      return <FernPlant size={size} health={health} stage={stage} />;
  }
}
