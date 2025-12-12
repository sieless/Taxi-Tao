import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "../../components/Map";
import AnimatedEntry from "../../components/AnimatedEntry";
import DriverActiveRide from "../../components/DriverActiveRide";
import { useAuth } from "../../lib/auth-context";
import { RideService } from "../../lib/ride-service";
import { BookingRequest } from "../../lib/types";
import { LogOut, User, MapPin, Menu, Bell, Settings, HelpCircle } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { DriverService } from "../../lib/driver-service";

export default function DriverDashboard() {
  const { logout, driverProfile, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<BookingRequest[]>([]);
  const [activeRide, setActiveRide] = useState<BookingRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isOnline) {
      if (!driverProfile) {
        Alert.alert("Profile needed", "Driver profile not loaded yet.");
        setAvailableRides([]);
        return;
      }

        unsubscribe = RideService.listenForAvailableRides(
        {
          driverId: driverProfile.id,
          currentLocation: driverProfile.currentLocation,
          subscriptionStatus: driverProfile.subscriptionStatus,
          status: driverProfile.status,
        },
        (rides) => {
          // Check if we have an active ride (accepted/arrived/in_progress) assigned to us
          const myActiveRide = rides.find(r => 
            (r.status === 'accepted' || r.status === 'arrived' || r.status === 'in_progress') && 
            r.acceptedBy === driverProfile.id
          );
          
          if (myActiveRide) {
            setActiveRide(myActiveRide);
            setAvailableRides([]); // Don't show other rides while busy
          } else {
            setActiveRide(null);
            // Filter out rides that are already taken or not pending
            setAvailableRides(rides.filter(r => r.status === 'pending'));
          }
        },
        (err) => {
          Alert.alert("Permissions", "Cannot load rides: " + err?.message);
        }
      );
    } else {
      setAvailableRides([]);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOnline, driverProfile?.currentLocation, driverProfile?.subscriptionStatus, driverProfile?.status]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserProfile();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleOnline = async (value: boolean) => {
    if (!driverProfile) {
      Alert.alert("Error", "Driver profile not loaded");
      return;
    }

    setLoading(true);
    try {
      if (value) {
        // Going Online
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission denied", "Location permission is required to go online.");
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        // In a real app, we would reverse geocode here to get the address
        // For now, we'll use a placeholder or previous known location if available
        const address = driverProfile.currentLocation || "Driver Location"; 

        await DriverService.updateStatus(driverProfile.id, 'available', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          address: address
        });
        
        setIsOnline(true);
        Alert.alert("Online", "You are now visible to customers.");
      } else {
        // Going Offline
        await DriverService.updateStatus(driverProfile.id, 'offline');
        setIsOnline(false);
      }
      // Refresh profile to get latest status/location from server if needed
      await refreshUserProfile();
    } catch (error: any) {
      Alert.alert("Error", "Failed to update status: " + error.message);
      // Revert switch if failed
      setIsOnline(!value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <Map showUserLocation={true} />
      
      {/* Top Bar */}
      <SafeAreaView className="absolute top-0 w-full bg-white/90 p-4 flex-row justify-between items-center shadow-sm" edges={['top']}>
        <View className="flex-row items-center">
          <TouchableOpacity className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3" onPress={() => setIsMenuOpen(true)}>
            <Menu size={20} color="gray" />
          </TouchableOpacity>
          <View>
            <Text className="font-bold text-lg">{driverProfile?.name || "Driver"}</Text>
            <Text className="text-gray-500 text-xs">{isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Switch
            trackColor={{ false: "#767577", true: "#16a34a" }}
            thumbColor={isOnline ? "#f4f3f4" : "#f4f3f4"}
            onValueChange={toggleOnline}
            value={isOnline}
            disabled={loading}
          />
          <TouchableOpacity onPress={logout} className="ml-4">
            <LogOut size={24} color="red" />
          </TouchableOpacity>
        </View>
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
                { label: "Dashboard", icon: User, path: "/(driver)/dashboard" },
                { label: "Bookings", icon: Bell, path: "/(driver)/bookings" },
                { label: "Notifications", icon: Bell, path: "/(driver)/notifications" },
                { label: "Profile", icon: User, path: "/(driver)/profile" },
                { label: "Settings", icon: Settings, path: "/(driver)/settings" },
                { label: "Help", icon: HelpCircle, path: "/(driver)/help" },
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

      {/* Bottom Status Panel / Ride Requests */}
      <AnimatedEntry className="absolute bottom-0 w-full bg-white shadow-xl border-t border-gray-100 max-h-[60%]" delay={300}>
        {activeRide ? (
          <DriverActiveRide 
            ride={activeRide} 
            onRideComplete={() => {
              setActiveRide(null);
              // Refresh logic handled by snapshot listener
            }} 
          />
        ) : isOnline && availableRides.length > 0 ? (
          <View className="p-4 pb-10">
            <Text className="font-bold text-lg mb-3">Available Rides ({availableRides.length})</Text>
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#16a34a']}
                  tintColor="#16a34a"
                />
              }
            >
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
          <ScrollView
            className="p-6 pb-10"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#16a34a']}
                tintColor="#16a34a"
              />
            }
          >
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
          </ScrollView>
        )}
      </AnimatedEntry>
    </View>
  );
}
