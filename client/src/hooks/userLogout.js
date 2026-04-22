/**
 * userLogout hook
 * 
 * Handles logging out the currently authenticated user.
 * - Signs the user out using Firebase Authentication
 * - Redirects the user to the login page after logout
 * 
 * Author/s: Amanda Foxley
 * Date: 9/4/26
 */
import { getAuth, signOut } from "firebase/auth"; //Import FireBase auth functions for signing out
import { useNavigate } from "react-router-dom";


export function userLogout() {
  const auth = getAuth();         // Firebase auth object to access current logged-in user
  const navigate = useNavigate(); // Navigate object to be userd for redirecting the user after logout

  /**
   * function to log out the current user
   */
  const logout = async () => {
    try {
      await signOut(auth);        // Firebase function to sign the user out
      navigate("/login");         // Redirects the user to the login page
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return logout; //Return the logout function so other components can use it
}