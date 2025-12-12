import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, CarFront, Eye, EyeOff, LogIn } from "lucide-react-native";
import AnimatedEntry from "../../components/AnimatedEntry";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result && result !== "driver" && result !== "customer" && result !== "admin") {
         Alert.alert("Login Failed", "Invalid email or password");
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <AnimatedEntry className="flex-1 justify-center px-6">
        {/* Hero Header */}
        <View className="items-center mb-12">
          <Image 
            source={require('../../assets/icon.png')}
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40,
              marginBottom: 16 
            }}
            resizeMode="cover"
          />
          <Text className="text-4xl font-extrabold text-gray-900 tracking-tight">TaxiTao</Text>
          <Text className="text-gray-500 mt-2 text-base">Welcome back! 👋</Text>
        </View>

        {/* Input Fields */}
        <View className="space-y-4">
          {/* Email Input */}
          <View className="mb-1">
            <Text className="text-xs font-semibold text-gray-700 ml-1 mb-2">EMAIL ADDRESS</Text>
            <View className="flex-row items-center bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
              <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center">
                <Mail size={20} color="#3b82f6" />
              </View>
              <TextInput
                className="flex-1 ml-3 text-gray-900 font-medium"
                placeholder="john@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-1">
            <Text className="text-xs font-semibold text-gray-700 ml-1 mb-2">PASSWORD</Text>
            <View className="flex-row items-center bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
              <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center">
                <Lock size={20} color="#ef4444" />
              </View>
              <TextInput
                className="flex-1 ml-3 mr-3 text-gray-900 font-medium"
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                className="w-10 h-10 items-center justify-center"
              >
                {showPassword ? (
                  <Eye size={22} color="#16a34a" />
                ) : (
                  <EyeOff size={22} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            className="items-end mt-2"
            onPress={() => Alert.alert(
              "Reset Password",
              "Password reset functionality coming soon. Please contact support.",
              [{ text: "OK" }]
            )}
          >
            <Text className="text-green-600 font-semibold text-sm">Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="py-5 rounded-2xl items-center mt-6"
            style={{ 
              backgroundColor: loading ? '#9ca3af' : '#16a34a',
              elevation: 8,
              shadowColor: '#16a34a',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">Sign In</Text>
                <LogIn size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600 text-base">Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity className="ml-1">
              <Text className="text-green-600 font-bold text-base underline">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </AnimatedEntry>
    </SafeAreaView>
  );
}
