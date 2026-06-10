"use client";

import { useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { requestAccountDeletion } from "@/lib/account-deletion-service";
import type { AppUser, User as AppUserProfile } from "@/lib/types";
import { sanitizeAuthError } from "@/lib/error-utils";

type UserProfile = AppUser | AppUserProfile | null;
type Feedback = { type: "success" | "error"; message: string } | null;

export default function AccountDeletionRequestPanel({
  user,
  userProfile,
}: {
  user: FirebaseUser | null;
  userProfile: UserProfile;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const canSubmit = confirmation.trim() === "DELETE" && !submitting;

  async function handleSubmit() {
    if (!user) {
      setFeedback({
        type: "error",
        message: "Please sign in before requesting account deletion.",
      });
      return;
    }

    if (confirmation.trim() !== "DELETE") {
      setFeedback({
        type: "error",
        message: "Type DELETE to confirm this request.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await requestAccountDeletion({
        user,
        userProfile,
        reason,
      });

      setFeedback({
        type: "success",
        message: result.created
          ? "Your account deletion request has been submitted for admin review."
          : "You already have a pending account deletion request.",
      });
      setConfirmation("");
      setReason("");
    } catch (error: unknown) {
      const message = sanitizeAuthError(
        error,
        "Failed to submit your deletion request. Please try again."
      );
      setFeedback({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-red-100 p-6 shadow-sm space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-500" />
          Account deletion request
        </h3>
        <p className="text-sm text-gray-600">
          Submit a request for support to review your account deletion. This
          does not delete your account immediately or sign you out.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Tell us why you want to leave..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type DELETE to confirm
          </label>
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="DELETE"
          />
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "bg-primary-50 text-primary-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        {submitting ? "Submitting..." : "Request account deletion"}
      </button>
    </div>
  );
}
