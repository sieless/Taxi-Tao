import { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User as AppUser, Driver as AppDriver } from "./types";
import { useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "./notifications";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: AppUser | null;
  driverProfile: AppDriver | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  driverProfile: null,
  loading: true,
  error: null,
  signIn: async () => null,
  logout: async () => {},
  refreshUserProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [driverProfile, setDriverProfile] = useState<AppDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Load cached profile
  const loadCachedProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem("userProfile");
      if (raw) {
        setUserProfile(JSON.parse(raw));
      }
      const rawDriver = await AsyncStorage.getItem("driverProfile");
      if (rawDriver) {
        setDriverProfile(JSON.parse(rawDriver));
      }
    } catch (e) {
      console.warn("Failed to parse cached profile", e);
    }
  };

  const refreshUserProfile = async (currentUser?: FirebaseUser | null) => {
    const targetUser = currentUser || user;
    if (!targetUser) return;

    setError(null);
    try {
      const userDocRef = doc(db, "users", targetUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const profileData = {
          id: userDoc.id,
          ...data,
          name: data.name || targetUser.displayName || targetUser.email?.split("@")[0] || "Anonymous",
        } as AppUser;
        
        setUserProfile(profileData);
        AsyncStorage.setItem("userProfile", JSON.stringify(profileData));

        if (profileData.role === "driver" && profileData.driverId) {
          try {
            const driverDoc = await getDoc(doc(db, "drivers", profileData.driverId));
            if (driverDoc.exists()) {
              const d = { id: driverDoc.id, ...(driverDoc.data() as any) } as AppDriver;
              setDriverProfile(d);
              AsyncStorage.setItem("driverProfile", JSON.stringify(d));
            } else {
              setDriverProfile(null);
            }
          } catch (drvErr: any) {
            console.error("Error fetching driver profile:", drvErr);
          }
        } else {
          setDriverProfile(null);
        }
      } else {
        // Auto-create profile if missing
        const newProfile: any = {
          email: targetUser.email || "",
          role: "customer",
          createdAt: serverTimestamp(),
          name: targetUser.displayName || targetUser.email?.split("@")[0] || "User",
        };

        try {
          await setDoc(userDocRef, newProfile);
          const newDoc = await getDoc(userDocRef);
          const data = newDoc.data();
          const profileData = {
            id: newDoc.id,
            ...(data as any),
            name: data?.name || newProfile.name,
          } as AppUser;
          setUserProfile(profileData);
          AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
        } catch (createErr: any) {
          console.error("Error creating user profile:", createErr);
          setError(`Error creating profile: ${createErr.message}`);
        }
      }
      
      // Register for Push Notifications and update token
      try {
         const token = await registerForPushNotificationsAsync();
         if (token) {
             await setDoc(userDocRef, { pushToken: token }, { merge: true });
         }
      } catch (tokenErr) {
          console.warn("Error registering push token:", tokenErr);
      }

    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      setError(`Error: ${error.message}`);
      setUserProfile(null);
      setDriverProfile(null);
    }
  };

  useEffect(() => {
    loadCachedProfile();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshUserProfile(firebaseUser);
      } else {
        setUserProfile(null);
        setDriverProfile(null);
        AsyncStorage.removeItem("userProfile");
        AsyncStorage.removeItem("driverProfile");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Protected Routes Logic
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Redirect to dashboard if authenticated
      if (userProfile?.role === "driver") {
        router.replace("/(driver)/dashboard");
      } else {
        router.replace("/(customer)/home");
      }
    }
  }, [user, segments, loading, userProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const normalized = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, normalized, password);
      setUser(userCredential.user);
      // Profile refresh happens in onAuthStateChanged
      return null;
    } catch (err: any) {
      console.error("Sign in failed:", err);
      return err?.code || "signin-failed";
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setDriverProfile(null);
      await AsyncStorage.removeItem("userProfile");
      await AsyncStorage.removeItem("driverProfile");
      router.replace("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        driverProfile,
        loading,
        error,
        signIn,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
