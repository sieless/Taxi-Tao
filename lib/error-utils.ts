/**
 * Sanitizes Firebase error messages to prevent revealing security-sensitive information
 * @param error - The error object or error message
 * @param defaultMessage - Default message to show if error should be hidden
 * @returns A safe, user-friendly error message
 */
export function sanitizeAuthError(
  error: any,
  defaultMessage: string = "An error occurred. Please try again."
): string {
  // If error is a string, check if it contains sensitive info
  if (typeof error === "string") {
    if (
      error.includes("password-does-not-meet-requirements") ||
      error.includes("Password must contain") ||
      error.includes("lower case") ||
      error.includes("upper case") ||
      error.includes("non-alphanumeric")
    ) {
      return "Password does not meet security requirements. Please use a stronger password.";
    }
    return error;
  }

  // Handle error objects
  if (!error || !error.code) {
    return defaultMessage;
  }

  const errorCode = error.code;
  const errorMessage = error.message || "";

  // Password requirement errors - hide specific requirements
  if (
    errorCode === "auth/password-does-not-meet-requirements" ||
    errorMessage.includes("password-does-not-meet-requirements") ||
    errorMessage.includes("Password must contain") ||
    errorMessage.includes("lower case") ||
    errorMessage.includes("upper case") ||
    errorMessage.includes("non-alphanumeric")
  ) {
    return "Password does not meet security requirements. Please use a stronger password.";
  }

  // Other Firebase auth errors - use generic messages
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Invalid email address. Please check and try again.";
    case "auth/weak-password":
      return "Password is too weak. Please use a stronger password.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This operation is not allowed. Please contact support.";
    case "auth/requires-recent-login":
      return "For security, please sign in again to continue.";
    default:
      // Check for Firestore permission errors with context
      if (errorCode?.includes('permission-denied') || errorMessage?.includes('Missing or insufficient permissions')) {
        if (errorMessage?.includes('email') || errorMessage?.includes('verified')) {
          return "Please verify your email address to perform this action. Check your inbox for the verification link.";
        }
        if (errorMessage?.includes('subscription') || errorMessage?.includes('visible')) {
          return "You need an active subscription to perform this action.";
        }
        return "Permission denied. This may be due to unverified email, inactive subscription, or account restrictions.";
      }
      // For any other error, return generic message to avoid revealing system details
      return defaultMessage;
  }
}

