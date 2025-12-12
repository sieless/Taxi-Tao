import { SafeAreaView, ScrollView, Text } from "react-native";

export default function DriverHelpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Help</Text>
        <Text className="text-gray-600">
          Driver FAQs, safety tips, and support contacts will be shown here. Link to your help center for full guidance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

