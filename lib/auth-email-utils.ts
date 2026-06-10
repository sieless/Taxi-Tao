import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app, "europe-west3");

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
