import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import GardenHeroIllustration from "@/components/GardenHeroIllustration";
import { useAuth } from "@/contexts/AuthContext";

/**
 * LoginScreen — minimal for now (Apple/Google removed).
 * Hero + tagline + dev-only "Continue" to get into the app.
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn("pramesh@relationshipgarden.dev", "devpassword123!");
    } catch (e: any) {
      const message = e?.message ?? "Create this user in Supabase Auth.";
      setError(message);
      Alert.alert(
        "Login failed",
        message + "\n\nSupabase Dashboard → Auth → Users → Add user:\npramesh@relationshipgarden.dev / devpassword123!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-garden-bg" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 32,
          paddingTop: 24,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center pt-4">
          <GardenHeroIllustration width={280} height={180} />
          <Text className="text-xl font-semibold text-garden-text text-center mt-8 leading-8">
            Treat your network like a garden.
          </Text>
          <Text className="text-base text-garden-muted text-center mt-3 leading-6">
            Water relationships to keep them alive.
          </Text>
        </View>

        <View className="gap-3">
          {error ? (
            <Text className="text-xs text-red-600 text-center">{error}</Text>
          ) : null}
          <Pressable
            onPress={handleDevLogin}
            disabled={loading}
            className="flex-row items-center justify-center h-12 rounded-xl bg-garden-primary active:opacity-90"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="leaf" size={20} color="#fff" />
                <Text className="text-white font-semibold text-base ml-2">
                  Continue
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
