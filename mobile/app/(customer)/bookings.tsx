import { View, Text, SafeAreaView, ScrollView } from "react-native";

export default function CustomerBookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">My Bookings</Text>
        <Text className="text-gray-600">
          Booking history will appear here. Hook this to your booking service to show upcoming and past rides.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

