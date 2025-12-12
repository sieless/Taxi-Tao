import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { MapPin, Navigation } from "lucide-react-native";
import { RideService } from "../lib/ride-service";
import { useAuth } from "../lib/auth-context";
import { LocationService } from "../lib/location-service";

interface RideRequestFormProps {
  currentLocation: { lat: number; lng: number } | null;
  onRideRequested: (rideId: string) => void;
  onCancel: () => void;
}

export default function RideRequestForm({ currentLocation, onRideRequested, onCancel }: RideRequestFormProps) {
  const { user, userProfile } = useAuth();
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestRide = async () => {
    if (!destination) {
      Alert.alert("Error", "Please enter a destination");
      return;
    }
    if (!currentLocation || !user || !userProfile) {
      Alert.alert("Error", "Location or user profile missing");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const pickupDate = now.toISOString().slice(0, 10);
      const pickupTime = now.toISOString().slice(11, 16);

      // Real geocoding
      const coords = await LocationService.geocodeAddress(destination);
      
      if (!coords) {
        Alert.alert("Location Not Found", "Could not find coordinates for that destination. Please try a more specific address.");
        setLoading(false);
        return;
      }

      const dropoff = {
        address: destination,
        lat: coords.lat,
        lng: coords.lng,
      };

      // Reverse geocode pickup if it's "Current Location"
      let pickupAddress = "Current Location";
      const resolvedPickup = await LocationService.reverseGeocode(currentLocation.lat, currentLocation.lng);
      if (resolvedPickup) pickupAddress = resolvedPickup;

      const rideId = await RideService.requestRide(
        user.uid,
        userProfile.name || "Customer",
        userProfile.phone || "",
        {
          address: pickupAddress,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        },
        dropoff,
        500, // Mock fare estimate
        { pickupDate, pickupTime, ttlMinutes: 30 }
      );

      onRideRequested(rideId);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-white p-6 rounded-t-3xl shadow-xl">
      <Text className="text-xl font-bold mb-6 text-center">Where to?</Text>

      <View className="space-y-4 mb-6">
        <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
          <MapPin size={20} color="#16a34a" />
          <Text className="ml-3 text-gray-700 font-medium">Current Location</Text>
        </View>

        <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
          <Navigation size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-900 font-medium"
            placeholder="Enter destination"
            value={destination}
            onChangeText={setDestination}
          />
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-gray-500">Est. Fare</Text>
        <Text className="text-xl font-bold text-gray-900">KSH 500</Text>
      </View>

      <TouchableOpacity
        onPress={handleRequestRide}
        disabled={loading}
        className="bg-green-600 py-4 rounded-xl items-center shadow-lg shadow-green-200 mb-3"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Confirm Request</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onCancel} className="py-3 items-center">
        <Text className="text-gray-500 font-medium">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
