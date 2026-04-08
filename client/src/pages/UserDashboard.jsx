/**
 * UserDashboard.jsx
 * 
 * This page is essentially a logged in user's homepage, it stores various details about the user and their issues.
 * Uses a custom react hook (getUserData.js) to retrieve the user from Firebase auth server and return the object, also handles logout, page errors/loading .
 * 
 * Future work - overview of submitted issues (Summary page) Total issues submitted, status breakdown, Recent issues, quick buttons etc
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { getUserData } from "../hooks/getUserData";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {

    const { userData, loading, error, logout } = getUserData();
    // This custom hook (getUserData) contains the following:
    // userData - This is the mongoDB data for the currently logged in user
    // loading - this is true whilst the user data is being fetched
    // error - this will contain any error encountered during fetching
    // logout - this is the function to log the user out via Firebase auth  

    const navigate = useNavigate();

    //Display info to the user about what the page is doing
    if (loading) return <p>Loading user data...</p>;    //This will display whilst the data is being fetched from the database
    if (error) return <p>{error} Redirecting to login...</p>; //If there is an error, display and redirect
    if (!userData) return <p>No user data found.</p>;

    return (
        <div>
            <h1>User Dashboard</h1>
            
            {/* Display user details */}
            <p>Welcome, {userData.firstName} {userData.lastName}!</p>
            <br />
            <p>Email: {userData.email}</p>
            <p>Role: {userData.role}</p>
            <br />

            {/* Action buttons */}
            <button onClick={() => navigate("/profile")}>Edit Profile</button>
            <br/>
            <button onClick={logout}>Logout</button>
            
        </div>
    );
}