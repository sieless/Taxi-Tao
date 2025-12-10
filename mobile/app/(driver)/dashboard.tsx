import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "../../components/Map";
import AnimatedEntry from "../../components/AnimatedEntry";
import { useAuth } from "../../lib/auth-context";
import { RideService } from "../../lib/ride-service";
import { BookingRequest } from "../../lib/types";
import { LogOut, User, MapPin } from "lucide-react-native";
import { useState, useEffect } from "react";

export default function DriverDashboard() {
  const { logout, driverProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<BookingRequest[]>([]);

  useEffect(() => {
    let unsubscribe: () => void;
    if (isOnline) {
      unsubscribe = RideService.listenForAvailableRides((rides) => {
        setAvailableRides(rides);
      });
    } else {
      setAvailableRides([]);
    }
    return () => unsubscribe && unsubscribe();
  }, [isOnline]);

  const handleAcceptRide = async (ride: BookingRequest) => {
    if (!driverProfile) return;
    try {
      await RideService.acceptRide(
        ride.id, 
        driverProfile.id, 
        driverProfile.name, 
        driverProfile.phone
      );
      Alert.alert("Success", "You have accepted the ride!");
      // In a real app, we would navigate to a "Ride in Progress" screen here
    } catch (error: any) {
      Alert.alert("Error", "Failed to accept ride: " + error.message);
    }
  };

  return (
    <View className="flex-1">
      <Map showUserLocation={true} />
      
      {/* Top Bar */}
      <SafeAreaView className="absolute top-0 w-full bg-white/90 p-4 flex-row justify-between items-center shadow-sm" edges={['top']}>
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3">
            <User size={20} color="gray" />
          </View>
          <View>
            <Text className="font-bold text-lg">{driverProfile?.name || "Driver"}</Text>
            <Text className="text-gray-500 text-xs">{isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
           <Switch
            trackColor={{ false: "#767577", true: "#16a34a" }}
            thumbColor={isOnline ? "#f4f3f4" : "#f4f3f4"}
            onValueChange={() => setIsOnline(!isOnline)}
            value={isOnline}
          />
          <TouchableOpacity onPress={logout} className="ml-4">
            <LogOut size={24} color="red" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom Status Panel / Ride Requests */}
      <AnimatedEntry className="absolute bottom-0 w-full bg-white shadow-xl border-t border-gray-100 max-h-[50%]" delay={300}>
        {isOnline && availableRides.length > 0 ? (
          <View className="p-4 pb-10">
            <Text className="font-bold text-lg mb-3">Available Rides ({availableRides.length})</Text>
            <ScrollView>
              {availableRides.map((ride) => (
                <View key={ride.id} className="bg-gray-50 p-4 rounded-xl mb-3 border border-gray-200">
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-bold text-gray-800">{ride.customerName}</Text>
                    <Text className="font-bold text-green-600">KSH {ride.fareEstimate}</Text>
                  </View>
                  
                  <View className="flex-row items-center mb-1">
                    <MapPin size={14} color="green" />
                    <Text className="text-gray-600 text-xs ml-2" numberOfLines={1}>{ride.pickupLocation}</Text>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <MapPin size={14} color="red" />
                    <Text className="text-gray-600 text-xs ml-2" numberOfLines={1}>{ride.destination}</Text>
                  </View>

                  <TouchableOpacity 
                    className="bg-green-600 py-3 rounded-lg items-center"
                    onPress={() => handleAcceptRide(ride)}
                  >
                    <Text className="text-white font-bold">Accept Ride</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="p-6 pb-10">
            <View className="flex-row justify-between mb-4">
              <View className="items-center">
                <Text className="text-2xl font-bold">0</Text>
                <Text className="text-gray-500 text-xs">Rides</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold">0.0</Text>
                <Text className="text-gray-500 text-xs">Hours</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold">KSH 0</Text>
                <Text className="text-gray-500 text-xs">Earnings</Text>
              </View>
            </View>
            
            {!isOnline && (
              <View className="bg-gray-100 p-3 rounded-lg items-center">
                <Text className="text-gray-600">Go Online to start receiving rides</Text>
              </View>
            )}
            {isOnline && availableRides.length === 0 && (
              <View className="bg-green-50 p-3 rounded-lg items-center">
                <ActivityIndicator color="green" className="mb-2" />
                <Text className="text-green-800">Searching for rides...</Text>
              </View>
            )}
          </View>
        )}
      </AnimatedEntry>
    </View>
  );
}
