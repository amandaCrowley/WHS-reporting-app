/**
 * AdminUserDetails.jsx
 *
 * Page for viewing a user's account details and reported issues.
 * 
 * Author/s: Amanda Foxley
 * Date: 31/8/26
 * Modified by: Dinh Dinh
 * Date: 6/9/26
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import "../styles/AdminUserDetails.css";

export default function AdminUserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const logout = userLogout();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportedIssues, setReportedIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState("");

  /* Fetch user details on component mount */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/admin/users/${userId}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load user details.");
        }

        setUser(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load user details.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  /* Fetch only issues reported by the selected user */
  useEffect(() => {
    const fetchReportedIssues = async () => {
      setIssuesLoading(true);
      setIssuesError("");

      try {
        const response = await fetch(
          `http://localhost:8000/api/issues/user/${user.firebaseUid}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load reported issues.");
        }

        setReportedIssues(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setIssuesError(err.message || "Could not load reported issues.");
      } finally {
        setIssuesLoading(false);
      }
    };

    if (user?.firebaseUid) {
      fetchReportedIssues();
    }
  }, [user]);

  
  return (
    <div className="admin-user-details">
      <div>
        <button type="button" onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
        <button type="button" onClick={() => navigate("/admin/manageissues")}>Manage Issues</button>
        <button type="button" onClick={() => navigate("/admin/usermanagement")}>User Management</button>
        <button type="button" onClick={logout}>Logout </button>
      </div>

      <section>
        <h2>Account Information</h2>
        {loading && <p>Loading user information...</p>}
        {error && <p role="alert">{error}</p>}

        {/* Display account information here */}

        {user && (
          <div className="account-information">
            <p>
              <strong>Name:</strong> {user.firstName || ""}{" "}
              {user.lastName || ""}
            </p>
            <p>
              <strong>Email:</strong> {user.email || "Not provided"}
            </p>
            <p>
              <strong>Role:</strong> {user.role || "Not provided"}
            </p>
            <p>
              <strong>Account Type:</strong>{" "}
              {user.isAdmin ? "Administrator" : "Standard User"}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(`/admin/users/${userId}/edit`)}
        >
          Edit User Details
        </button>
      </section>

      <section>
        <h2>Reported Issues</h2>
        {issuesLoading && <p>Loading reported issues...</p>}
        {issuesError && <p role="alert">{issuesError}</p>}
        
        {/* Display account reported issues here */}

        {!issuesLoading && !issuesError && reportedIssues.length === 0 && (
          <p>This user has not reported any issues.</p>
        )}

        {reportedIssues.length > 0 && (
          <ul className="reported-issues-list">
            {reportedIssues.map((issue) => (
              <li key={issue._id} className="reported-issue">
                <h3>{issue.title || "Untitled issue"}</h3>
                <p>
                  {issue.additionalDetails ||
                    issue.issueDescription ||
                    "No description provided."}
                </p>
                <p>
                  <strong>Status:</strong> {issue.status || "Not provided"}
                </p>
                <p>
                  <strong>Priority:</strong> {issue.priority || "Not set"}
                </p>
                <p>
                  <strong>Location:</strong> {issue.location || "Not provided"}
                  {issue.campus ? ` - ${issue.campus}` : ""}
                </p>
                <p>
                  <strong>Date reported:</strong>{" "}
                  {issue.dateTimeReported
                    ? new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Not provided"}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/issue/${issue._id}`)}
                >
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




