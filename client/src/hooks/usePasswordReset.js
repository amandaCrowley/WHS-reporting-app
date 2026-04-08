// hooks/usePasswordReset.js
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword as firebaseUpdatePassword } from "firebase/auth";
import { useState } from "react";

export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateUserPassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) throw new Error("No user is currently logged in.");

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await firebaseUpdatePassword(user, newPassword);

      setLoading(false);
      return true; // success
    } catch (err) {
      setLoading(false);
      setError(err);

      // Firebase requires recent login
      if (err.code === "auth/requires-recent-login") {
        // Optionally handle logout here
        throw new Error("Please log in again to update your password.");
      }

      throw err; // propagate other errors
    }
  };

  return { updateUserPassword, loading, error };
}