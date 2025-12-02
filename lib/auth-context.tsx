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
  error: string | null; // Added error state
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // helper: read cached profile if present
  const loadCachedProfile = () => {
    try {
      const raw = localStorage.getItem("userProfile");
      if (raw) {
        setUserProfile(JSON.parse(raw));
      }
      const rawDriver = localStorage.getItem("driverProfile");
      if (rawDriver) {
        setDriverProfile(JSON.parse(rawDriver));
      }
    } catch (e) {
      // ignore cache errors
      console.warn("Failed to parse cached profile", e);
    }
  };

  // refresh user profile from Firestore (callable)
  const refreshUserProfile = async (currentUser?: FirebaseUser | null) => {
    const targetUser = currentUser || user;
    if (!targetUser) return;
    
    setError(null); // Clear previous errors
    try {
      const userDocRef = doc(db, "users", targetUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profileData = { 
          id: userDoc.id, 
          ...data,
          name: data.name || targetUser.displayName || targetUser.email?.split("@")[0] || "Anonymous" 
        } as AppUser;
        console.log("🔍 User Profile Loaded:", profileData);
        setUserProfile(profileData);
        try { localStorage.setItem("userProfile", JSON.stringify(profileData)); } catch {}
        
        // load driver profile if user is driver:
        if (profileData.role === "driver" && profileData.driverId) {
          try {
            const driverDoc = await getDoc(doc(db, "drivers", profileData.driverId));
            if (driverDoc.exists()) {
              const d = { id: driverDoc.id, ...(driverDoc.data() as any) } as AppDriver;
              setDriverProfile(d);
              try { localStorage.setItem("driverProfile", JSON.stringify(d)); } catch {}
            } else {
              setDriverProfile(null);
            }
          } catch (drvErr: any) {
            if (drvErr?.code !== "permission-denied") console.error("Error fetching driver profile:", drvErr);
          }
        } else {
          setDriverProfile(null);
        }
      } else {
        console.warn("User document missing. Creating new profile for:", targetUser.uid);
        // Auto-create profile if missing
        const newProfile: any = {
          email: targetUser.email || "",
          role: "customer", // Default role
          createdAt: serverTimestamp(),
          name: targetUser.displayName || targetUser.email?.split("@")[0] || "User",
        };
        
        try {
          await setDoc(userDocRef, newProfile);
          // Fetch it back to get the timestamp correctly
          const newDoc = await getDoc(userDocRef);
          const data = newDoc.data();
          const profileData = { 
            id: newDoc.id, 
            ...(data as any),
            name: data?.name || newProfile.name 
          } as AppUser;
          setUserProfile(profileData);
          try { localStorage.setItem("userProfile", JSON.stringify(profileData)); } catch {}
        } catch (createErr: any) {
          console.error("Error creating user profile:", createErr);
          if (createErr?.code === "permission-denied") {
            setError("Permission denied: Cannot create user profile. Check Firestore rules.");
          } else {
            setError(`Error creating profile: ${createErr.message}`);
          }
        }
      }
    } catch (error: any) {
      // permission-denied is expected for some rules while not fully logged-in
      const errorMessage = error?.message || "Unknown error";
      if (error?.code === "permission-denied") {
        console.warn("Permission denied when reading user profile. Check Firestore rules.");
        setError("Permission denied: Cannot read user profile. Please update Firestore Rules.");
      } else {
        console.error("Error fetching user profile:", error);
        setError(`Error: ${errorMessage}`);
      }
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
        // fetch profile immediately, passing the user object to avoid state race condition
        await refreshUserProfile(firebaseUser);
      } else {
        setUserProfile(null);
        setDriverProfile(null);
        try { localStorage.removeItem("userProfile"); localStorage.removeItem("driverProfile"); } catch {}
      }
      setLoading(false);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const normalized = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, normalized, password);
      // set firebase user immediately
      setUser(userCredential.user);
      // fetch and set user profile
      try {
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...(userDoc.data() as any) } as AppUser;
          setUserProfile(userData);
          try { localStorage.setItem("userProfile", JSON.stringify(userData)); } catch {}
          // If driver role, fetch driver doc
          if (userData.role === "driver" && userData.driverId) {
            try {
              const driverDoc = await getDoc(doc(db, "drivers", userData.driverId));
              if (driverDoc.exists()) {
                const d = { id: driverDoc.id, ...(driverDoc.data() as any) } as AppDriver;
                setDriverProfile(d);
                try { localStorage.setItem("driverProfile", JSON.stringify(d)); } catch {}
              }
            } catch (drvErr: any) {
              if (drvErr?.code !== "permission-denied") console.error("Error fetching driver profile:", drvErr);
            }
          }
          return userData.role;
        } else {
          console.warn("User document missing after signIn - uid:", userCredential.user.uid);
          return null;
        }
      } catch (error: any) {
        if (error?.code === "permission-denied") {
          console.warn("Permission denied when reading user role.");
        } else {
          console.error("Error fetching user role after signIn:", error);
        }
        return null;
      }
    } catch (err: any) {
      console.error("Sign in failed:", err);
      // return a string code to allow UI to show message
      return err?.code || "signin-failed";
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
      try { localStorage.removeItem("userProfile"); localStorage.removeItem("driverProfile"); } catch {}
      // use next/router to route — do not force reload
      try {
        router.replace("/");
      } catch {
        // ignore if router unavailable
        window.location.href = "/";
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, driverProfile, loading, error, signIn, logout, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
