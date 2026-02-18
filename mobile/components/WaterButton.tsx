import { useCallback, useState } from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PARTICLE_COUNT = 14;
const BURST_DURATION_MS = 550;
const SPRING_CONFIG = { damping: 10, stiffness: 200 };

interface WaterButtonProps {
  onWater: () => void | Promise<void>;
  label?: string;
  disabled?: boolean;
}

/**
 * The "Water" button — logs an interaction and resets health.
 *
 * Phase 1 "Juicy" spec:
 * - Scale down (0.95) on press, spring back on release.
 * - Water-droplet particles explode upward on success.
 * - Light haptic on press, Success (double-tap) when burst hits.
 * - "Watering..." loading state prevents double-taps.
 */
export default function WaterButton({
  onWater,
  label = "Check in",
  disabled = false,
}: WaterButtonProps) {
  const [isWatering, setIsWatering] = useState(false);
  const scale = useSharedValue(1);
  const burstProgress = useSharedValue(0);

  const triggerSuccessHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const runBurst = useCallback(() => {
    burstProgress.value = 0;
    triggerSuccessHaptic(); // Fire exactly when the "water" animation hits
    burstProgress.value = withTiming(1, { duration: BURST_DURATION_MS });
  }, [burstProgress, triggerSuccessHaptic]);

  const handlePressIn = useCallback(() => {
    if (disabled || isWatering) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, SPRING_CONFIG);
  }, [disabled, isWatering, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(async () => {
    if (disabled || isWatering) return;

    setIsWatering(true);
    try {
      const result = onWater();
      if (result instanceof Promise) {
        await result;
      }
      runBurst();
    } catch (_) {
      // Caller may show error; we just stop loading
    } finally {
      setIsWatering(false);
    }
  }, [disabled, isWatering, onWater, runBurst]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || isWatering;

  return (
    <View className="relative">
      {/* Particle burst — rendered above button, pointer-events none */}
      <View
        className="absolute inset-0 items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <WaterParticle key={i} index={i} burstProgress={burstProgress} />
        ))}
      </View>

      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled}
        style={[buttonAnimatedStyle]}
        className={`flex-row items-center justify-center px-5 py-3 rounded-xl min-w-[120px] ${
          isDisabled ? "bg-gray-200" : "bg-garden-primary"
        }`}
      >
        {isWatering ? (
          <>
            <ActivityIndicator size="small" color="#9B9B9B" />
            <Text className="ml-2 text-sm font-semibold text-garden-muted">
              Watering...
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="water-outline"
              size={18}
              color={isDisabled ? "#9B9B9B" : "#FFFFFF"}
            />
            <Text
              className={`ml-2 text-sm font-semibold ${
                isDisabled ? "text-garden-muted" : "text-white"
              }`}
            >
              {label}
            </Text>
          </>
        )}
      </AnimatedPressable>
    </View>
  );
}

/**
 * Single droplet in the burst. Explodes upward with slight horizontal spread.
 */
function WaterParticle({
  index,
  burstProgress,
}: {
  index: number;
  burstProgress: Animated.SharedValue<number>;
}) {
  const spreadX = (index % 7) - 3; // -3..3
  const spreadY = -45 - index * 4; // upward, staggered

  const animatedStyle = useAnimatedStyle(() => {
    const p = burstProgress.value;
    return {
      transform: [
        { translateX: p * spreadX * 14 },
        { translateY: p * spreadY },
        { scale: interpolate(p, [0, 1], [1, 0.25]) },
      ],
      opacity: interpolate(p, [0, 0.3, 1], [0, 1, 0]),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        },
        animatedStyle,
      ]}
    />
  );
}
