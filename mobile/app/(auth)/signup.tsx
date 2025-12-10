import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Mail, Lock, Phone } from "lucide-react-native";
import AnimatedEntry from "../../components/AnimatedEntry";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Profile
      await updateProfile(user, { displayName: name });

      // 3. Create Firestore Document
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        phone,
        role: "customer", // Default to customer
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/") }
      ]);
    } catch (error: any) {
      Alert.alert("Signup Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <AnimatedEntry className="px-8 py-6">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
            <Text className="text-gray-500 mt-2">Join TaxiTao today</Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <User size={20} color="#6b7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900"
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
              />
            </View>

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
              <Phone size={20} color="#6b7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900"
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="bg-green-600 py-4 rounded-xl items-center shadow-lg shadow-green-200 mt-4"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-green-600 font-bold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}
