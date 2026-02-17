import Svg, { Path, Circle, Ellipse, G } from "react-native-svg";
import { getPlantColors } from "./colors";

interface Props {
  size?: number;
  health: number;
  stage: string;
}

/**
 * Orchid — for high-touch relationships (mentors, family).
 *
 * Elegant arching stem with delicate blooms.
 * Healthy: upright with open flowers.
 * Wilting: drooping stem, closed/fallen petals.
 */
export default function OrchidPlant({ size = 64, health, stage }: Props) {
  const c = getPlantColors(health);
  const s = size;
  const h = Math.max(0, Math.min(1, health));

  // Number of blooms based on growth stage
  const bloomCount =
    stage === "ancient" ? 4 : stage === "mature" ? 3 : stage === "sapling" ? 2 : 1;

  // Stem curve — droops as health decreases
  const stemBend = 12 - h * 10; // More bend when unhealthy
  const stemTop = 10 + (1 - h) * 8;

  return (
    <Svg width={s} height={s} viewBox="0 0 64 64">
      {/* Pot */}
      <Path
        d={`M20 52 L22 58 L42 58 L44 52 Z`}
        fill={c.pot}
        stroke={c.potDark}
        strokeWidth={0.5}
      />
      <Ellipse cx={32} cy={52} rx={12} ry={2.5} fill={c.potDark} />
      <Ellipse cx={32} cy={52} rx={10} ry={1.5} fill={c.soil} />

      {/* Main stem — elegant curve */}
      <Path
        d={`M32 52 Q${32 + stemBend} 35, ${30 + stemBend * 0.3} ${stemTop}`}
        fill="none"
        stroke={c.stem}
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      {/* Support stake (thin line) */}
      <Path
        d="M32 52 L32 14"
        fill="none"
        stroke="#B5A68A"
        strokeWidth={0.6}
        strokeDasharray="2,2"
        opacity={0.4}
      />

      {/* Leaves at base */}
      <Path
        d={`M32 50 Q26 46, 22 48 Q26 44, 32 46`}
        fill={c.leaf}
        opacity={0.7}
      />
      <Path
        d={`M32 50 Q38 46, 42 48 Q38 44, 32 46`}
        fill={c.leafDark}
        opacity={0.7}
      />

      {/* Blooms along stem */}
      {Array.from({ length: bloomCount }).map((_, i) => {
        const t = (i + 1) / (bloomCount + 1);
        // Position along the quadratic bezier
        const bx = 32 + stemBend * t * (1 - t) * 2.5 + stemBend * 0.3 * t * t;
        const by = 52 - t * (52 - stemTop);
        const bloomSize = h * 4 + 2;
        const petalSpread = h * 3 + 1;

        return (
          <G key={i}>
            {/* Petals — 5 around center */}
            {[0, 72, 144, 216, 288].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const px = bx + Math.cos(rad) * petalSpread;
              const py = by + Math.sin(rad) * petalSpread;
              return (
                <Ellipse
                  key={angle}
                  cx={px}
                  cy={py}
                  rx={bloomSize * 0.6}
                  ry={bloomSize * 0.4}
                  fill={c.accent}
                  opacity={0.5 + h * 0.5}
                  rotation={angle}
                  origin={`${px}, ${py}`}
                />
              );
            })}
            {/* Center */}
            <Circle
              cx={bx}
              cy={by}
              r={bloomSize * 0.3}
              fill={h > 0.4 ? "#E8D44D" : c.leafDark}
              opacity={0.8}
            />
          </G>
        );
      })}
    </Svg>
  );
}
