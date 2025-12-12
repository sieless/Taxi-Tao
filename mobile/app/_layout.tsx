import "../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { AuthProvider } from "../lib/auth-context";
import ErrorBoundary from "../components/ErrorBoundary";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification Received:", notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification Response:", response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <View className="flex-1">
          <StatusBar style="auto" />
          <Slot />
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}
