import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { RelationshipTier } from "@/types/garden";

const TIER_OPTIONS: { value: RelationshipTier; label: string; desc: string }[] = [
  { value: "orchid", label: "Orchid", desc: "Close — mentors, family" },
  { value: "fern", label: "Fern", desc: "Friends, peers" },
  { value: "bonsai", label: "Bonsai", desc: "Professional" },
  { value: "succulent", label: "Succulent", desc: "Casual, low-touch" },
];

const DEFAULT_DECAY_RATES: Record<RelationshipTier, number> = {
  orchid: 0.0495,
  fern: 0.0231,
  bonsai: 0.0116,
  succulent: 0.0077,
};

interface PhoneContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  birthday?: string;
  imageAvailable: boolean;
}

interface SelectedContact extends PhoneContact {
  tier: RelationshipTier;
}

/**
 * Contact Import Screen — onboarding flow.
 *
 * 1. Request permission to read phone contacts
 * 2. Show searchable list of device contacts
 * 3. User taps to select, picks a tier
 * 4. "Plant Garden" button imports selected contacts to Supabase
 *
 * Design: "Select your top 50 → Set tiers → Plant"
 * Per the product spec, this is the endowed progress moment:
 * "Your garden is already planted; you're maintaining, not starting."
 */
export default function ImportContactsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [selected, setSelected] = useState<Map<string, SelectedContact>>(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [defaultTier, setDefaultTier] = useState<RelationshipTier>("fern");
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    requestPermission();
    loadExistingContacts();
  }, []);

  async function loadExistingContacts() {
    if (!user) return;
    const { data } = await supabase
      .from("contacts")
      .select("name, email")
      .eq("user_id", user.id);
    if (data) {
      const names = new Set(data.map((c: any) => c.name?.toLowerCase()));
      setExistingNames(names);
    }
  }

  async function requestPermission() {
    const { status } = await Contacts.requestPermissionsAsync();
    setHasPermission(status === "granted");
    if (status === "granted") {
      loadContacts();
    }
  }

  async function loadContacts() {
    setLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.Birthday,
          Contacts.Fields.Image,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const mapped: PhoneContact[] = data
        .filter((c) => c.name && c.name.trim().length > 0)
        .map((c) => ({
          id: c.id ?? Math.random().toString(),
          name: c.name ?? "",
          email: c.emails?.[0]?.email ?? undefined,
          phone: c.phoneNumbers?.[0]?.number ?? undefined,
          company: c.company ?? undefined,
          title: c.jobTitle ?? undefined,
          birthday: c.birthday
            ? `${c.birthday.year ?? 2000}-${String(c.birthday.month ?? 1).padStart(2, "0")}-${String(c.birthday.day ?? 1).padStart(2, "0")}`
            : undefined,
          imageAvailable: c.imageAvailable ?? false,
        }));

      setPhoneContacts(mapped);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return phoneContacts;
    const q = search.toLowerCase();
    return phoneContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    );
  }, [search, phoneContacts]);

  const toggleSelect = useCallback(
    (contact: PhoneContact) => {
      Haptics.selectionAsync();
      setSelected((prev) => {
        const next = new Map(prev);
        if (next.has(contact.id)) {
          next.delete(contact.id);
        } else {
          next.set(contact.id, { ...contact, tier: defaultTier });
        }
        return next;
      });
    },
    [defaultTier]
  );

  const updateTier = useCallback((contactId: string, tier: RelationshipTier) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const existing = next.get(contactId);
      if (existing) {
        next.set(contactId, { ...existing, tier });
      }
      return next;
    });
  }, []);

  async function handleImport() {
    if (!user || selected.size === 0) return;

    setImporting(true);
    try {
      const contacts = Array.from(selected.values()).map((c) => ({
        user_id: user.id,
        name: c.name,
        email: c.email ?? null,
        phone: c.phone ?? null,
        company: c.company ?? null,
        title: c.title ?? null,
        birthday: c.birthday ?? null,
        tier: c.tier,
        decay_rate: DEFAULT_DECAY_RATES[c.tier],
        health_score: 1.0,
        last_interaction_at: new Date().toISOString(),
        total_interactions: 0,
        growth_stage: "seed",
        is_archived: false,
        is_favorite: false,
        tags: [],
      }));

      const { error } = await supabase.from("contacts").insert(contacts);

      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Garden planted!",
        `${contacts.length} contacts imported. Your garden is growing.`,
        [{ text: "View Garden", onPress: () => router.replace("/(tabs)/garden") }]
      );
    } catch (err: any) {
      Alert.alert("Import failed", err.message);
    } finally {
      setImporting(false);
    }
  }

  // Permission not yet granted
  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg px-8">
        <Ionicons name="people-outline" size={48} color="#9B9B9B" />
        <Text className="text-lg font-semibold text-garden-text mt-4 text-center">
          Access your contacts
        </Text>
        <Text className="text-sm text-garden-muted mt-2 text-center leading-5">
          We read your phone contacts to help you plant your garden.
          No data leaves your device until you choose to import.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="mt-6 bg-garden-primary rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Allow Access</Text>
        </Pressable>
      </View>
    );
  }

  if (loading || hasPermission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg">
        <ActivityIndicator size="large" color="#2D5A3D" />
        <Text className="mt-3 text-garden-muted text-sm">
          Reading contacts...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-garden-bg">
      {/* Header */}
      <View className="px-4 pt-3 pb-2 flex-row items-start justify-between">
        <View>
          <Text className="text-lg font-semibold text-garden-text">
            Select contacts to plant
          </Text>
          <Text className="text-xs text-garden-muted mt-1">
            {phoneContacts.length} on device · {selected.size} selected
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/import/csv")}
          className="flex-row items-center gap-1 bg-garden-border/50 rounded-lg px-2.5 py-1.5 mt-0.5"
        >
          <Ionicons name="document-text-outline" size={12} color="#7A7A7A" />
          <Text className="text-[10px] text-garden-muted font-medium">
            LinkedIn CSV
          </Text>
        </Pressable>
      </View>

      {/* Default tier picker */}
      <View className="px-4 pb-2">
        <Text className="text-xs text-garden-muted mb-1.5">
          Default tier for new selections:
        </Text>
        <View className="flex-row gap-1.5">
          {TIER_OPTIONS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setDefaultTier(t.value)}
              className={`flex-1 rounded-lg py-2 items-center border ${
                defaultTier === t.value
                  ? "bg-garden-primary border-garden-primary"
                  : "bg-white border-garden-border"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  defaultTier === t.value ? "text-white" : "text-garden-text"
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Search */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center bg-white rounded-xl border border-garden-border px-3 py-2">
          <Ionicons name="search-outline" size={16} color="#9B9B9B" />
          <TextInput
            className="flex-1 ml-2 text-sm text-garden-text"
            placeholder="Search by name, email, or company..."
            placeholderTextColor="#9B9B9B"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#9B9B9B" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Bulk actions */}
      <View className="flex-row items-center justify-between px-4 pb-2">
        <Pressable
          onPress={() => {
            if (selected.size === filtered.filter((c) => !existingNames.has(c.name.toLowerCase())).length) {
              setSelected(new Map());
            } else {
              const next = new Map(selected);
              filtered
                .filter((c) => !existingNames.has(c.name.toLowerCase()))
                .forEach((c) => {
                  if (!next.has(c.id)) {
                    next.set(c.id, { ...c, tier: defaultTier });
                  }
                });
              setSelected(next);
            }
          }}
        >
          <Text className="text-xs font-medium text-garden-primary">
            {selected.size > 0 &&
            selected.size === filtered.filter((c) => !existingNames.has(c.name.toLowerCase())).length
              ? "Deselect all"
              : "Select all visible"}
          </Text>
        </Pressable>
        {selected.size > 0 && (
          <Pressable onPress={() => setSelected(new Map())}>
            <Text className="text-xs text-garden-muted">
              Clear selection
            </Text>
          </Pressable>
        )}
      </View>

      {/* Contact list */}
      <FlashList
        data={filtered}
        estimatedItemSize={64}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const sel = selected.get(item.id);
          const alreadyImported = existingNames.has(item.name.toLowerCase());
          return (
            <ContactImportRow
              contact={item}
              selected={!!sel}
              tier={sel?.tier}
              alreadyImported={alreadyImported}
              onToggle={() => toggleSelect(item)}
              onTierChange={(tier) => updateTier(item.id, tier)}
            />
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Import button — sticky bottom */}
      {selected.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-garden-border px-4 py-3 pb-8">
          <Pressable
            onPress={handleImport}
            disabled={importing}
            className={`rounded-xl py-3.5 items-center ${
              importing ? "bg-gray-300" : "bg-garden-primary"
            }`}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Plant {selected.size} contact{selected.size > 1 ? "s" : ""}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ContactImportRow({
  contact,
  selected,
  tier,
  alreadyImported,
  onToggle,
  onTierChange,
}: {
  contact: PhoneContact;
  selected: boolean;
  tier?: RelationshipTier;
  alreadyImported: boolean;
  onToggle: () => void;
  onTierChange: (tier: RelationshipTier) => void;
}) {
  const [showTierPicker, setShowTierPicker] = useState(false);

  return (
    <View>
      <Pressable
        onPress={alreadyImported ? undefined : onToggle}
        className={`flex-row items-center px-4 py-3 mx-4 mb-0.5 rounded-lg border ${
          alreadyImported
            ? "bg-gray-100 border-gray-200 opacity-50"
            : selected
              ? "bg-garden-primary/5 border-garden-primary/30"
              : "bg-white border-garden-border"
        }`}
      >
        {/* Checkbox */}
        <View
          className={`w-5 h-5 rounded-md mr-3 items-center justify-center ${
            selected ? "bg-garden-primary" : "border border-garden-border"
          }`}
        >
          {selected && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>

        {/* Contact info */}
        <View className="flex-1">
          <Text className="text-sm font-medium text-garden-text">
            {contact.name}
          </Text>
          <Text className="text-xs text-garden-muted mt-0.5" numberOfLines={1}>
            {[contact.company, contact.email, contact.phone]
              .filter(Boolean)
              .join(" · ") || "No details"}
          </Text>
        </View>

        {/* Already imported badge */}
        {alreadyImported && (
          <View className="bg-garden-primary/10 rounded-full px-2.5 py-1">
            <Text className="text-[10px] text-garden-primary font-medium">
              In garden
            </Text>
          </View>
        )}

        {/* Tier badge (if selected) */}
        {selected && tier && !alreadyImported && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              setShowTierPicker(!showTierPicker);
            }}
            className="bg-garden-border/50 rounded-full px-2.5 py-1"
          >
            <Text className="text-[10px] text-garden-text font-medium">
              {tier}
            </Text>
          </Pressable>
        )}
      </Pressable>

      {/* Inline tier picker */}
      {selected && showTierPicker && (
        <View className="flex-row gap-1 mx-4 mb-1 px-8">
          {TIER_OPTIONS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => {
                onTierChange(t.value);
                setShowTierPicker(false);
              }}
              className={`flex-1 rounded py-1.5 items-center ${
                tier === t.value ? "bg-garden-primary" : "bg-garden-border/50"
              }`}
            >
              <Text
                className={`text-[10px] font-medium ${
                  tier === t.value ? "text-white" : "text-garden-muted"
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
