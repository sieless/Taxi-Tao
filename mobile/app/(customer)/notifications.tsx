import { SafeAreaView, ScrollView, Text } from "react-native";

export default function CustomerNotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Notifications</Text>
        <Text className="text-gray-600">
          Customer notifications will be listed here. Connect to your notifications collection to render real data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

