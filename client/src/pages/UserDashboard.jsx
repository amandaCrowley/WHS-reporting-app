/**
 * UserDashboard.jsx
 * 
 * This component displays a user's dashboard page.
 * It contains the logged-in user's information and provides a logout option.
 * 
 * Future work - overview of submitted issues (Summary page) Total issues submitted, status breakdown, Recent issues, quick buttons etc
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { useEffect, useState } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {

    //State variables
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const auth = getAuth(); //Get firebase auth object to access current user
    const navigate = useNavigate(); //Get use navigate object so we can navigate to the login page after logout

    useEffect(() => {
        let redirected = false; //Prevent multiple redirects

        //Check there is a user logged in on page load/reload
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate("/login");  // No user logged in, redirect to login
                return;
            }

            //If the data takes too long to load we'll redirect the user back to the login page
            const controller = new AbortController();
            const signal = controller.signal;

            //Set a 5-second timeout to abort fetching user data if it takes too long
            const timeout = setTimeout(() => {
                console.warn("Fetch timed out. Redirecting to login...");
                controller.abort();

                if (!redirected) {
                    redirected = true;
                    navigate("/login");
                }
            }, 5000);

            //Function to fetch user data from the backend server using the current user's Firebase UID
            const fetchUserData = async () => {
                if (!currentUser) return;

                try {
                    const res = await fetch(
                        `http://localhost:8000/api/user/${currentUser.uid}`,
                        { signal } //Attach abort signal so timeout works
                    );

                    //More specific error handling
                    if (!res.ok) {
                        if (res.status === 404) {
                            throw new Error("User not found in database");
                        } else {
                            throw new Error("Server error while fetching user data");
                        }
                    }

                    const data = await res.json();
                    setUserData(data); //Set the user data state variable to the data returned from the backend

                } catch (err) {
                    console.error(err);

                    //Ignore abort error (already handled by timeout)
                    if (err.name === "AbortError") return;

                    setError(err.message);

                    // Redirect after 2 seconds so user can see the error message
                    setTimeout(() => {
                        if (!redirected) {
                            redirected = true;
                            navigate("/login");
                        }
                    }, 2000);

                } finally {
                    setLoading(false);
                    clearTimeout(timeout); //Clear timeout if fetch data succeeded or failed
                }
            };

            fetchUserData(); //Call the function to fetch user data from the backend
        });

        return () => unsubscribe(); //Cleanup for when we are directed away from this page
    }, [auth, navigate]);


    //Function to log the user out of the app
    const logoutUser = async () => {
        try {
            await signOut(auth);
            navigate("/login"); //On successful logout, navigate the user to the login page
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    //Display info to the user
    if (loading) return <p>Loading user data...</p>;
    if (error) return <p>{error} Redirecting to login...</p>;
    if (!userData) return <p>No user data found.</p>;

    return (
        <div>
            <h1>User Dashboard</h1>
            <p>Welcome, {userData.firstName} {userData.lastName}!</p>
            <br />
            <p>Email: {userData.email}</p>
            <p>Role: {userData.role}</p>
            <br />
            <button onClick={logoutUser}>Logout</button> {/* Add button so user can logout */}
        </div>
    );
}