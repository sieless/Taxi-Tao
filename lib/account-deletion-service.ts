import type { User as FirebaseUser } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import type { AppUser, User as AppUserProfile } from "@/lib/types";

type UserProfile = AppUser | AppUserProfile | null;

export interface AccountDeletionRequestResult {
  created: boolean;
  requestId: string;
}

export async function requestAccountDeletion({
  user,
  userProfile,
  reason,
}: {
  user: FirebaseUser;
  userProfile: UserProfile;
  reason?: string;
}): Promise<AccountDeletionRequestResult> {
  const requestsRef = collection(db, COLLECTIONS.ACCOUNT_DELETION_REQUESTS);
  const pendingRequest = query(
    requestsRef,
    where("userId", "==", user.uid),
    where("status", "==", "pending"),
    limit(1)
  );
  const existing = await getDocs(pendingRequest);

  if (!existing.empty) {
    return {
      created: false,
      requestId: existing.docs[0].id,
    };
  }

  const trimmedReason = reason?.trim();
  const requestDoc = await addDoc(requestsRef, {
    userId: user.uid,
    role: userProfile?.role || "customer",
    email: userProfile?.email || user.email || "",
    name:
      userProfile?.name ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "User",
    driverId: userProfile?.driverId || null,
    status: "pending",
    reason: trimmedReason || null,
    requestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    created: true,
    requestId: requestDoc.id,
  };
}
