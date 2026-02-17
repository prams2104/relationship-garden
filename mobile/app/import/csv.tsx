import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { parseContactsCSV, type ParsedContact } from "@/lib/csv-parser";
import type { RelationshipTier } from "@/types/garden";

const TIER_OPTIONS: { value: RelationshipTier; label: string }[] = [
  { value: "orchid", label: "Orchid" },
  { value: "fern", label: "Fern" },
  { value: "bonsai", label: "Bonsai" },
  { value: "succulent", label: "Succulent" },
];

const DEFAULT_DECAY_RATES: Record<RelationshipTier, number> = {
  orchid: 0.0495,
  fern: 0.0231,
  bonsai: 0.0116,
  succulent: 0.0077,
};

type Step = "pick" | "preview" | "importing" | "done";

/**
 * CSV Import Screen — LinkedIn Connections export.
 *
 * Flow:
 * 1. Instructions on how to export from LinkedIn
 * 2. Pick CSV file via document picker
 * 3. Preview parsed contacts — user can deselect / change tiers
 * 4. Import to Supabase
 */
export default function CSVImportScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("pick");
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [deselected, setDeselected] = useState<Set<number>>(new Set());
  const [tierOverrides, setTierOverrides] = useState<Map<number, RelationshipTier>>(new Map());
  const [stats, setStats] = useState({ totalRows: 0, skipped: 0 });
  const [importedCount, setImportedCount] = useState(0);

  const selectedContacts = useMemo(
    () => parsed.filter((_, i) => !deselected.has(i)),
    [parsed, deselected]
  );

  const toggleContact = useCallback((index: number) => {
    Haptics.selectionAsync();
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const cycleTier = useCallback((index: number) => {
    setTierOverrides((prev) => {
      const next = new Map(prev);
      const current = next.get(index) ?? parsed[index]?.suggestedTier ?? "bonsai";
      const tiers: RelationshipTier[] = ["orchid", "fern", "bonsai", "succulent"];
      const nextTier = tiers[(tiers.indexOf(current) + 1) % tiers.length];
      next.set(index, nextTier);
      return next;
    });
  }, [parsed]);

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];

      // Validate file extension
      const ext = file.name?.toLowerCase().split(".").pop();
      if (ext !== "csv") {
        Alert.alert("Wrong file type", "Please select a .csv file.");
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const { contacts, totalRows, skipped } = parseContactsCSV(content);

      if (contacts.length === 0) {
        Alert.alert(
          "No contacts found",
          "The CSV file didn't contain any parseable contacts. Make sure it has columns like 'First Name', 'Last Name', 'Email Address', etc."
        );
        return;
      }

      setParsed(contacts);
      setStats({ totalRows, skipped });
      setDeselected(new Set());
      setTierOverrides(new Map());
      setStep("preview");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  async function handleImport() {
    if (!user || selectedContacts.length === 0) return;

    setStep("importing");

    try {
      // Fetch existing contacts for dedup
      const { data: existing } = await supabase
        .from("contacts")
        .select("name, email")
        .eq("user_id", user.id);

      const existingNames = new Set(
        (existing ?? []).map((c: any) => c.name?.toLowerCase())
      );

      const toImport = parsed
        .map((c, i) => ({ ...c, _index: i }))
        .filter((c, i) => !deselected.has(i))
        .filter((c) => !existingNames.has(c.name.toLowerCase()));

      if (toImport.length === 0) {
        Alert.alert(
          "All duplicates",
          "Every selected contact is already in your garden."
        );
        setStep("preview");
        return;
      }

      const rows = toImport.map((c) => {
        const tier = tierOverrides.get(c._index) ?? c.suggestedTier;
        return {
          user_id: user.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          company: c.company,
          title: c.title,
          tier,
          decay_rate: DEFAULT_DECAY_RATES[tier],
          health_score: 1.0,
          last_interaction_at: c.connectedOn ?? new Date().toISOString(),
          total_interactions: 0,
          growth_stage: "seed" as const,
          is_archived: false,
          is_favorite: false,
          tags: ["linkedin"],
          notes: c.linkedinUrl ? `LinkedIn: ${c.linkedinUrl}` : null,
        };
      });

      // Batch insert in chunks of 50 (Supabase limit safety)
      const BATCH = 50;
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const { error } = await supabase.from("contacts").insert(chunk);
        if (error) throw error;
      }

      setImportedCount(rows.length);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("done");
    } catch (err: any) {
      Alert.alert("Import failed", err.message);
      setStep("preview");
    }
  }

  // Step 1: Pick file — with LinkedIn instructions
  if (step === "pick") {
    return (
      <ScrollView className="flex-1 bg-garden-bg" contentContainerStyle={{ padding: 24 }}>
        <Ionicons
          name="document-text-outline"
          size={40}
          color="#2D5A3D"
          style={{ alignSelf: "center" }}
        />
        <Text className="text-xl font-semibold text-garden-text text-center mt-4">
          Import from LinkedIn
        </Text>
        <Text className="text-sm text-garden-muted text-center mt-2 leading-5">
          Export your LinkedIn connections as a CSV, then import them here.
        </Text>

        {/* Instructions */}
        <View className="mt-6 bg-white rounded-2xl border border-garden-border p-4">
          <Text className="text-sm font-semibold text-garden-text mb-3">
            How to export from LinkedIn:
          </Text>

          {[
            "Go to linkedin.com/mypreferences/d/download-my-data",
            'Select "Connections" only',
            'Tap "Request archive"',
            "Wait for the email (usually ~10 min)",
            "Download the ZIP, find Connections.csv",
            "Come back here and pick the file",
          ].map((text, i) => (
            <View key={i} className="flex-row mb-2.5">
              <View className="w-5 h-5 rounded-full bg-garden-primary/10 items-center justify-center mr-3 mt-0.5">
                <Text className="text-[10px] font-semibold text-garden-primary">
                  {i + 1}
                </Text>
              </View>
              <Text className="flex-1 text-sm text-garden-text leading-5">
                {text}
              </Text>
            </View>
          ))}
        </View>

        {/* Also supports generic CSV */}
        <Text className="text-xs text-garden-muted text-center mt-4 leading-4">
          Also supports any CSV with columns: Name (or First Name + Last Name),
          Email, Company, Title/Position.
        </Text>

        <Pressable
          onPress={pickFile}
          className="mt-6 bg-garden-primary rounded-xl py-3.5 items-center flex-row justify-center gap-2"
        >
          <Ionicons name="folder-open-outline" size={18} color="#fff" />
          <Text className="text-white font-semibold text-base">
            Choose CSV File
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Step 3: Importing
  if (step === "importing") {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg">
        <ActivityIndicator size="large" color="#2D5A3D" />
        <Text className="mt-4 text-garden-text font-medium">
          Planting {selectedContacts.length} contacts...
        </Text>
        <Text className="mt-1 text-xs text-garden-muted">
          This may take a moment
        </Text>
      </View>
    );
  }

  // Step 4: Done
  if (step === "done") {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg px-8">
        <View className="w-16 h-16 rounded-full bg-garden-primary/10 items-center justify-center mb-4">
          <Ionicons name="checkmark-circle" size={40} color="#2D5A3D" />
        </View>
        <Text className="text-xl font-semibold text-garden-text text-center">
          Garden expanded!
        </Text>
        <Text className="text-sm text-garden-muted text-center mt-2 leading-5">
          {importedCount} LinkedIn connection{importedCount !== 1 ? "s" : ""}{" "}
          imported and tagged.
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/garden")}
          className="mt-6 bg-garden-primary rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">View Garden</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setParsed([]);
            setStep("pick");
          }}
          className="mt-3"
        >
          <Text className="text-garden-primary text-sm font-medium">
            Import another file
          </Text>
        </Pressable>
      </View>
    );
  }

  // Step 2: Preview parsed contacts
  return (
    <View className="flex-1 bg-garden-bg">
      {/* Stats header */}
      <View className="px-4 pt-3 pb-2">
        <Text className="text-lg font-semibold text-garden-text">
          Preview import
        </Text>
        <Text className="text-xs text-garden-muted mt-1">
          {stats.totalRows} rows parsed · {parsed.length} valid ·{" "}
          {stats.skipped} skipped · {selectedContacts.length} selected
        </Text>
      </View>

      {/* Tier legend */}
      <View className="flex-row gap-2 px-4 pb-2">
        {TIER_OPTIONS.map((t) => (
          <View key={t.value} className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-1"
              style={{
                backgroundColor:
                  t.value === "orchid"
                    ? "#9B59B6"
                    : t.value === "fern"
                      ? "#4A7C59"
                      : t.value === "bonsai"
                        ? "#8B6914"
                        : "#9B9B9B",
              }}
            />
            <Text className="text-[10px] text-garden-muted">{t.label}</Text>
          </View>
        ))}
        <Text className="text-[10px] text-garden-muted ml-auto">
          Tap tier to change
        </Text>
      </View>

      {/* Contact list */}
      <FlashList
        data={parsed}
        estimatedItemSize={60}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => {
          const isDeselected = deselected.has(index);
          const tier = tierOverrides.get(index) ?? item.suggestedTier;
          return (
            <Pressable
              onPress={() => toggleContact(index)}
              className={`flex-row items-center px-4 py-3 mx-4 mb-0.5 rounded-lg border ${
                isDeselected
                  ? "bg-gray-100 border-gray-200 opacity-40"
                  : "bg-white border-garden-border"
              }`}
            >
              {/* Checkbox */}
              <View
                className={`w-5 h-5 rounded-md mr-3 items-center justify-center ${
                  !isDeselected ? "bg-garden-primary" : "border border-garden-border"
                }`}
              >
                {!isDeselected && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="text-sm font-medium text-garden-text" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-garden-muted mt-0.5" numberOfLines={1}>
                  {[item.company, item.title, item.email]
                    .filter(Boolean)
                    .join(" · ") || "No details"}
                </Text>
              </View>

              {/* Tier badge — tap to cycle */}
              {!isDeselected && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    cycleTier(index);
                  }}
                  className="rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor:
                      tier === "orchid"
                        ? "#9B59B620"
                        : tier === "fern"
                          ? "#4A7C5920"
                          : tier === "bonsai"
                            ? "#8B691420"
                            : "#9B9B9B20",
                  }}
                >
                  <Text
                    className="text-[10px] font-medium"
                    style={{
                      color:
                        tier === "orchid"
                          ? "#9B59B6"
                          : tier === "fern"
                            ? "#4A7C59"
                            : tier === "bonsai"
                              ? "#8B6914"
                              : "#9B9B9B",
                    }}
                  >
                    {tier}
                  </Text>
                </Pressable>
              )}
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Import button — sticky bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-garden-border px-4 py-3 pb-8">
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => {
              setParsed([]);
              setStep("pick");
            }}
            className="flex-1 rounded-xl py-3 items-center border border-garden-border"
          >
            <Text className="text-garden-text font-medium text-sm">Back</Text>
          </Pressable>
          <Pressable
            onPress={handleImport}
            disabled={selectedContacts.length === 0}
            className={`flex-[2] rounded-xl py-3 items-center ${
              selectedContacts.length === 0 ? "bg-gray-300" : "bg-garden-primary"
            }`}
          >
            <Text className="text-white font-semibold text-sm">
              Plant {selectedContacts.length} contact
              {selectedContacts.length !== 1 ? "s" : ""}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
