import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Mail, Lock, Phone, Eye, EyeOff, Sparkles, CheckCircle2, Car, Users } from "lucide-react-native";
import AnimatedEntry from "../../components/AnimatedEntry";
import { validateName, validateEmail, validatePhone, validatePassword, normalizePhone } from "../../lib/validation";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "driver">("customer");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    // Validate all fields
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      Alert.alert("Validation Error", nameValidation.error);
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      Alert.alert("Validation Error", emailValidation.error);
      return;
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      Alert.alert("Validation Error", phoneValidation.error);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert("Validation Error", passwordValidation.error);
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const normalizedEmail = email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      // 2. Update Profile
      await updateProfile(user, { displayName: name.trim() });

      // 3. Create Firestore Document
      const normalizedPhone = normalizePhone(phone);
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        role: role,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/") }
      ]);
    } catch (error: any) {
      const errorMessage = error.code === "auth/email-already-in-use" 
        ? "This email is already registered. Please use a different email or try logging in."
        : error.code === "auth/weak-password"
        ? "Password is too weak. Please use a stronger password."
        : error.message || "An error occurred during signup";
      Alert.alert("Signup Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntry className="px-6">
          {/* Hero Header */}
          <View className="items-center mb-8 mt-2">
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
            <Text className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Join TaxiTao</Text>
            <Text className="text-gray-500 text-center text-base px-4 leading-relaxed">Your ride to convenience starts here 🚗✨</Text>
          </View>

          {/* Role Selection */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-700 ml-1 mb-3">I AM A</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setRole("customer")}
                className="flex-1 p-4 rounded-2xl border-2"
                style={{
                  backgroundColor: role === "customer" ? '#dcfce7' : 'white',
                  borderColor: role === "customer" ? '#16a34a' : '#e5e7eb'
                }}
              >
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: role === "customer" ? '#16a34a' : '#f3f4f6' }}
                  >
                    <Users size={24} color={role === "customer" ? 'white' : '#6b7280'} />
                  </View>
                  <Text className="font-bold text-gray-900">Customer</Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">Book rides</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole("driver")}
                className="flex-1 p-4 rounded-2xl border-2"
                style={{
                  backgroundColor: role === "driver" ? '#dcfce7' : 'white',
                  borderColor: role === "driver" ? '#16a34a' : '#e5e7eb'
                }}
              >
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: role === "driver" ? '#16a34a' : '#f3f4f6' }}
                  >
                    <Car size={24} color={role === "driver" ? 'white' : '#6b7280'} />
                  </View>
                  <Text className="font-bold text-gray-900">Driver</Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">Earn money</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Fields */}
          <View className="space-y-4">
            {/* Name Input */}
            <View className="mb-1">
              <Text className="text-xs font-semibold text-gray-700 ml-1 mb-2">FULL NAME</Text>
              <View className="flex-row items-center bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                <View className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center">
                  <User size={20} color="#16a34a" />
                </View>
                <TextInput
                  className="flex-1 ml-3 text-gray-900 font-medium"
                  placeholder="John Doe"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

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

            {/* Phone Input */}
            <View className="mb-1">
              <Text className="text-xs font-semibold text-gray-700 ml-1 mb-2">PHONE NUMBER</Text>
              <View className="flex-row items-center bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center">
                  <Phone size={20} color="#a855f7" />
                </View>
                <TextInput
                  className="flex-1 ml-3 text-gray-900 font-medium"
                  placeholder="0712345678"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
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
                  placeholder="Min. 8 characters"
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

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
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
                  <Text className="text-white font-bold text-lg mr-2">Create Account</Text>
                  <Sparkles size={20} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center mt-8 mb-4">
            <Text className="text-gray-600 text-base">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="ml-1">
                <Text className="text-green-600 font-bold text-base underline">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Trust Banner */}
          <View className="items-center mt-4 mb-6">
            <Text className="text-xs text-gray-400 text-center px-8">
              By signing up, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}
