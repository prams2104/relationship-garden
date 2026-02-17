import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { scheduleTestNudge } from "@/lib/notifications";

interface GardenHeaderProps {
  totalPlants: number;
  avgHealth: number;
  needsAttention: number;
}

/**
 * Garden dashboard header.
 *
 * Shows the "Garden Health" score prominently.
 * Design rule: ordinal labels, not fake-precision percentages.
 * "Garden Health: Good" not "Garden Health: 87/100".
 */
export default function GardenHeader({
  totalPlants,
  avgHealth,
  needsAttention,
}: GardenHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();

  const healthLabel =
    avgHealth >= 0.7
      ? "Flourishing"
      : avgHealth >= 0.4
        ? "Needs Care"
        : "Wilting";

  const healthColor =
    avgHealth >= 0.7
      ? "#4A7C59"
      : avgHealth >= 0.4
        ? "#C4A35A"
        : "#B86B4A";

  const handleTestNotification = async () => {
    if (user) {
      await scheduleTestNudge(user.id, 3);
    }
  };

  return (
    <View className="px-4 pt-4 pb-3">
      {/* Main health indicator */}
      <View className="flex-row items-baseline justify-between">
        <View>
          <Text className="text-2xl font-semibold text-garden-text">
            Your Garden
          </Text>
          <Text className="text-sm text-garden-muted mt-0.5">
            {totalPlants} relationships · {needsAttention} need attention
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/import/contacts")}
            className="w-8 h-8 rounded-full bg-garden-primary/10 items-center justify-center"
          >
            <Ionicons name="add" size={18} color="#2D5A3D" />
          </Pressable>
          <View className="items-end">
            <Text className="text-lg font-semibold" style={{ color: healthColor }}>
              {healthLabel}
            </Text>
            <Text className="text-xs text-garden-muted">
              {Math.round(avgHealth * 100)}% health
            </Text>
          </View>
        </View>
      </View>

      {/* Health bar */}
      <View className="mt-3 h-2 rounded-full bg-garden-border overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${avgHealth * 100}%`,
            backgroundColor: healthColor,
          }}
        />
      </View>

      {/* Test notification button (dev only) */}
      {__DEV__ && (
        <Pressable
          onPress={handleTestNotification}
          className="flex-row items-center justify-center mt-3 py-2 rounded-lg bg-garden-border/50"
        >
          <Ionicons name="notifications-outline" size={14} color="#7A7A7A" />
          <Text className="text-xs text-garden-muted ml-1.5">
            Test morning nudge (3s)
          </Text>
        </Pressable>
      )}
    </View>
  );
}
