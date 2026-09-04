/**
 * AdminDashboard.jsx
 *
 * This page is displayed when an admin user navigates to the admin dashboard.
 *
 * It displays a list of issues assigned to the admin user, as well as a summary of recent unassigned issues in the system.
 * It also provides navigation buttons to other admin pages, such as manage issues and user management.
 * 
 * Author/s: Dinh Dinh & Amanda Foxley
 * Date: 27/8/26
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const logout = userLogout();
  const { userData, loading, error } = getUserData(); // Custom hook to fetch user data from the backend using the user's Firebase UID
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    //set default values for dashboard statistics to avoid undefined errors before data is fetched
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    unassigned: 0,
    assignedToMe: 0,
  });
  const [issuesLoading, setIssuesLoading] = useState(true);

  useEffect(() => {
    if (!userData?.firebaseUid) return;

    // Method to fetch dashboard statistics and issue lists from the backend using the admin user's Firebase UID
    const fetchDashboardData = async () => {
      try {
        setIssuesLoading(true);

        const dashboardResponse = await fetch(`http://localhost:8000/api/admin/dashboard/${userData.firebaseUid}`); //get dashboard data for the admin user from the backend using their Firebase UID

        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch admin dashboard data");
        }

        const dashboardData = await dashboardResponse.json(); // Parse the response data as JSON

        setDashboardStats(dashboardData.stats || {}); // Update the dashboard statistics state with the fetched data, or an empty object if no stats are returned
        setAssignedIssues(Array.isArray(dashboardData.assignedIssues) ? dashboardData.assignedIssues : []); // Update the assigned issues state with the fetched data, or an empty array if no assigned issues are returned
        setRecentIssues(Array.isArray(dashboardData.recentIssues) ? dashboardData.recentIssues : []); // Update the recent issues state with the fetched data, or an empty array if no recent issues are returned
      } catch (err) {
        console.error(err);
        setAssignedIssues([]);
        setRecentIssues([]);
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchDashboardData(); // Call the method to fetch dashboard data when the component mounts or when userData changes
  }, [userData]);

  // Display loading or error messages if data is still being fetched or if there was an error fetching user data
  if (loading) {
    return <div className="admin-dashboard"><h1>Admin Dashboard</h1><p>Loading admin data...</p></div>;
  }
  if (error) {
    return <div className="admin-dashboard"><h1>Admin Dashboard</h1><p>{error}</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <div>
        <h1>Admin Dashboard</h1>
      </div>
      <div>
        <button type="button" onClick={() => navigate("/admin/manageissues")}>Manage Issues</button>
        <button type="button" onClick={() => navigate("/admin/usermanagement")}>User Management</button>
        <button type="button" onClick={logout}>Logout</button>
      </div>

      <section>
        <h2>Overview</h2>
        <div>
          <div>
            <h3>Total Issues</h3>
            <p>{dashboardStats.total}</p>
          </div>
          <div>
            <h3>Open</h3>
            <p>{dashboardStats.open}</p>
          </div>
          <div>
            <h3>In Progress</h3>
            <p>{dashboardStats.inProgress}</p>
          </div>
          <div>
            <h3>Closed</h3>
            <p>{dashboardStats.closed}</p>
          </div>
          <div>
            <h3>Unassigned</h3>
            <p>{dashboardStats.unassigned}</p>
          </div>
          <div>
            <h3>My assigned issues</h3>
            <p>{dashboardStats.assignedToMe}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>My assigned issues</h2>
        <p style={{ fontStyle: "italic" }}>Open and in-progress issues currently assigned to you.</p>
        {issuesLoading ? (
          <p>Loading assigned issues...</p>
        ) : assignedIssues.length === 0 ? (
          <p>No open issues assigned to you.</p>
        ) : (

          // List to display all issues assigned to this admin that have not been closed
          <ul>

            {assignedIssues
              .filter((issue) => issue.status !== "Closed")
              .map((issue) => (
                <li key={issue._id}>
                  <strong>{issue.title}</strong>
                  <div>{issue.location} · {issue.campus}</div>
                  <div>Status: {issue.status}</div>
                  <div>Priority: {issue.priority || "Not set"}</div>
                  <div>Assigned to: {issue.assignedToName || "Unassigned"}</div>
                  <div>
                    Reported: {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                  <button type="button" onClick={() => navigate(`/issue/${issue._id}`)}>
                    View Issue
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Recent Unassigned Issues</h2>
        <p style={{ fontStyle: "italic" }}>The most recently reported issues that are not currently assigned to an admin.</p>
        {issuesLoading ? (
          <p>Loading recent issues...</p>
        ) : recentIssues.length === 0 ? (
          <p>No recent unassigned issues.</p>
        ) : (

          // List to display the most recent unassigned issues in the system
          <ul>
            {recentIssues.map((issue) => (
              <li key={issue._id}>
                <strong>{issue.title}</strong>
                <div>{issue.campus} · {issue.location}</div>
                <div>Status: {issue.status}</div>
                <div>Priority: {issue.priority || "Not set"}</div>
                <div>Assigned to: {issue.assignedToName || "Unassigned"}</div>
                <div>
                  {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
                <button type="button" onClick={() => navigate(`/issue/${issue._id}`)}>
                  View Issue
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
