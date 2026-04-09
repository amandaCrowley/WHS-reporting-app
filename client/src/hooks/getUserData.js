/**
 * This is a custom hook to manage authenticated user data using Firebase authentication.
 * 
 * It handles fetching user details from the backend (MongoDB) based on the Firebase UID, 
 * It also uses state management for loading and error handling
 * It contains a helper function for updating user data, this is used on the userProfile page
 * 
 * Key features:
 * - userData: Stores the current user's data from the backend using the Firebase UID of the authenticated user.
 * - loading: boolean, true while fetching user data - state for pages/components to use to incdicate the loading status of the fetch operation
 * - error: string, any error encountered during fetching - state for pages/components to use to incdicate the error status of the fetch operation
 * - updateUser: updates allowed fields (currently only `lastName`) in the database
 * - setUserData: `setUserData()` allows direct manipulation of local user data without a backend call.
 * 
 * Usage:
 * const { userData, loading, error, logout, updateUser, setUserData } = getUserData();
 * 
 * Author/s: Amanda Foxley
 * Date: 8/4/26
 */

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export function getUserData() {

    //State information
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

        //Clean up once method has finished tasks
        return () => unsubscribe();
    }, [auth, navigate]);

    /**
      * Update user profile fields (currently only lastName)
      * @param {Object} param0 Object containing { lastName }
      * @returns Updated user data from backend
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

            setUserData(data); //Update local state to new user
            return data; //Return updated user data

        } catch (err) {
            console.error("Update failed:", err);
            throw err;
        }
    };


    // Return relevant state cvariables/functions for other components/pages to use
    return { userData, loading, error, updateUser, setUserData };
}
