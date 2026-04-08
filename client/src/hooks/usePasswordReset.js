/**
 * Custom React hook to handle updating the current user's Firebase password.
 * 
 * Key features:
 * - updateUserPassword: An async function to change password after verifying the current password is correct
 * - loading: boolean, true while password update is in progress - state for pages/components to use to incdicate the loading status of the fetch operation
 * - error: string - The state for pages/components to use to incdicate the error status of the fetch operation
 * 
 * Usage:
 * const { updateUserPassword, loading, error } = usePasswordReset();
 * await updateUserPassword(currentPassword, newPassword);
 * 
 * Author/s: Amanda Foxley
 * Date: 8/4/26
 */

import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword as firebaseUpdatePassword } from "firebase/auth";
import { useState } from "react";

export function usePasswordReset() {

  //State variables for tracking the update password operation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

/**
 * Function that updates the current user's password.
 * 
 * @param {string} currentPassword - The user's current password to be used to re-authentication
 * @param {string} newPassword - The new password to set
 * @returns {Promise<boolean>} - Returns true on success, or throws an error on failure
 */
  const updateUserPassword = async (currentPassword, newPassword) => {
    setLoading(true); //Start loading
    setError(null); //Reset any previous errors

    try {
      //Get the currently logged in user with Firebase getAuth() method
      const auth = getAuth(); 
      const user = auth.currentUser; 

      if (!user) throw new Error("No user is currently logged in.");

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update the user's password in Firebase
      await firebaseUpdatePassword(user, newPassword);

      setLoading(false); //update complete
      return true; // success
    } catch (err) {
      setLoading(false); //Stop loading if an error occurs
      setError(err);

      // Handle specific Firebase requires recent login error
      if (err.code === "auth/requires-recent-login") {
        // Optionally handle logout here
        throw new Error("Please log in again to update your password.");
      }

      throw err; // Any other errors
    }
  };

  return { updateUserPassword, loading, error };
}