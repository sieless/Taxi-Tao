"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User as AppUser, Driver as AppDriver } from "@/lib/types";
import { useRouter } from "next/navigation";
import { sanitizeAuthError } from "@/lib/error-utils";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: AppUser | null;
  driverProfile: AppDriver | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUserProfile: (currentUser?: FirebaseUser | null) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  driverProfile: null,
  loading: true,
  error: null,
  signIn: async () => null,
  signInWithGoogle: async () => null,
  logout: async () => {},
  refreshUserProfile: async () => {},
  resetPassword: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [driverProfile, setDriverProfile] = useState<AppDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();



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
          email: data?.email || targetUser.email || "",
          name:
            data?.name ||
            targetUser.displayName ||
            targetUser.email?.split("@")[0] ||
            "Anonymous",
        };
        if (data?.suspended) {
          // If suspended, sign out and don't set the profile
          await signOut(auth);
          setUserProfile(null);
          setDriverProfile(null);
          setError("Your account has been suspended. Please contact support.");
          router.replace("/login");
          return;
        }

        setUserProfile(profileData);

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
            } else {
              setDriverProfile(null);
            }
          } catch (drvErr: any) {
            if (drvErr.code !== "permission-denied" && process.env.NODE_ENV === "development") {
              console.error("Driver profile fetch error:", drvErr);
            }
            setDriverProfile(null);
          }
        } else if (profileData.role === "car_hire") {
          // Resolve companyId if missing or fetch company details
          let effectiveCompanyId = profileData.companyId;

          if (!effectiveCompanyId) {
            try {
              const { collection, query, where, getDocs } = await import("firebase/firestore");
              const q = query(collection(db, "companies"), where("representativeId", "==", targetUser.uid));
              const snap = await getDocs(q);
              if (!snap.empty) {
                effectiveCompanyId = snap.docs[0].id;
                // Self-heal user document in database to satisfy Security Rules
                await setDoc(doc(db, "users", targetUser.uid), { companyId: effectiveCompanyId }, { merge: true });
                // Update local profile data
                profileData.companyId = effectiveCompanyId;
                setUserProfile({ ...profileData });
              }
            } catch (err) {
              if (process.env.NODE_ENV === "development") {
                console.error("Error resolving company by representative:", err);
              }
            }
          }

          if (effectiveCompanyId) {
            try {
              const companyDoc = await getDoc(doc(db, "companies", effectiveCompanyId));
              if (companyDoc.exists()) {
                const companyData = { id: companyDoc.id, ...companyDoc.data() };
              }
            } catch (compErr: any) {
              if (compErr.code !== "permission-denied" && process.env.NODE_ENV === "development") {
                console.error("Company profile fetch error:", compErr);
              }
            }
          }
        } else {
          setDriverProfile(null);
        }
      } else {
        // No profile document found
        if (process.env.NODE_ENV === "development") {
          console.warn("No profile document found for user");
        }
        setUserProfile(null);
        setDriverProfile(null);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching user profile:", err);
      }
      setError(err.message || "Unknown error while fetching profile");
      setUserProfile(null);
      setDriverProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check email verification - redirect to verification page if not verified
        // (except on verification page itself to avoid redirect loops)
        if (!firebaseUser.emailVerified && !window.location.pathname.includes('/verify-email') && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup') && !window.location.pathname.includes('/driver/register')) {
          router.push('/verify-email');
          setLoading(false);
          return;
        }
        await refreshUserProfile(firebaseUser);
      } else {
        setUserProfile(null);
        setDriverProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  /**
   * Set session cookie server-side via API route (httpOnly, secure).
   */
  const setSessionCookie = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to set session cookie:", error);
      }
    }
  };

  /**
   * Clear session cookies on logout via API route
   */
  const clearSessionCookies = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to clear session cookies:", error);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const trimmedEmail = email.trim();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      setUser(userCredential.user);

      // Set session cookie for middleware protection
      await setSessionCookie(userCredential.user);

      // Fetch Firestore profile directly here to get role immediately
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data?.suspended) {
          await signOut(auth);
          await clearSessionCookies();
          throw new Error("Your account has been suspended. Please contact support.");
        }
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
      if (process.env.NODE_ENV === "development") {
        console.error("Sign in failed:", err);
      }
      const sanitizedError = sanitizeAuthError(err, "Sign in failed. Please try again.");
      setError(sanitizedError);
      throw new Error(sanitizedError);
    }
  };
  
  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Set session cookie for middleware protection
      await setSessionCookie(firebaseUser);
      
      // Check if user already has a profile
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data?.suspended) {
          await signOut(auth);
          await clearSessionCookies();
          throw new Error("Your account has been suspended. Please contact support.");
        }
        await refreshUserProfile(firebaseUser);
        return (data as any).role || "customer";
      } else {
        // Auto-create customer profile for new Google users
        const newProfile: any = {
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "User",
          role: "customer",
          createdAt: serverTimestamp(),
          photoURL: firebaseUser.photoURL || "",
        };
        await setDoc(userDocRef, newProfile);
        await refreshUserProfile(firebaseUser);
        return "customer";
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Google sign in failed:", err);
      }
      let message = "Google sign in failed. Please try again.";
      if (err.code === "auth/popup-blocked") {
        message = "Login popup was blocked by your browser. Please allow popups for this site and try again.";
      } else if (err.code === "auth/cancelled-popup-request") {
        message = "Sign-in was cancelled.";
      }
      const sanitizedError = sanitizeAuthError(err, message);
      setError(sanitizedError);
      throw new Error(sanitizedError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sign out error:", err);
      }
    } finally {
      setUser(null);
      setUserProfile(null);
      setDriverProfile(null);
      await clearSessionCookies();
      try {
        router.replace("/");
      } catch {
        window.location.href = "/";
      }
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      const { sendAuthPasswordResetEmail } = await import("@/lib/auth-email-utils");
      await sendAuthPasswordResetEmail(email.trim().toLowerCase());
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Reset password failed:", err);
      }
      // Still return success or don't throw to prevent user enumeration if desired, 
      // but here we just log it. The implementation plan says trigger it.
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
        signInWithGoogle,
        logout,
        refreshUserProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
