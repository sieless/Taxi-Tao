import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl font-bold text-green-600 mb-2">TaxiTao</Text>
      <Text className="text-gray-500 mb-8">Mobile App</Text>
      
      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="bg-green-600 px-8 py-3 rounded-full">
          <Text className="text-white font-bold text-lg">Get Started</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}
