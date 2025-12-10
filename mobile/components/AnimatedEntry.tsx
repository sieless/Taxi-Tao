import { ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";

interface AnimatedEntryProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
  className?: string;
}

export default function AnimatedEntry({ children, delay = 0, style, className }: AnimatedEntryProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(12)}
      exiting={FadeOut}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
