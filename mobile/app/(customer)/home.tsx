import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "../../components/Map";
import RideRequestForm from "../../components/RideRequestForm";
import AnimatedEntry from "../../components/AnimatedEntry";
import { useAuth } from "../../lib/auth-context";
import { RideService } from "../../lib/ride-service";
import { LogOut, Menu } from "lucide-react-native";
import * as Location from "expo-location";

export default function CustomerHome() {
  const { logout, userProfile } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (activeRideId) {
      const unsubscribe = RideService.listenToRideStatus(activeRideId, (ride) => {
        setRideStatus(ride.status);
        if (ride.status === "accepted") {
          Alert.alert("Ride Accepted!", `${ride.driverName} is on the way!`);
        }
      });
      return () => unsubscribe();
    }
  }, [activeRideId]);

  return (
    <View className="flex-1">
      <Map />
      
      {/* Floating UI Elements */}
      <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-4" edges={['top']}>
        <TouchableOpacity className="bg-white p-3 rounded-full shadow-lg">
          <Menu size={24} color="black" />
        </TouchableOpacity>
        
        <View className="bg-white px-4 py-2 rounded-full shadow-lg">
          <Text className="font-bold">Hi, {userProfile?.name?.split(' ')[0]}</Text>
        </View>

        <TouchableOpacity onPress={logout} className="bg-white p-3 rounded-full shadow-lg">
          <LogOut size={24} color="red" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Action Sheet */}
      <AnimatedEntry className="absolute bottom-0 w-full" delay={300}>
        {activeRideId ? (
          <View className="bg-white p-6 rounded-t-3xl shadow-xl pb-10">
            <Text className="text-xl font-bold text-center mb-2">Ride Status</Text>
            <Text className="text-green-600 text-center text-lg font-bold capitalize mb-4">{rideStatus?.replace('_', ' ')}</Text>
            <Text className="text-gray-500 text-center">Waiting for driver...</Text>
          </View>
        ) : showRequestForm ? (
          <RideRequestForm 
            currentLocation={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null}
            onRideRequested={(id) => {
              setActiveRideId(id);
              setShowRequestForm(false);
            }}
            onCancel={() => setShowRequestForm(false)}
          />
        ) : (
          <View className="bg-white p-6 rounded-t-3xl shadow-xl pb-10">
            <Text className="text-xl font-bold mb-4">Where to?</Text>
            <TouchableOpacity 
              className="bg-gray-100 p-4 rounded-xl mb-4"
              onPress={() => setShowRequestForm(true)}
            >
              <Text className="text-gray-500 font-medium">Search destination</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-green-600 py-4 rounded-xl items-center"
              onPress={() => setShowRequestForm(true)}
            >
              <Text className="text-white font-bold text-lg">Request Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      </AnimatedEntry>
    </View>
  );
}
