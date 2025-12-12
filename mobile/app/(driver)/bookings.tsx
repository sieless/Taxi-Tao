import { SafeAreaView, ScrollView, Text } from "react-native";

export default function DriverBookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Bookings</Text>
        <Text className="text-gray-600">
          Driver bookings and assigned rides will show here. Connect to ride assignments to list active and past trips.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

