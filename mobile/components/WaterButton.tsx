import { Pressable, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface WaterButtonProps {
  onWater: () => void;
  label?: string;
  disabled?: boolean;
}

/**
 * The "Water" button — logs an interaction and resets health.
 *
 * Includes haptic feedback (expo-haptics) for tactile satisfaction.
 * Animated: scale bounce on press for satisfying micro-interaction.
 *
 * Terminology note: The button says "Check in" (professional) —
 * the internal concept of "watering" stays in the codebase only.
 */
export default function WaterButton({
  onWater,
  label = "Check in",
  disabled = false,
}: WaterButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (disabled) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Bounce animation
    scale.value = withSequence(
      withSpring(0.9, { damping: 4, stiffness: 400 }),
      withSpring(1.05, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    onWater();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[animatedStyle]}
      className={`flex-row items-center justify-center px-5 py-3 rounded-xl ${
        disabled ? "bg-gray-200" : "bg-garden-primary"
      }`}
    >
      <Ionicons
        name="water-outline"
        size={18}
        color={disabled ? "#9B9B9B" : "#FFFFFF"}
      />
      <Text
        className={`ml-2 text-sm font-semibold ${
          disabled ? "text-garden-muted" : "text-white"
        }`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
