import { SafeAreaView, ScrollView, Text } from "react-native";

export default function DriverProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Profile</Text>
        <Text className="text-gray-600">
          Show driver identity, vehicle info, and verification status here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

