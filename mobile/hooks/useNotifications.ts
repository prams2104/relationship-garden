import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useRouter } from "expo-router";

/**
 * Configure notification behavior — show even when app is foreground.
 * This lets the user see the nudge if they happen to have the app open.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * useNotifications — handles permissions, token registration,
 * and deep-link routing when the user taps a notification.
 *
 * Returns:
 *   - expoPushToken: for future server-side push
 *   - requestPermissions: manual trigger
 *   - hasPermission: current state
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const router = useRouter();

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) setExpoPushToken(token);
    });

    // Listen for incoming notifications while app is open
    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // Could update badge count or refresh garden here
      });

    // Handle tap on notification — deep link to the contact
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const contactId = response.notification.request.content.data?.contactId;
        if (contactId) {
          router.push(`/contact/${contactId}`);
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device");
      return null;
    }

    const { status: existing } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      setHasPermission(false);
      return null;
    }

    setHasPermission(true);

    // Get Expo push token (for server-side push later)
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "relationship-garden",
      });
      return tokenData.data;
    } catch {
      // Token registration may fail in Expo Go — that's OK,
      // local notifications still work
      return null;
    }
  }

  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === "granted");
    return status === "granted";
  }

  return { expoPushToken, hasPermission, requestPermissions };
}
