import { SafeAreaView, ScrollView, Text } from "react-native";

export default function CustomerHelpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Help</Text>
        <Text className="text-gray-600">
          FAQs and support contact information will appear here. Link to your web help center or embed guidance directly.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

