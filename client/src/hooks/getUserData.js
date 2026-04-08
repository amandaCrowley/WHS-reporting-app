/**
 * This is a custom hook to manage authenticated user data.
 * 
 * Provides:
 * - userData: the user's full data from the backend (MongoDB)
 * - loading: boolean, true while fetching user data
 * - error: string, any error encountered during fetching
 * - logout: function to log the user out via Firebase
 * - updateUser: function to update the user's data in the backend (last name only for now)
 * - setUserData: setter for manually updating userData if needed
 * 
 * Author/s: Amanda Foxley
 * Date: 8/4/26
 */

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export function getUserData() {
    const [userData, setUserData] = useState(null); // State to store user data from backend
    const [loading, setLoading] = useState(true); // State to indicate loading state while fetching user data
    const [error, setError] = useState(null); // State to store error messages if fetching fails

    const auth = getAuth();   // Firebase auth object to access current logged-in user
    const navigate = useNavigate();

    useEffect(() => {
        // Prevent multiple redirects in case of errors or timeouts
        let redirected = false;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {

            // If no user is logged in, redirect to login page
            if (!currentUser) {
                navigate("/login");
                return;
            }

            const controller = new AbortController();
            const signal = controller.signal;

            // Set a 5-second timeout to abort the fetch if it takes too long
            const timeout = setTimeout(() => {
                controller.abort(); // Cancel the fetch request
                if (!redirected) {
                    redirected = true;
                    navigate("/login"); // Redirect to login on timeout
                }
            }, 5000);

            // Function to fetch user data from backend
            const fetchUser = async () => {
                try {
                    // Fetch user data from backend using their Firebase UID
                    const res = await fetch(`http://localhost:8000/api/user/${currentUser.uid}`, { signal });
                    if (!res.ok) {
                        throw new Error(res.status === 404 ?
                            "User not found in database" :
                            "Server error while fetching user data"
                        );
                    }
                    // Parse JSON response and set it in state
                    const data = await res.json();
                    setUserData(data);
                } catch (err) {
                    // Ignore abort errors (already handled by timeout)
                    if (err.name !== "AbortError") {
                        setError(err.message);

                        // Redirect to login after 2 seconds so user can see error
                        setTimeout(() => {
                            if (!redirected) {
                                redirected = true;
                                navigate("/login");
                            }
                        }, 2000);
                    }
                } finally {
                    setLoading(false);  // Fetch is complete
                    clearTimeout(timeout); // Clear timeout if fetch succeeds or fails
                }
            };

            fetchUser();
        });

        return () => unsubscribe();
    }, [auth, navigate]);

    /**
    * Logout function
    * Logs the user out using Firebase auth and redirects to login page
    */
    const logout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    /**
      * Update profile fields (only lastName for now)
      */
 const updateUser = async ({ lastName }) => {
    if (!userData?.firebaseUid) throw new Error("User not loaded yet");

    try {
      const res = await fetch(`http://localhost:8000/api/user/${userData.firebaseUid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      setUserData(data); //Set local state to new user
      return data;
      
    } catch (err) {
      console.error("Update failed:", err);
      throw err;
    }
  };


    // Return relevant state cvariables/functions for other components/pages to use
    return { userData, loading, error, logout, updateUser, setUserData };
}