import { View, Text, Pressable, TextInput, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGarden } from "@/hooks/useGarden";
import { useAuth } from "@/contexts/AuthContext";
import { daysSince } from "@/lib/decay";
import type { PlantData, HealthStatus } from "@/types/garden";

const STATUS_COLORS: Record<HealthStatus, string> = {
  thriving: "#4A7C59",
  cooling: "#C4A35A",
  at_risk: "#B86B4A",
  dormant: "#9B9B9B",
};

/**
 * Contacts list — the "professional" view.
 *
 * A clean, dense list with health indicators.
 * This is the default for users who prefer list-first over garden-first.
 */
export default function ContactsScreen() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { plants, loading, refresh } = useGarden();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return plants;
    const q = search.toLowerCase();
    return plants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [search, plants]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg">
        <Text className="text-garden-muted text-sm">Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-garden-bg">
      {/* Search bar + import button */}
      <View className="px-4 pt-2 pb-3 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-white rounded-xl border border-garden-border px-3 py-2.5">
          <Ionicons name="search-outline" size={18} color="#9B9B9B" />
          <TextInput
            className="flex-1 ml-2 text-sm text-garden-text"
            placeholder="Search contacts or tags..."
            placeholderTextColor="#9B9B9B"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9B9B9B" />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => router.push("/import/contacts")}
          className="w-10 h-10 rounded-xl bg-garden-primary/10 items-center justify-center"
        >
          <Ionicons name="person-add-outline" size={18} color="#2D5A3D" />
        </Pressable>
      </View>

      <FlashList
        data={filtered}
        estimatedItemSize={72}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactRow
            plant={item}
            onPress={() => router.push(`/contact/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D5A3D"
          />
        }
        ListEmptyComponent={
          <View className="items-center pt-12">
            <Text className="text-garden-muted text-sm">
              {search ? "No matches found." : "No contacts yet."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ContactRow({
  plant,
  onPress,
}: {
  plant: PlantData;
  onPress: () => void;
}) {
  const days = daysSince(plant.lastInteractionAt);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-garden-border bg-white mx-4 mb-0.5 rounded-lg"
    >
      {/* Health dot */}
      <View
        className="w-3 h-3 rounded-full mr-3"
        style={{ backgroundColor: STATUS_COLORS[plant.status] }}
      />

      {/* Name + meta */}
      <View className="flex-1">
        <Text className="text-sm font-medium text-garden-text">
          {plant.name}
        </Text>
        <Text className="text-xs text-garden-muted mt-0.5">
          {plant.tier} · {days}d ago · {plant.totalInteractions} interactions
        </Text>
      </View>

      {/* Health bar (mini) */}
      <View className="w-12 h-1.5 rounded-full bg-gray-200 overflow-hidden mr-2">
        <View
          className="h-full rounded-full"
          style={{
            width: `${plant.healthScore * 100}%`,
            backgroundColor: STATUS_COLORS[plant.status],
          }}
        />
      </View>

      <Ionicons name="chevron-forward" size={16} color="#9B9B9B" />
    </Pressable>
  );
}
