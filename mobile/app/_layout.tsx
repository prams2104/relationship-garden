import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { scheduleGardenNudge } from "@/lib/notifications";
import "../global.css";

/**
 * Root layout — wraps the entire app with auth + navigation.
 * Initializes push notifications on startup.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationBootstrap />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F8F6F1" },
          headerTintColor: "#2C2C2C",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#F8F6F1" },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="contact/[id]"
          options={{
            title: "Contact",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="import/contacts"
          options={{
            title: "Import Contacts",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="import/csv"
          options={{
            title: "Import LinkedIn CSV",
            presentation: "modal",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}

/**
 * Bootstraps notifications after auth is ready.
 * Requests permission and schedules the daily 8 AM nudge.
 */
function NotificationBootstrap() {
  const { user } = useAuth();
  useNotifications();

  useEffect(() => {
    if (user) {
      scheduleGardenNudge(user.id).catch(console.warn);
    }
  }, [user]);

  return null;
}
