import { View, Text, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PlantCard from "@/components/PlantCard";
import GardenHeader from "@/components/GardenHeader";
import { useGarden } from "@/hooks/useGarden";
import { useAuth } from "@/contexts/AuthContext";
import { daysSince } from "@/lib/decay";
import type { PlantData } from "@/types/garden";

/**
 * The Garden View — the core screen.
 *
 * A dense grid of plant cards. Size = priority. Color = health.
 * "Requires Attention" shelf at top (max 3).
 *
 * Design principle: "What's wilting?" should be answerable
 * in a single glance (perceptual task, not cognitive task).
 */
export default function GardenScreen() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { plants, loading, error, refresh, avgHealth, needsAttention, totalPlants } =
    useGarden();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handlePlantPress = useCallback(
    (plant: PlantData) => {
      router.push(`/contact/${plant.id}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: PlantData }) => (
      <PlantCard plant={item} onPress={() => handlePlantPress(item)} />
    ),
    [handlePlantPress]
  );

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg">
        <ActivityIndicator size="large" color="#2D5A3D" />
        <Text className="mt-3 text-garden-muted text-sm">
          Growing your garden...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg px-8">
        <Text className="text-garden-at-risk text-base font-medium mb-2">
          Something went wrong
        </Text>
        <Text className="text-garden-muted text-sm text-center mb-4">
          {error}
        </Text>
        <Pressable
          onPress={onRefresh}
          className="bg-garden-primary rounded-xl px-5 py-2.5"
        >
          <Text className="text-white text-sm font-medium">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state — first-time user with no contacts
  if (plants.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg px-8">
        <Ionicons name="leaf-outline" size={48} color="#2D5A3D" />
        <Text className="text-xl font-semibold text-garden-text mt-4 text-center">
          Plant your garden
        </Text>
        <Text className="text-sm text-garden-muted mt-2 text-center leading-5">
          Import contacts from your phone or LinkedIn to start growing relationships.
        </Text>
        <Pressable
          onPress={() => router.push("/import/contacts")}
          className="mt-6 bg-garden-primary rounded-xl px-6 py-3 flex-row items-center gap-2"
        >
          <Ionicons name="people-outline" size={16} color="#fff" />
          <Text className="text-white font-semibold">Import from Phone</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/import/csv")}
          className="mt-3 flex-row items-center gap-2"
        >
          <Ionicons name="document-text-outline" size={14} color="#2D5A3D" />
          <Text className="text-garden-primary font-medium text-sm">
            Import LinkedIn CSV
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-garden-bg">
      <GardenHeader
        totalPlants={totalPlants}
        avgHealth={avgHealth}
        needsAttention={needsAttention.length}
      />

      {/* "Requires Attention" shelf — max 3, capped to prevent guilt */}
      {needsAttention.length > 0 && (
        <View className="px-4 pb-2">
          <Text className="text-xs font-medium text-garden-at-risk uppercase tracking-wider mb-2">
            Needs Attention
          </Text>
          <View className="flex-row gap-2">
            {needsAttention.slice(0, 3).map((plant) => (
              <Pressable
                key={plant.id}
                onPress={() => handlePlantPress(plant)}
                className="flex-1 bg-white rounded-xl px-3 py-2.5 border border-garden-border"
              >
                <Text
                  className="text-sm font-medium text-garden-text"
                  numberOfLines={1}
                >
                  {plant.name}
                </Text>
                <Text className="text-xs text-garden-muted mt-0.5">
                  {daysSince(plant.lastInteractionAt)}d ago
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* The Garden Grid */}
      <FlashList
        data={plants}
        renderItem={renderItem}
        numColumns={3}
        estimatedItemSize={140}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D5A3D"
          />
        }
      />
    </View>
  );
}
