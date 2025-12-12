import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const LocationService = {
  /**
   * Converts an address string to coordinates (latitude, longitude).
   * Uses Expo's native geocoding (Google Maps on Android, Apple Maps on iOS).
   */
  geocodeAddress: async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to search for places.');
        return null;
      }

      const result = await Location.geocodeAsync(address);
      
      if (result.length > 0) {
        return {
          lat: result[0].latitude,
          lng: result[0].longitude,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  },

  /**
   * Converts coordinates to a readable address.
   */
  reverseGeocode: async (lat: number, lng: number): Promise<string | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      
      if (result.length > 0) {
        const r = result[0];
        // Construct a readable address from available fields
        const parts = [
          r.name,
          r.street,
          r.city,
          r.region
        ].filter(p => p && p !== r.name); // Avoid duplicates if name == street
        
        // If name is just the street number, maybe don't show it alone, but for now:
        if (r.name && !parts.includes(r.name)) parts.unshift(r.name);
        
        return parts.join(', ') || "Unknown Location";
      }
      
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }
};
