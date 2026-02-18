import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import GardenHeroIllustration from "@/components/GardenHeroIllustration";

/**
 * WelcomeScreen — shown after signup (new user).
 * CTA: "Plant your garden" -> Import Contacts.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-garden-bg" edges={["top", "bottom"]}>
      <View className="flex-1 px-8 pt-8 pb-8 justify-between">
        <View className="items-center pt-4">
          <View className="w-16 h-16 rounded-full bg-garden-primary/10 items-center justify-center mb-6">
            <Ionicons name="leaf" size={32} color="#2D5A3D" />
          </View>
          <Text className="text-2xl font-semibold text-garden-text text-center">
            Welcome to Relationship Garden
          </Text>
          <Text className="text-base text-garden-muted text-center mt-3 leading-6">
            Your garden is empty. Import your contacts to start growing.
          </Text>
          <GardenHeroIllustration width={240} height={140} />
        </View>

        <Pressable
          onPress={() => router.replace("/import/contacts")}
          className="flex-row items-center justify-center h-12 rounded-xl bg-garden-primary active:opacity-90"
        >
          <Ionicons name="people-outline" size={20} color="#fff" />
          <Text className="text-white font-semibold text-base ml-2">
            Plant your garden
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
