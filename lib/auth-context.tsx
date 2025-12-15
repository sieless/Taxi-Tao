"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User as AppUser, Driver as AppDriver } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: AppUser | null;
  driverProfile: AppDriver | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUserProfile: (currentUser?: FirebaseUser | null) => Promise<void>;
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

  // Load cached profiles
  const loadCachedProfile = () => {
    try {
      const rawUser = localStorage.getItem("userProfile");
      if (rawUser) setUserProfile(JSON.parse(rawUser));
      const rawDriver = localStorage.getItem("driverProfile");
      if (rawDriver) setDriverProfile(JSON.parse(rawDriver));
    } catch (e) {
      console.warn("Failed to parse cached profile", e);
    }
  };

  // Refresh profile from Firestore
  const refreshUserProfile = async (currentUser?: FirebaseUser | null) => {
    const targetUser = currentUser || user;
    if (!targetUser) return;

    setError(null);

    try {
      const userDocRef = doc(db, "users", targetUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const profileData: AppUser = {
          id: userDoc.id,
          ...(data as any),
          name:
            data?.name ||
            targetUser.displayName ||
            targetUser.email?.split("@")[0] ||
            "Anonymous",
        };
        setUserProfile(profileData);
        localStorage.setItem("userProfile", JSON.stringify(profileData));

        if (profileData.role === "driver" && profileData.driverId) {
          try {
            const driverDoc = await getDoc(
              doc(db, "drivers", profileData.driverId)
            );
            if (driverDoc.exists()) {
              const driverData: AppDriver = {
                id: driverDoc.id,
                ...(driverDoc.data() as any),
              };
              setDriverProfile(driverData);
              localStorage.setItem("driverProfile", JSON.stringify(driverData));
            } else {
              setDriverProfile(null);
            }
          } catch (drvErr: any) {
            if (drvErr.code !== "permission-denied")
              console.error("Driver profile fetch error:", drvErr);
            setDriverProfile(null);
          }
        } else {
          setDriverProfile(null);
        }
      } else {
        // Auto-create profile if missing
        const newProfile: any = {
          name:
            targetUser.displayName || targetUser.email?.split("@")[0] || "User",
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile({ id: userDocRef.id, ...newProfile } as AppUser);
        localStorage.setItem(
          "userProfile",
          JSON.stringify({ id: userDocRef.id, ...newProfile })
        );
        setDriverProfile(null);
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setError(err.message || "Unknown error while fetching profile");
      setUserProfile(null);
      setDriverProfile(null);
    }
  };

  useEffect(() => {
    loadCachedProfile();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) await refreshUserProfile(firebaseUser);
      else {
        setUserProfile(null);
        setDriverProfile(null);
        localStorage.removeItem("userProfile");
        localStorage.removeItem("driverProfile");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const normalized = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalized,
        password
      );

      setUser(userCredential.user);

      // Fetch Firestore profile directly here to get role immediately
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = (data as any).role || "customer";
        await refreshUserProfile(userCredential.user); // update React state
        return role;
      } else {
        // If no doc, auto-create
        const newProfile: any = {
          email: userCredential.user.email || "",
          role: "customer",
          name:
            userCredential.user.displayName ||
            userCredential.user.email?.split("@")[0] ||
            "User",
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile);
        await refreshUserProfile(userCredential.user);
        return "customer";
      }
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setError(err.message || "Sign in failed");
      return err.code || "signin-failed";
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      setUserProfile(null);
      setDriverProfile(null);
      localStorage.removeItem("userProfile");
      localStorage.removeItem("driverProfile");
      try {
        router.replace("/");
      } catch {
        window.location.href = "/";
      }
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
