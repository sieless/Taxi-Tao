import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, CarFront } from "lucide-react-native";
import AnimatedEntry from "../../components/AnimatedEntry";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <AnimatedEntry className="flex-1 justify-center px-8">
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-green-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-green-200">
            <CarFront size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-900">TaxiTao</Text>
          <Text className="text-gray-500 mt-2">Welcome back!</Text>
        </View>

        <View className="space-y-4">
          <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <Mail size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-900"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <Lock size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-900"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity className="items-end">
            <Text className="text-green-600 font-medium">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-green-600 py-4 rounded-xl items-center shadow-lg shadow-green-200 mt-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500">Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-green-600 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </AnimatedEntry>
    </SafeAreaView>
  );
}
