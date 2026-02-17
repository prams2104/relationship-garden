import Svg, { Path, Ellipse, Circle, Rect, G } from "react-native-svg";
import { getPlantColors } from "./colors";

interface Props {
  size?: number;
  health: number;
  stage: string;
}

/**
 * Bonsai — for professional relationships (recruiters, investors).
 *
 * Structured trunk with layered canopy.
 * Healthy: full, rounded canopy layers.
 * Wilting: sparse canopy, exposed branches.
 */
export default function BonsaiPlant({ size = 64, health, stage }: Props) {
  const c = getPlantColors(health);
  const h = Math.max(0, Math.min(1, health));

  // Canopy layers based on growth stage
  const layers =
    stage === "ancient" ? 4 : stage === "mature" ? 3 : stage === "sapling" ? 2 : 1;

  const canopySize = 8 + h * 6;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Shallow bonsai pot */}
      <Rect
        x={18}
        y={54}
        width={28}
        height={5}
        rx={2}
        fill={c.pot}
        stroke={c.potDark}
        strokeWidth={0.5}
      />
      {/* Pot feet */}
      <Rect x={21} y={59} width={4} height={2} rx={1} fill={c.potDark} />
      <Rect x={39} y={59} width={4} height={2} rx={1} fill={c.potDark} />
      <Ellipse cx={32} cy={54.5} rx={12} ry={1.5} fill={c.soil} />

      {/* Trunk — thick, gnarled */}
      <Path
        d={`M32 54 Q30 46, 28 40 Q26 36, 30 32`}
        fill="none"
        stroke={h > 0.3 ? "#6B5D4F" : "#8C7E6E"}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Main branch right */}
      <Path
        d={`M29 38 Q34 34, 40 32`}
        fill="none"
        stroke={h > 0.3 ? "#6B5D4F" : "#8C7E6E"}
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      {/* Main branch left */}
      {layers > 1 && (
        <Path
          d={`M30 42 Q24 38, 20 36`}
          fill="none"
          stroke={h > 0.3 ? "#6B5D4F" : "#8C7E6E"}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}

      {/* Canopy — cloud-like clusters */}
      {/* Top cluster */}
      <G opacity={0.5 + h * 0.5}>
        <Ellipse
          cx={30}
          cy={28}
          rx={canopySize}
          ry={canopySize * 0.7}
          fill={c.leaf}
        />
        <Ellipse
          cx={27}
          cy={26}
          rx={canopySize * 0.7}
          ry={canopySize * 0.55}
          fill={c.leafDark}
        />
        <Ellipse
          cx={33}
          cy={26}
          rx={canopySize * 0.6}
          ry={canopySize * 0.5}
          fill={c.accent}
          opacity={0.4}
        />
      </G>

      {/* Right cluster */}
      <G opacity={0.5 + h * 0.5}>
        <Ellipse
          cx={40}
          cy={30}
          rx={canopySize * 0.75}
          ry={canopySize * 0.55}
          fill={c.leaf}
        />
        <Ellipse
          cx={42}
          cy={28}
          rx={canopySize * 0.5}
          ry={canopySize * 0.4}
          fill={c.accent}
          opacity={0.3}
        />
      </G>

      {/* Left cluster (if grown enough) */}
      {layers > 1 && (
        <G opacity={0.5 + h * 0.5}>
          <Ellipse
            cx={20}
            cy={34}
            rx={canopySize * 0.65}
            ry={canopySize * 0.5}
            fill={c.leafDark}
          />
          <Ellipse
            cx={18}
            cy={32}
            rx={canopySize * 0.45}
            ry={canopySize * 0.35}
            fill={c.leaf}
          />
        </G>
      )}

      {/* Extra top canopy for mature+ */}
      {layers > 2 && (
        <G opacity={0.4 + h * 0.5}>
          <Ellipse
            cx={30}
            cy={22}
            rx={canopySize * 0.55}
            ry={canopySize * 0.45}
            fill={c.accent}
            opacity={0.5}
          />
        </G>
      )}
    </Svg>
  );
}
