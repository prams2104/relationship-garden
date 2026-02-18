import { Stack } from "expo-router";

/**
 * Auth flow layout — no tab bar, minimal chrome.
 * Screens: login, welcome.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8F6F1" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="callback" options={{ headerShown: false }} />
    </Stack>
  );
}
