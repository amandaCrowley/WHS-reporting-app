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

import { useEffect, useState } from "react";
import { getUserData } from "../hooks/getUserData";
import { useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout"

export default function UserDashboard() {

    // Uses custom hook (getUserData) contains the following:
    // userData - This is the mongoDB data for the currently logged in user
    // loading - this is true whilst the user data is being fetched
    // error - this will contain any error encountered during fetching
    // logout - this is the function to log the user out via Firebase auth  
    const { userData, loading, error } = getUserData();
    const [recentIssues, setRecentIssues] = useState([]);
    const [issuesLoading, setIssuesLoading] = useState(true);
    const [issuesError, setIssuesError] = useState("");

    const navigate = useNavigate();
    const logout = userLogout();

    // Fetch last 2 issues submitted by this user
    useEffect(() => {
        if (!userData) return;

        const fetchIssues = async () => {
            try {
                setIssuesLoading(true);

                //limit=2 to only retrieve the 2 latest issues
                const res = await fetch(
                    `http://localhost:8000/api/issues/user/${userData.firebaseUid}?limit=2`
                );
                if (!res.ok) throw new Error("Failed to fetch issues");

                const data = await res.json();
                setRecentIssues(data);
            } catch (err) {
                console.error(err);
                setIssuesError(err.message || "Error fetching issues");
            } finally {
                setIssuesLoading(false);
            }
        };

        fetchIssues();
    }, [userData]);

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


            {/* Recent issues summary */}
            <h2>Recent Issues</h2>
            {issuesLoading ? (
                <p>Loading issues...</p>
            ) : issuesError ? (
                <p>Error: {issuesError}</p>
            ) : recentIssues.length === 0 ? (
                <p>No issues submitted yet.</p>
            ) : (
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                    {recentIssues.map(issue => (
                        <li
                            key={issue._id}
                            style={{
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                padding: "10px",
                                marginBottom: "10px",
                                backgroundColor: "#f9f9f9",
                            }}
                            onClick={() => navigate(`/issue/${issue._id}`)}
                        >
                            <strong>{issue.issueDescription}</strong> <br />
                            Status:  {issue.status} <br />
                            <em>{issue.location} | {issue.campus} </em>
                            <br />
                            Date reported: {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                                dateStyle: "short" //Just display the date
                            })}
                        </li>
                    ))}
                </ul>
            )}

            {/* Action buttons */}
            <button onClick={() => navigate("/reportissue")}>Report New Issue</button>
            <br />
            
            {/* Link to view all issues */}
            {recentIssues.length > 0 && (
                <button onClick={() => navigate("/myissues")}>View all issues</button>
            )}
            <br />

            <button onClick={() => navigate("/profile")}>Edit Profile</button>
            <br />
            <button onClick={logout}>Logout</button>
        </div>
    );
}