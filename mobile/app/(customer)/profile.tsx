import { SafeAreaView, ScrollView, Text } from "react-native";

export default function CustomerProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Profile</Text>
        <Text className="text-gray-600">
          Show customer profile details and saved payment/contact info here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

