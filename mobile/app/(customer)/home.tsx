import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "../../components/Map";
import RideRequestForm from "../../components/RideRequestForm";
import AnimatedEntry from "../../components/AnimatedEntry";
import { useAuth } from "../../lib/auth-context";
import { RideService } from "../../lib/ride-service";
import { LogOut, Menu, Bell, User, Settings, HelpCircle, Phone } from "lucide-react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function CustomerHome() {
  const { logout, userProfile, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user profile
      await refreshUserProfile();
      
      // Refresh location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1">
      <Map />
      
      {/* Floating UI Elements */}
      <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-4" edges={['top']}>
        <TouchableOpacity className="bg-white p-3 rounded-full shadow-lg" onPress={() => setIsMenuOpen(true)}>
          <Menu size={24} color="black" />
        </TouchableOpacity>
        
        <View className="bg-white px-4 py-2 rounded-full shadow-lg">
          <Text className="font-bold">Hi, {userProfile?.name?.split(' ')[0]}</Text>
        </View>

        <TouchableOpacity onPress={logout} className="bg-white p-3 rounded-full shadow-lg">
          <LogOut size={24} color="red" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Lightweight menu overlay */}
      {isMenuOpen && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/40">
          <View className="absolute top-12 left-4 right-4 bg-white rounded-2xl p-4 shadow-xl">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-900">Menu</Text>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
                <Text className="text-green-600 font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
            <View className="space-y-3">
              {[
                { label: "Dashboard", icon: Menu, path: "/(customer)/home" },
                { label: "Bookings", icon: Bell, path: "/(customer)/bookings" },
                { label: "Notifications", icon: Bell, path: "/(customer)/notifications" },
                { label: "Profile", icon: User, path: "/(customer)/profile" },
                { label: "Settings", icon: Settings, path: "/(customer)/settings" },
                { label: "Help", icon: HelpCircle, path: "/(customer)/help" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.path}
                    className="flex-row items-center gap-3 px-3 py-3 rounded-xl bg-gray-50"
                    onPress={() => {
                      setIsMenuOpen(false);
                      router.push(item.path);
                    }}
                  >
                    <Icon size={18} color="#166534" />
                    <Text className="text-gray-800 font-medium">{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                className="flex-row items-center gap-3 px-3 py-3 rounded-xl bg-red-50"
                onPress={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={18} color="red" />
                <Text className="text-red-700 font-semibold">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Action Sheet */}
      <AnimatedEntry className="absolute bottom-0 w-full" delay={300}>
        {activeRideId ? (
          <View className="bg-white p-6 rounded-t-3xl shadow-xl pb-10">
            <Text className="text-xl font-bold text-center mb-2">Ride Status</Text>
            
            <View className="items-center mb-4">
              {rideStatus === 'accepted' && <Text className="text-blue-600 text-lg font-bold">Driver is on the way</Text>}
              {rideStatus === 'arrived' && <Text className="text-green-600 text-lg font-bold">Driver has arrived!</Text>}
              {rideStatus === 'in_progress' && <Text className="text-purple-600 text-lg font-bold">Trip in progress</Text>}
              {rideStatus === 'completed' && <Text className="text-gray-800 text-lg font-bold">Trip Completed</Text>}
            </View>

            {rideStatus === 'completed' ? (
              <TouchableOpacity 
                className="bg-green-600 py-3 rounded-xl items-center"
                onPress={() => {
                  setActiveRideId(null);
                  setRideStatus(null);
                  Alert.alert("Thank you", "Hope you enjoyed your ride!");
                }}
              >
                <Text className="text-white font-bold">Close</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text className="text-gray-500 text-center mb-4">Your ride is active. Please wait for updates.</Text>
                {/* In a real app, we would show driver details here */}
                <TouchableOpacity 
                  className="bg-gray-100 py-3 rounded-xl flex-row justify-center items-center"
                  onPress={() => Alert.alert("Call Driver", "Calling driver...")}
                >
                  <Phone size={20} color="black" className="mr-2" />
                  <Text className="font-bold ml-2">Call Driver</Text>
                </TouchableOpacity>
              </View>
            )}
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
