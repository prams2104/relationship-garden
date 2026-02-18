import { useEffect } from "react";
import Svg, { Path, Ellipse, Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TRANSITION_DURATION_MS = 400;

// Wilting: >0.8 vibrant green 0° 3 leaves; 0.5–0.8 olive 5°; <0.5 brown/yellow 15° 2 leaves
const VIBRANT_GREEN = "#4A7C59";
const OLIVE_GREEN = "#6B7C4A";
const BROWN_YELLOW = "#A68B5C";

export type PlantNodeTier = "fern" | "succulent" | "orchid";

interface PlantNodeProps {
  tier: PlantNodeTier;
  health: number;
  size?: number;
}

/**
 * PlantNode — procedural, data-driven plant visualization.
 *
 * Visuals respond to health with smooth transitions (withTiming):
 * - >0.8: Vibrant green, upright (0°), 3 leaves
 * - 0.5–0.8: Olive green, slight tilt (5°)
 * - <0.5: Brown/yellow, drooping (15°), 2 leaves (one fell off)
 *
 * Tiers: Fern (bushy, many small leaves), Succulent (thick round shapes),
 * Orchid (tall stem, single flower that fades when health is low).
 */
export default function PlantNode({
  tier,
  health,
  size = 64,
}: PlantNodeProps) {
  const clampedHealth = Math.max(0, Math.min(1, health));
  const animatedHealth = useSharedValue(clampedHealth);

  useEffect(() => {
    animatedHealth.value = withTiming(clampedHealth, {
      duration: TRANSITION_DURATION_MS,
    });
  }, [clampedHealth, animatedHealth]);

  const rotationDeg = useSharedValue(
    clampedHealth > 0.8 ? 0 : clampedHealth >= 0.5 ? 5 : 15
  );
  useEffect(() => {
    rotationDeg.value = withTiming(
      clampedHealth > 0.8 ? 0 : clampedHealth >= 0.5 ? 5 : 15,
      { duration: TRANSITION_DURATION_MS }
    );
  }, [clampedHealth, rotationDeg]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationDeg.value}deg` }],
  }));

  const leafFillProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      animatedHealth.value,
      [0, 0.5, 0.8, 1],
      [BROWN_YELLOW, OLIVE_GREEN, VIBRANT_GREEN, VIBRANT_GREEN]
    ),
  }));

  const stemStrokeProps = useAnimatedProps(() => ({
    stroke: interpolateColor(
      animatedHealth.value,
      [0, 0.5, 0.8, 1],
      ["#8B7355", "#6B7C4A", "#5B7A4A", "#4A7C59"]
    ),
  }));

  const flowerOpacityProps = useAnimatedProps(() => ({
    opacity: interpolate(
      animatedHealth.value,
      [0, 0.4, 0.7, 1],
      [0.1, 0.3, 0.7, 1]
    ),
  }));

  const thirdLeafAnimatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      animatedHealth.value,
      [0, 0.5, 0.8, 1],
      [BROWN_YELLOW, OLIVE_GREEN, VIBRANT_GREEN, VIBRANT_GREEN]
    ),
    opacity: interpolate(animatedHealth.value, [0, 0.5], [0, 1]),
  }));

  const potFill = "#C9B99A";
  const potStroke = "#B5A68A";
  const soilFill = "#6B5D4F";

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path
          d="M22 52 L24 58 L40 58 L42 52 Z"
          fill={potFill}
          stroke={potStroke}
          strokeWidth={0.5}
        />
        <Ellipse cx={32} cy={52} rx={10} ry={2} fill={potStroke} />
        <Ellipse cx={32} cy={52} rx={8} ry={1.2} fill={soilFill} />

        {tier === "fern" && (
          <FernBody
            leafFillProps={leafFillProps as Record<string, unknown>}
            stemStrokeProps={stemStrokeProps as Record<string, unknown>}
            thirdLeafAnimatedProps={thirdLeafAnimatedProps as Record<string, unknown>}
          />
        )}
        {tier === "succulent" && (
          <SucculentBody leafFillProps={leafFillProps as Record<string, unknown>} />
        )}
        {tier === "orchid" && (
          <OrchidBody
            stemStrokeProps={stemStrokeProps}
            flowerOpacityProps={flowerOpacityProps}
            leafFillProps={leafFillProps as Record<string, unknown>}
          />
        )}
      </Svg>
    </Animated.View>
  );
}

// --- Fern: bushy, many small leaves. Third leaf fades out when health < 0.5 ---
function FernBody({
  leafFillProps,
  stemStrokeProps,
  thirdLeafAnimatedProps,
}: {
  leafFillProps: Record<string, unknown>;
  stemStrokeProps: Record<string, unknown>;
  thirdLeafAnimatedProps: Record<string, unknown>;
}) {
  const angles = [-35, 0, 35];
  return (
    <G>
      {angles.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const len = 20;
        const ex = 32 + Math.cos(rad) * len;
        const ey = 48 + Math.sin(rad) * len;
        const isThird = i === 2;
        return (
          <G key={i}>
            <AnimatedPath
              d={`M32 48 Q${32 + Math.cos(rad) * 8} ${50}, ${ex} ${ey}`}
              fill="none"
              strokeWidth={1.2}
              strokeLinecap="round"
              {...stemStrokeProps}
            />
            <AnimatedEllipse
              cx={ex}
              cy={ey}
              rx={3.5}
              ry={2}
              rotation={angle}
              origin={`${ex}, ${ey}`}
              {...(isThird ? thirdLeafAnimatedProps : leafFillProps)}
            />
          </G>
        );
      })}
      {/* Extra small leaves for "bushy" look */}
      {[-20, 20].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const len = 12;
        const ex = 32 + Math.cos(rad) * len;
        const ey = 50 + Math.sin(rad) * len;
        return (
          <AnimatedEllipse
            key={`small-${i}`}
            cx={ex}
            cy={ey}
            rx={2.5}
            ry={1.5}
            origin={`${ex}, ${ey}`}
            rotation={angle}
            {...leafFillProps}
          />
        );
      })}
    </G>
  );
}

// --- Succulent: thick, round shapes (ellipses/circles) ---
function SucculentBody({
  leafFillProps,
}: {
  leafFillProps: Record<string, unknown>;
}) {
  const cx = 32;
  const cy = 38;
  const count = 10;

  return (
    <G>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const dist = 7;
        const lx = cx + Math.cos(rad) * dist;
        const ly = cy + Math.sin(rad) * dist * 0.8;
        return (
          <AnimatedEllipse
            key={i}
            cx={lx}
            cy={ly}
            rx={5}
            ry={3.5}
            rotation={angle + 90}
            origin={`${lx}, ${ly}`}
            {...leafFillProps}
          />
        );
      })}
      <AnimatedCircle cx={cx} cy={cy} r={3} {...leafFillProps} />
    </G>
  );
}

// --- Orchid: tall stem, single flower (flower fades when health low) ---
function OrchidBody({
  stemStrokeProps,
  flowerOpacityProps,
}: {
  stemStrokeProps: Record<string, unknown>;
  flowerOpacityProps: Record<string, unknown>;
  leafFillProps: Record<string, unknown>;
}) {
  const stemTopX = 30;
  const stemTopY = 14;
  const flowerX = 30;
  const flowerY = 18;

  return (
    <G>
      <AnimatedPath
        d={`M32 52 Q32 32, ${stemTopX} ${stemTopY}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        {...stemStrokeProps}
      />
      <Path
        d="M32 50 Q28 46, 26 48 Q28 44, 32 46"
        fill="#5B7A4A"
        opacity={0.8}
      />
      <Path
        d="M32 50 Q36 46, 38 48 Q36 44, 32 46"
        fill="#4A7C3D"
        opacity={0.8}
      />
      <G>
        {[0, 72, 144, 216, 288].map((a) => {
          const r = (a * Math.PI) / 180;
          const px = flowerX + Math.cos(r) * 4;
          const py = flowerY + Math.sin(r) * 4;
          return (
            <AnimatedEllipse
              key={a}
              cx={px}
              cy={py}
              rx={2.5}
              ry={1.8}
              fill="#E8D44D"
              rotation={a}
              origin={`${px}, ${py}`}
              {...flowerOpacityProps}
            />
          );
        })}
        <AnimatedCircle
          cx={flowerX}
          cy={flowerY}
          r={1.5}
          fill="#E8D44D"
          {...flowerOpacityProps}
        />
      </G>
    </G>
  );
}
