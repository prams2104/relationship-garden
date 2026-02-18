import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

/**
 * OAuth callback — app opens here after redirect from Apple/Google.
 * Parses tokens from URL, sets session, then redirects to app root.
 */
function parseSessionFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.hash?.slice(1) || parsed.search);
  return {
    access_token: params.get("access_token") ?? undefined,
    refresh_token: params.get("refresh_token") ?? undefined,
  };
}

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const url = await Linking.getInitialURL();
      if (cancelled || !url) {
        if (!cancelled) router.replace("/(auth)/login");
        return;
      }

      const { access_token, refresh_token } = parseSessionFromUrl(url);
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }

      if (!cancelled) {
        router.replace("/");
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-garden-bg">
      <ActivityIndicator size="large" color="#2D5A3D" />
      <Text className="mt-4 text-garden-muted text-sm">Completing sign in...</Text>
    </View>
  );
}
