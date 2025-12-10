import "../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { AuthProvider } from "../lib/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <View className="flex-1">
        <StatusBar style="auto" />
        <Slot />
      </View>
    </AuthProvider>
  );
}
