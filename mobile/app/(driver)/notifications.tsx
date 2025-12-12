import { SafeAreaView, ScrollView, Text } from "react-native";

export default function DriverNotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Notifications</Text>
        <Text className="text-gray-600">
          Driver notifications will be listed here. Wire this to your driverNotifications collection to show real-time updates.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

