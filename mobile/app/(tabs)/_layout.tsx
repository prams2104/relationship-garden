import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

/**
 * Tab navigation — the two primary views:
 *   1. Garden (the grid of plants)
 *   2. Contacts (the list view)
 *
 * Design note: tab bar uses the Zen Garden palette.
 * Minimal chrome — the content is the interface.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2D5A3D",
        tabBarInactiveTintColor: "#9B9B9B",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E8E4DD",
          borderTopWidth: 0.5,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          letterSpacing: 0.3,
        },
        headerStyle: { backgroundColor: "#F8F6F1" },
        headerTintColor: "#2C2C2C",
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="garden"
        options={{
          title: "Garden",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
