import Svg, { Path, Ellipse, G } from "react-native-svg";
import { getPlantColors } from "./colors";

interface Props {
  size?: number;
  health: number;
  stage: string;
}

/**
 * Fern — for standard-cadence relationships (friends, peers).
 *
 * Multiple fronds radiating from center.
 * Healthy: full, upright fronds fanning out.
 * Wilting: drooping fronds, fewer leaflets.
 */
export default function FernPlant({ size = 64, health, stage }: Props) {
  const c = getPlantColors(health);
  const h = Math.max(0, Math.min(1, health));

  // Frond count based on stage
  const frondCount =
    stage === "ancient" ? 7 : stage === "mature" ? 6 : stage === "sapling" ? 5 : stage === "sprout" ? 3 : 2;

  // Droop factor — fronds droop when unhealthy
  const droop = (1 - h) * 15;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Pot */}
      <Path
        d="M22 52 L24 58 L40 58 L42 52 Z"
        fill={c.pot}
        stroke={c.potDark}
        strokeWidth={0.5}
      />
      <Ellipse cx={32} cy={52} rx={10} ry={2} fill={c.potDark} />
      <Ellipse cx={32} cy={52} rx={8} ry={1.2} fill={c.soil} />

      {/* Fronds radiating from center */}
      {Array.from({ length: frondCount }).map((_, i) => {
        // Spread fronds in a fan from -60° to +60°
        const angleRange = 120;
        const startAngle = -angleRange / 2;
        const angle = startAngle + (angleRange / (frondCount - 1 || 1)) * i;
        const rad = ((angle - 90) * Math.PI) / 180;

        // Frond length varies slightly
        const length = 22 + h * 8 + (i % 2) * 3;
        const droopRad = (droop * Math.PI) / 180;

        // Control points for the frond curve
        const endX = 32 + Math.cos(rad) * length;
        const endY = 48 + Math.sin(rad) * length + droop;
        const cpX = 32 + Math.cos(rad) * length * 0.5 + (angle > 0 ? 3 : -3);
        const cpY = 48 + Math.sin(rad) * length * 0.5 + droop * 0.3;

        // Leaflets along the frond
        const leafletCount = Math.max(2, Math.floor(h * 5) + 1);

        return (
          <G key={i}>
            {/* Main frond stem */}
            <Path
              d={`M32 48 Q${cpX} ${cpY}, ${endX} ${endY}`}
              fill="none"
              stroke={c.stem}
              strokeWidth={1.2}
              strokeLinecap="round"
            />

            {/* Leaflets */}
            {Array.from({ length: leafletCount }).map((_, j) => {
              const t = (j + 1) / (leafletCount + 1);
              // Point along bezier (approximate)
              const lx = 32 * (1 - t) * (1 - t) + cpX * 2 * t * (1 - t) + endX * t * t;
              const ly = 48 * (1 - t) * (1 - t) + cpY * 2 * t * (1 - t) + endY * t * t;

              const leafSize = (3 + h * 2) * (1 - t * 0.3);
              const leafAngle = angle + (j % 2 === 0 ? 40 : -40);

              return (
                <Ellipse
                  key={j}
                  cx={lx}
                  cy={ly}
                  rx={leafSize}
                  ry={leafSize * 0.35}
                  fill={j % 2 === 0 ? c.leaf : c.leafDark}
                  opacity={0.6 + h * 0.4}
                  rotation={leafAngle}
                  origin={`${lx}, ${ly}`}
                />
              );
            })}
          </G>
        );
      })}
    </Svg>
  );
}
