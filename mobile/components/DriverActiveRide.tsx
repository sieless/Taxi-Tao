import { View, Text, TouchableOpacity, Alert, Linking, Platform } from "react-native";
import { BookingRequest } from "../lib/types";
import { RideService } from "../lib/ride-service";
import { Navigation, Phone, MapPin, CheckCircle, Play, Flag } from "lucide-react-native";
import { useState } from "react";

interface DriverActiveRideProps {
  ride: BookingRequest;
  onRideComplete: () => void;
}

export default function DriverActiveRide({ ride, onRideComplete }: DriverActiveRideProps) {
  const [loading, setLoading] = useState(false);

  const openMaps = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${ride.pickupLat},${ride.pickupLng}`;
    const label = ride.pickupLocation;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
        Linking.openURL(url);
    }
  };

  const handleStatusUpdate = async (newStatus: 'arrived' | 'in_progress' | 'completed') => {
    setLoading(true);
    try {
      await RideService.updateRideStatus(ride.id, newStatus);
      if (newStatus === 'completed') {
        Alert.alert("Ride Completed", "Fare collected: KSH " + ride.fareEstimate);
        onRideComplete();
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to update status: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderActionButtons = () => {
    switch (ride.status) {
      case 'accepted':
        return (
          <TouchableOpacity 
            className="bg-blue-600 py-4 rounded-xl flex-row justify-center items-center mb-3"
            onPress={() => handleStatusUpdate('arrived')}
            disabled={loading}
          >
            <MapPin color="white" size={24} className="mr-2" />
            <Text className="text-white font-bold text-lg ml-2">I've Arrived</Text>
          </TouchableOpacity>
        );
      case 'arrived':
        return (
          <TouchableOpacity 
            className="bg-green-600 py-4 rounded-xl flex-row justify-center items-center mb-3"
            onPress={() => handleStatusUpdate('in_progress')}
            disabled={loading}
          >
            <Play color="white" size={24} className="mr-2" />
            <Text className="text-white font-bold text-lg ml-2">Start Trip</Text>
          </TouchableOpacity>
        );
      case 'in_progress':
        return (
          <TouchableOpacity 
            className="bg-red-600 py-4 rounded-xl flex-row justify-center items-center mb-3"
            onPress={() => handleStatusUpdate('completed')}
            disabled={loading}
          >
            <Flag color="white" size={24} className="mr-2" />
            <Text className="text-white font-bold text-lg ml-2">Complete Trip</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View className="bg-white p-6 rounded-t-3xl shadow-xl pb-10 border-t border-gray-100">
      {/* Header Info */}
      <View className="flex-row justify-between items-start mb-6">
        <View>
          <Text className="text-gray-500 text-sm mb-1">Customer</Text>
          <Text className="text-2xl font-bold text-gray-900">{ride.customerName}</Text>
          <TouchableOpacity 
            className="flex-row items-center mt-2 bg-gray-100 px-3 py-1 rounded-full self-start"
            onPress={() => Linking.openURL(`tel:${ride.customerPhone}`)}
          >
            <Phone size={14} color="black" />
            <Text className="ml-2 font-medium">{ride.customerPhone}</Text>
          </TouchableOpacity>
        </View>
        <View className="items-end">
          <Text className="text-gray-500 text-sm mb-1">Fare</Text>
          <Text className="text-xl font-bold text-green-600">KSH {ride.fareEstimate}</Text>
        </View>
      </View>

      {/* Route Info */}
      <View className="bg-gray-50 p-4 rounded-xl mb-6">
        <View className="flex-row items-center mb-3">
          <View className="w-8 items-center">
            <MapPin size={20} color="green" />
            <View className="h-4 w-0.5 bg-gray-300 my-1" />
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-xs text-gray-500 uppercase font-bold">Pickup</Text>
            <Text className="text-gray-900 font-medium" numberOfLines={1}>{ride.pickupLocation}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <View className="w-8 items-center">
            <MapPin size={20} color="red" />
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-xs text-gray-500 uppercase font-bold">Dropoff</Text>
            <Text className="text-gray-900 font-medium" numberOfLines={1}>{ride.destination}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View>
        <TouchableOpacity 
          className="bg-gray-100 py-3 rounded-xl flex-row justify-center items-center mb-3 border border-gray-200"
          onPress={openMaps}
        >
          <Navigation color="black" size={20} className="mr-2" />
          <Text className="text-gray-900 font-bold ml-2">Navigate</Text>
        </TouchableOpacity>
        
        {renderActionButtons()}
      </View>
    </View>
  );
}
