import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * Root index — routes based on auth and onboarding state.
 *
 * - Not authenticated -> (auth)/login
 * - New user (no contacts) -> (auth)/welcome (then they go to import)
 * - Returning user -> (tabs)/garden
 */
export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [hasContacts, setHasContacts] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setHasContacts(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        if (!cancelled) setHasContacts((count ?? 0) > 0);
      })
      .catch(() => {
        if (!cancelled) setHasContacts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg">
        <ActivityIndicator size="large" color="#2D5A3D" />
        <Text className="mt-3 text-garden-muted text-sm">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (hasContacts === null) {
    return (
      <View className="flex-1 items-center justify-center bg-garden-bg">
        <ActivityIndicator size="large" color="#2D5A3D" />
      </View>
    );
  }

  if (!hasContacts) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Redirect href="/(tabs)/garden" />;
}
