/**
 * UserDashboard.jsx
 *
 * Desktop dashboard page based on the final Figma / reference UI.
 * Uses the existing project hooks and routing.
 *
 * Interactive buttons implemented:
 * - Home
 * - Report Issues
 * - My Issues
 * - Profile
 * - Logout
 * - Report New Issue
 * - View My Issues
 * - Edit Profile
 *
 * Author/s: Grish Gautam
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import "./UserDashboard.css";

export default function UserDashboard() {
  // Custom hook to get the currently logged-in user's data
  const { userData, loading, error } = getUserData();

  // Stores all issues submitted by the current user
  const [issues, setIssues] = useState([]);

  // Loading state for issue fetching
  const [issuesLoading, setIssuesLoading] = useState(true);

  // Error state for issue fetching
  const [issuesError, setIssuesError] = useState("");

  // Used for page navigation
  const navigate = useNavigate();

  // Custom hook for Firebase logout
  const logout = userLogout();

  // Fetch all issues submitted by the logged-in user
  useEffect(() => {
    if (!userData) return;

    const fetchIssues = async () => {
      try {
        setIssuesLoading(true);
        setIssuesError("");

        const res = await fetch(
          `http://localhost:8000/api/issues/user/${userData.firebaseUid}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch issues");
        }

        const data = await res.json();
        setIssues(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setIssuesError(err.message || "Error fetching issues");
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchIssues();
  }, [userData]);

  // Calculate dashboard summary values from the issues list
  const stats = useMemo(() => {
    const total = issues.length;

    const open = issues.filter(
      (issue) => issue.status?.toLowerCase() === "open"
    ).length;

    const inProgress = issues.filter((issue) => {
      const status = issue.status?.toLowerCase();
      return status === "in progress" || status === "in-progress";
    }).length;

    const closed = issues.filter(
      (issue) => issue.status?.toLowerCase() === "closed"
    ).length;

    return {
      total,
      open,
      inProgress,
      closed,
    };
  }, [issues]);

  // Sort issues so the newest reported issues appear first in the table
  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      const dateA = new Date(a.dateTimeReported || 0).getTime();
      const dateB = new Date(b.dateTimeReported || 0).getTime();
      return dateB - dateA;
    });
  }, [issues]);

  if (loading) {
    return <p className="dashboard-message">Loading user data...</p>;
  }

  if (error) {
    return <p className="dashboard-message">{error} Redirecting to login...</p>;
  }

  if (!userData) {
    return <p className="dashboard-message">No user data found.</p>;
  }

  return (
    <div className="dashboard-shell">
      {/* Left sidebar navigation */}
      <aside className="dashboard-sidebar">
        {/* Sidebar brand/header */}
        <div className="dashboard-sidebar-brand">
          <div className="dashboard-brand-icon">📊</div>
          <div className="dashboard-brand-title">Dashboard</div>
        </div>

        {/* Sidebar navigation buttons */}
        <button
          type="button"
          className="dashboard-nav-item active"
          onClick={() => navigate("/userdashboard")}
        >
          <span className="dashboard-nav-icon">🏠</span>
          <span>Home</span>
        </button>

        <button
          type="button"
          className="dashboard-nav-item"
          onClick={() => navigate("/reportissue")}
        >
          <span className="dashboard-nav-icon">📄</span>
          <span>Report Issues</span>
        </button>

        <button
          type="button"
          className="dashboard-nav-item"
          onClick={() => navigate("/myissues")}
        >
          <span className="dashboard-nav-icon">‼️</span>
          <span>My Issues</span>
        </button>

        <button
          type="button"
          className="dashboard-nav-item"
          onClick={() => navigate("/profile")}
        >
          <span className="dashboard-nav-icon">👤</span>
          <span>Profile</span>
        </button>

        <button
          type="button"
          className="dashboard-nav-item logout"
          onClick={logout}
        >
          <span className="dashboard-nav-icon">↪</span>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main dashboard content */}
      <main className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-topbar">
  <h1>Dashboard</h1>

  <div className="dashboard-topbar-right">
    <span className="dashboard-welcome">
      Welcome, {userData.firstName || "User"}!
    </span>

    <div className="dashboard-avatar-wrap">
      <img
        src="https://cdn-icons-png.flaticon.com/512/4140/4140047.png"
        alt="User avatar"
        className="dashboard-avatar"
      />
    </div>
  </div>
</header>

        {/* Main content */}
        <section className="dashboard-content">
          {/* Stat cards */}
          <div className="dashboard-stats-grid">
            <div className="dashboard-card dashboard-card-wide">
              <div className="dashboard-card-icon">📄</div>
              <div className="dashboard-card-center">
                <h2>Total Issues Submitted</h2>
                <p>{issuesLoading ? "..." : stats.total}</p>
                <div className="dashboard-divider"></div>
              </div>
            </div>

            <div className="dashboard-card small stat-open">
              <div className="dashboard-card-heading">Open</div>
              <div className="dashboard-card-row">
                <div className="dashboard-status-icon warning">!</div>
                <div className="dashboard-side-number">
                  {issuesLoading ? "..." : stats.open}
                </div>
              </div>
            </div>

            <div className="dashboard-card small stat-progress">
              <div className="dashboard-card-heading">In Progress</div>
              <div className="dashboard-card-row">
                <div className="dashboard-status-icon neutral">◔</div>
                <div className="dashboard-side-number">
                  {issuesLoading ? "..." : stats.inProgress}
                </div>
              </div>
            </div>

            <div className="dashboard-card small stat-updates">
              <div className="dashboard-card-row">
                <div>
                  <div className="dashboard-tools-icon">🛠</div>
                  <div className="dashboard-card-subtext">Updates Ongoing</div>
                </div>
                <div className="dashboard-side-number">
                  {issuesLoading ? "..." : stats.inProgress}
                </div>
              </div>
            </div>

            <div className="dashboard-card small stat-closed">
              <div className="dashboard-card-heading">Closed</div>
              <div className="dashboard-card-row">
                <div>
                  <div className="dashboard-status-icon success">✓</div>
                  <div className="dashboard-card-subtext">
                    Recently Resolved
                  </div>
                </div>
                <div className="dashboard-side-number">
                  {issuesLoading ? "..." : stats.closed}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="dashboard-actions-panel">
            <div className="dashboard-actions">
              <button
                type="button"
                className="primary-action"
                onClick={() => navigate("/reportissue")}
              >
                + Report New Issue
              </button>

              <button
                type="button"
                className="secondary-action"
                onClick={() => navigate("/myissues")}
              >
                View My Issues
              </button>

              <button
                type="button"
                className="secondary-action"
                onClick={() => navigate("/profile")}
              >
                Edit Profile
              </button>
            </div>

            {/* Issues table */}
            <div className="dashboard-table-wrapper">
              {issuesLoading ? (
                <p className="dashboard-message">Loading issues...</p>
              ) : issuesError ? (
                <p className="dashboard-message">Error: {issuesError}</p>
              ) : sortedIssues.length === 0 ? (
                <p className="dashboard-message">No issues submitted yet.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIssues.map((issue) => (
                      <tr key={issue._id}>
                        <td>{issue._id ? `#${issue._id.slice(-4)}` : "-"}</td>
                        <td>
                          {issue.dateTimeReported
                            ? new Date(
                                issue.dateTimeReported
                              ).toLocaleDateString("en-AU")
                            : "-"}
                        </td>
                        <td>{issue.location || "-"}</td>
                        <td>{issue.status || "-"}</td>
                        <td>
                          <button
                            type="button"
                            className="dashboard-view-btn"
                            onClick={() => navigate(`/issue/${issue._id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
