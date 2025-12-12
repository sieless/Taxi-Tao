import { View, Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

interface OfflineBannerProps {
  isOffline: boolean;
}

export default function OfflineBanner({ isOffline }: OfflineBannerProps) {
  if (!isOffline) return null;

  return (
    <Animated.View 
      entering={FadeInDown} 
      exiting={FadeOutUp}
      className="bg-red-600 px-4 py-3 flex-row items-center justify-center"
    >
      <WifiOff size={16} color="white" />
      <Text className="text-white font-medium ml-2">
        No internet connection
      </Text>
    </Animated.View>
  );
}
