import Svg, { Path, Ellipse, G } from "react-native-svg";
import { getPlantColors } from "./colors";

interface Props {
  size?: number;
  health: number;
  stage: string;
}

/**
 * Succulent — for low-touch relationships (acquaintances, casual).
 *
 * Compact rosette of thick leaves in a small pot.
 * Healthy: plump, tightly packed leaves.
 * Wilting: thin, shriveled leaves spreading outward.
 */
export default function SucculentPlant({ size = 64, health, stage }: Props) {
  const c = getPlantColors(health);
  const h = Math.max(0, Math.min(1, health));

  // Petal/leaf count based on stage
  const petalCount =
    stage === "ancient" ? 12 : stage === "mature" ? 10 : stage === "sapling" ? 8 : stage === "sprout" ? 6 : 5;

  const cx = 32;
  const cy = 40;

  // Leaf plumpness — thinner when wilting
  const plump = 0.35 + h * 0.25;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Small round pot */}
      <Path
        d="M24 50 Q24 56, 28 58 L36 58 Q40 56, 40 50 Z"
        fill={c.pot}
        stroke={c.potDark}
        strokeWidth={0.5}
      />
      <Ellipse cx={32} cy={50} rx={8} ry={2} fill={c.potDark} />
      <Ellipse cx={32} cy={50} rx={6.5} ry={1.2} fill={c.soil} />

      {/* Rosette layers — outer first, then inner */}
      {/* Outer ring */}
      {Array.from({ length: petalCount }).map((_, i) => {
        const angle = (360 / petalCount) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const dist = 8 + (1 - h) * 2; // Spread out when wilting
        const lx = cx + Math.cos(rad) * dist;
        const ly = cy + Math.sin(rad) * dist * 0.7; // Slight vertical compression
        const leafLen = 7 + h * 3;

        return (
          <Ellipse
            key={`outer-${i}`}
            cx={lx}
            cy={ly}
            rx={leafLen}
            ry={leafLen * plump}
            fill={i % 2 === 0 ? c.leaf : c.leafDark}
            opacity={0.55 + h * 0.4}
            rotation={angle + 90}
            origin={`${lx}, ${ly}`}
          />
        );
      })}

      {/* Inner ring (fewer, smaller) */}
      {Array.from({ length: Math.max(3, Math.floor(petalCount * 0.6)) }).map(
        (_, i) => {
          const count = Math.max(3, Math.floor(petalCount * 0.6));
          const angle = (360 / count) * i - 90 + 15; // Offset from outer
          const rad = (angle * Math.PI) / 180;
          const dist = 4 + (1 - h);
          const lx = cx + Math.cos(rad) * dist;
          const ly = cy + Math.sin(rad) * dist * 0.7;
          const leafLen = 5 + h * 2;

          return (
            <Ellipse
              key={`inner-${i}`}
              cx={lx}
              cy={ly}
              rx={leafLen}
              ry={leafLen * (plump + 0.05)}
              fill={i % 2 === 0 ? c.accent : c.leaf}
              opacity={0.6 + h * 0.35}
              rotation={angle + 90}
              origin={`${lx}, ${ly}`}
            />
          );
        }
      )}

      {/* Center bud */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={3 + h}
        ry={2.5 + h * 0.5}
        fill={c.accent}
        opacity={0.7 + h * 0.3}
      />
    </Svg>
  );
}
