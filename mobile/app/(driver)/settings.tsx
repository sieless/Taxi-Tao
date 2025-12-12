import { SafeAreaView, ScrollView, Text } from "react-native";

export default function DriverSettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Settings</Text>
        <Text className="text-gray-600">
          Configure availability, payout details, and notification preferences here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

