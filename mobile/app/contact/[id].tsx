import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useWater } from "@/hooks/useWater";
import { calculateHealth, classifyStatus, daysSince } from "@/lib/decay";
import PlantIllustration from "@/components/plants/PlantIllustration";
import type { Contact, InteractionType, HealthStatus } from "@/types/garden";

const STATUS_COLORS: Record<HealthStatus, string> = {
  thriving: "#4A7C59",
  cooling: "#C4A35A",
  at_risk: "#B86B4A",
  dormant: "#9B9B9B",
};

const INTERACTION_OPTIONS: { type: InteractionType; label: string; icon: string }[] = [
  { type: "text", label: "Text", icon: "chatbubble-outline" },
  { type: "call", label: "Call", icon: "call-outline" },
  { type: "email", label: "Email", icon: "mail-outline" },
  { type: "meeting", label: "Meeting", icon: "people-outline" },
  { type: "coffee", label: "Coffee", icon: "cafe-outline" },
  { type: "video_call", label: "Video", icon: "videocam-outline" },
];

/**
 * Contact Detail — the "Context Card" from the product spec.
 *
 * Shows:
 *   - Health status with animated indicator
 *   - Last interaction info ("She mentioned hiking in Patagonia")
 *   - Quick "water" actions (text, call, email, etc.)
 *   - Interaction history
 *
 * This is where "outreach guilt" turns into "I know exactly what to say."
 */
export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { water, watering } = useWater();

  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const healthAnim = useSharedValue(0);
  const waterScale = useSharedValue(1);

  useEffect(() => {
    fetchContact();
    fetchInteractions();
  }, [id]);

  async function fetchContact() {
    if (!id) return;
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Fetch contact error:", error);
      return;
    }
    setContact(data);

    const health = calculateHealth(data.last_interaction_at, data.decay_rate);
    healthAnim.value = withTiming(health, { duration: 800 });
    setLoading(false);
  }

  async function fetchInteractions() {
    if (!id) return;
    const { data } = await supabase
      .from("interactions")
      .select("*")
      .eq("contact_id", id)
      .order("happened_at", { ascending: false })
      .limit(10);

    setInteractions(data ?? []);
  }

  async function handleWater(type: InteractionType) {
    if (!contact || !user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    waterScale.value = withSequence(
      withSpring(0.9, { damping: 4, stiffness: 400 }),
      withSpring(1.05, { damping: 4, stiffness: 300 }),
      withSpring(1.0, { damping: 6, stiffness: 200 })
    );

    try {
      await water(contact.id, type);
      healthAnim.value = withTiming(1.0, { duration: 600 });
      await fetchContact();
      await fetchInteractions();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  const healthBarStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      healthAnim.value,
      [0, 0.1, 0.4, 0.7, 1.0],
      ["#9B9B9B", "#B86B4A", "#C4A35A", "#4A7C59", "#4A7C59"]
    );
    return {
      width: `${Math.min(healthAnim.value * 100, 100)}%`,
      backgroundColor,
    };
  });

  if (loading || !contact) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg">
        <Text className="text-garden-muted">Loading...</Text>
      </View>
    );
  }

  const health = calculateHealth(contact.last_interaction_at, contact.decay_rate);
  const status = classifyStatus(health);
  const days = daysSince(contact.last_interaction_at);

  return (
    <ScrollView className="flex-1 bg-garden-bg" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-5">
        <View className="flex-row items-start justify-between">
          {/* Plant illustration */}
          <View className="mr-4 items-center">
            <PlantIllustration
              tier={contact.tier}
              health={health}
              stage={contact.growth_stage}
              size={80}
            />
          </View>

          <View className="flex-1">
            <Text className="text-2xl font-semibold text-garden-text">
              {contact.name}
            </Text>
            {(contact.title || contact.company) && (
              <Text className="text-sm text-garden-muted mt-1">
                {[contact.title, contact.company].filter(Boolean).join(" at ")}
              </Text>
            )}
            <View className="flex-row items-center mt-2">
              <Text
                className="text-sm font-semibold capitalize"
                style={{ color: STATUS_COLORS[status] }}
              >
                {status === "at_risk" ? "At Risk" : status}
              </Text>
              <Text className="text-xs text-garden-muted ml-2">
                · {days === 0 ? "Today" : `${days}d ago`}
              </Text>
            </View>
          </View>
        </View>

        {/* Health bar */}
        <View className="mt-4 h-2.5 rounded-full bg-garden-border overflow-hidden">
          <Animated.View className="h-full rounded-full" style={healthBarStyle} />
        </View>

        {/* Meta row */}
        <View className="flex-row mt-3 gap-4">
          <View className="flex-row items-center">
            <Ionicons name="leaf-outline" size={14} color="#7A7A7A" />
            <Text className="text-xs text-garden-muted ml-1">
              {contact.tier} · {contact.growth_stage}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="pulse-outline" size={14} color="#7A7A7A" />
            <Text className="text-xs text-garden-muted ml-1">
              {contact.total_interactions} interactions
            </Text>
          </View>
        </View>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-3 gap-1.5">
            {contact.tags.map((tag) => (
              <View
                key={tag}
                className="bg-garden-border/50 rounded-full px-2.5 py-1"
              >
                <Text className="text-[10px] text-garden-muted">{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Context Note */}
      {contact.notes && (
        <View className="mx-5 mb-4 bg-white rounded-xl p-4 border border-garden-border">
          <Text className="text-xs font-medium text-garden-muted uppercase tracking-wider mb-2">
            Context Note
          </Text>
          <Text className="text-sm text-garden-text leading-5">
            {contact.notes}
          </Text>
        </View>
      )}

      {/* Quick Actions — "One-Tap Watering" */}
      <View className="mx-5 mb-4">
        <Text className="text-xs font-medium text-garden-muted uppercase tracking-wider mb-2">
          Check In
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {INTERACTION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.type}
              onPress={() => handleWater(opt.type)}
              disabled={watering}
              className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-garden-border"
              style={{ opacity: watering ? 0.5 : 1 }}
            >
              <Ionicons
                name={opt.icon as any}
                size={16}
                color="#2D5A3D"
              />
              <Text className="text-sm font-medium text-garden-primary ml-2">
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Interaction History */}
      <View className="mx-5">
        <Text className="text-xs font-medium text-garden-muted uppercase tracking-wider mb-2">
          Recent Activity
        </Text>
        {interactions.length === 0 ? (
          <View className="bg-white rounded-xl p-4 border border-garden-border">
            <Text className="text-sm text-garden-muted text-center">
              No interactions yet. Check in to start growing this relationship.
            </Text>
          </View>
        ) : (
          interactions.map((interaction, i) => (
            <View
              key={interaction.id}
              className="flex-row items-start bg-white rounded-xl p-3 border border-garden-border mb-1.5"
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#F0F0F0" }}
              >
                <Ionicons
                  name={getInteractionIcon(interaction.type)}
                  size={14}
                  color="#7A7A7A"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-garden-text capitalize">
                  {interaction.type.replace("_", " ")}
                </Text>
                {interaction.notes && (
                  <Text className="text-xs text-garden-muted mt-0.5" numberOfLines={2}>
                    {interaction.notes}
                  </Text>
                )}
                <Text className="text-[10px] text-garden-muted mt-1">
                  {daysSince(interaction.happened_at) === 0
                    ? "Today"
                    : `${daysSince(interaction.happened_at)}d ago`}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function getInteractionIcon(type: string): string {
  const icons: Record<string, string> = {
    text: "chatbubble-outline",
    call: "call-outline",
    email: "mail-outline",
    meeting: "people-outline",
    coffee: "cafe-outline",
    video_call: "videocam-outline",
    social_media: "logo-instagram",
    letter: "document-text-outline",
    gift: "gift-outline",
    other: "ellipsis-horizontal-outline",
  };
  return icons[type] ?? "ellipsis-horizontal-outline";
}
