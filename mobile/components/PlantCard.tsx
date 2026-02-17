import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { useEffect } from "react";
import PlantIllustration from "@/components/plants/PlantIllustration";
import type { PlantData } from "@/types/garden";

/**
 * PlantCard — the visual heart of the garden.
 *
 * Maps health_score (0.0→1.0) to visual properties:
 *   - SVG plant:  green/plump → amber/thin → grey/wilted
 *   - Opacity:    1.0 → 0.5 (fading as health drops)
 *   - Rotation:   0° → 8° tilt (leaning/wilting when health < 0.5)
 *   - Scale:      growth stage affects base size
 *   - Background: sage → amber → grey (desaturation)
 *
 * Visual Rule: if health < 0.5, the plant visually "leans" or desaturates.
 *
 * Design: Botanical SVG illustrations — NOT cartoons.
 * Think "Audubon Field Guide" meets "portfolio dashboard."
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STAGE_SCALE: Record<string, number> = {
  seed: 0.7,
  sprout: 0.8,
  sapling: 0.9,
  mature: 1.0,
  ancient: 1.05,
};

interface PlantCardProps {
  plant: PlantData;
  onPress?: () => void;
}

export default function PlantCard({ plant, onPress }: PlantCardProps) {
  const health = useSharedValue(plant.healthScore);

  useEffect(() => {
    health.value = withTiming(plant.healthScore, { duration: 800 });
  }, [plant.healthScore]);

  const wiltStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      health.value,
      [0, 0.3, 0.5, 1.0],
      [8, 5, 1, 0],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      health.value,
      [0, 0.2, 0.5, 1.0],
      [0.5, 0.65, 0.85, 1.0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      health.value,
      [0, 0.5, 1.0],
      [0.88, 0.95, 1.0],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { rotate: `${rotation}deg` },
        { scale: scale * (STAGE_SCALE[plant.growthStage] ?? 1) },
      ],
      opacity,
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      health.value,
      [0, 0.1, 0.4, 0.7, 1.0],
      ["#F2EFEB", "#F5EEDF", "#F5F0E0", "#EBF2E6", "#E3EDDC"]
    );

    return { backgroundColor };
  });

  const statusColor =
    plant.status === "thriving"
      ? "#4A7C59"
      : plant.status === "cooling"
        ? "#C4A35A"
        : plant.status === "at_risk"
          ? "#B86B4A"
          : "#9B9B9B";

  const daysSince = Math.floor(
    (Date.now() - new Date(plant.lastInteractionAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[bgStyle]}
      className="m-1.5 rounded-2xl p-2 border border-garden-border overflow-hidden"
    >
      {/* Botanical SVG illustration */}
      <Animated.View style={wiltStyle} className="items-center">
        <PlantIllustration
          tier={plant.tier}
          health={plant.healthScore}
          stage={plant.growthStage}
          size={60}
        />
      </Animated.View>

      {/* Name */}
      <Text
        className="text-xs font-medium text-garden-text text-center mt-1"
        numberOfLines={1}
      >
        {plant.name}
      </Text>

      {/* Status line */}
      <Text className="text-[10px] text-garden-muted text-center mt-0.5">
        {daysSince}d · {plant.tier}
      </Text>

      {/* Mini health bar */}
      <View className="mt-1.5 h-1 rounded-full bg-garden-border overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${plant.healthScore * 100}%`,
            backgroundColor: statusColor,
          }}
        />
      </View>
    </AnimatedPressable>
  );
}
