import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/**
 * Trigger the custom Resend-based verification email Cloud Function
 */
export const sendAuthVerificationEmail = async (email: string, userName?: string) => {
  try {
    const sendFn = httpsCallable(functions, "sendAuthVerificationEmail");
    const result = await sendFn({ email, userName });
    return { success: true, data: result.data };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error triggering verification email:", error);
    }
    throw error;
  }
};

/**
 * Trigger the custom Resend-based password reset email Cloud Function
 */
export const sendAuthPasswordResetEmail = async (email: string, userName?: string) => {
  try {
    const sendFn = httpsCallable(functions, "sendAuthPasswordResetEmail");
    const result = await sendFn({ email, userName });
    return { success: true, data: result.data };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error triggering password reset email:", error);
    }
    throw error;
  }
};
