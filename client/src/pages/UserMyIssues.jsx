/**
 * UserMyIssues.jsx
 * 
 * This page lists all issues submitted by the currently logged in user
 * 
 * Users can search for a specific issue by description location or campus
 * They can also filter their issues by status
 * 
 * Author/s: Grish Gautam
 * Date: 23/4/26
 */

import "./UserMyIssues.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";

export default function UserMyIssues() {
  const navigate = useNavigate();
  const logout = userLogout();
  const { userData } = getUserData();

  const displayName = userData?.firstName || userData?.name || "User";

  // State variables
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /**
   * Fetches all issues submitted by the current user from the backend server
   */
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setError("No user is currently logged in.");
          setLoading(false);
          return;
        }

        const res = await fetch(`http://localhost:8000/api/issues/user/${user.uid}`);

        if (!res.ok) {
          throw new Error("Failed to fetch issues from server.");
        }

        const data = await res.json();

        setIssues(data);
        setFilteredIssues(data);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Failed to load your issues.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  /**
   * Filter or search for issues whenever the search input, status filter,
   * or original issues change
   */
  useEffect(() => {
    let temp = [...issues];

    if (statusFilter !== "All") {
      temp = temp.filter((issue) => issue.status === statusFilter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();

      temp = temp.filter(
        (issue) =>
          issue.issueDescription?.toLowerCase().includes(searchLower) ||
          issue.campus?.toLowerCase().includes(searchLower) ||
          issue.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredIssues(temp);
  }, [search, statusFilter, issues]);

  /**
   * Returns the CSS class for the issue status badge
   */
  const getStatusClass = (status) => {
    if (status === "Open") return "user-my-issues-status-open";
    if (status === "In Progress") return "user-my-issues-status-progress";
    if (status === "Resolved") return "user-my-issues-status-resolved";
    return "";
  };

  /**
   * Formats the reported date for display
   */
  const formatReportedDate = (dateValue) => {
    if (!dateValue) return "N/A";

    return new Date(dateValue).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="user-my-issues-page">
        <div className="user-my-issues-loading">Loading your issues...</div>
      </div>
    );
  }

  return (
    <div className="user-my-issues-page">
      <div className="user-my-issues-topbar">
        <div className="user-my-issues-heading">
          <h1>My Issues</h1>
          <p>View and manage all issues you have reported.</p>
        </div>

        <div className="user-my-issues-user">
          <span className="user-my-issues-user-text">
            Welcome, {displayName}!
          </span>

          <div className="user-my-issues-avatar-wrap">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4140/4140047.png"
              alt="User avatar"
              className="user-my-issues-avatar"
            />
          </div>
        </div>
      </div>

      <div className="user-my-issues-panel">
        {error && <div className="user-my-issues-error">{error}</div>}

        <div className="user-my-issues-controls">
          <div className="user-my-issues-search-group">
            <div className="user-my-issues-search-box">
              <span className="user-my-issues-search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search by description, campus or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="user-my-issues-filter-group">
            <label htmlFor="statusFilter">Filter by Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="user-my-issues-list">
          {filteredIssues.length === 0 ? (
            <div className="user-my-issues-empty">No issues found.</div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="user-my-issues-card"
                onClick={() => navigate(`/issue/${issue._id}`)}
              >
                <div className="user-my-issues-card-left">
                  <h2>{issue.issueDescription}</h2>

                  {issue.additionalDetails ? (
                    <p>{issue.additionalDetails}</p>
                  ) : (
                    <p>{issue.issueDescription}</p>
                  )}

                  <div className="user-my-issues-meta">
                    <div className="user-my-issues-meta-item">
                      <span className="user-my-issues-meta-icon">📍</span>
                      <span>{issue.location || "Unknown location"}</span>
                    </div>

                    <span className="user-my-issues-meta-divider">|</span>

                    <div className="user-my-issues-meta-item">
                      <span className="user-my-issues-meta-icon">🏢</span>
                      <span>{issue.campus || "Unknown campus"}</span>
                    </div>
                  </div>
                </div>

                <div className="user-my-issues-card-right">
                  <p className="user-my-issues-card-right-label">Status</p>
                  <span
                    className={`user-my-issues-status-badge ${getStatusClass(issue.status)}`}
                  >
                    {issue.status}
                  </span>

                  <div className="user-my-issues-date-block">
                    <p className="user-my-issues-date-title">Date Reported</p>
                    <p className="user-my-issues-date-value">
                      {formatReportedDate(issue.dateTimeReported)}
                    </p>
                  </div>
                </div>

                <div className="user-my-issues-card-arrow">›</div>
              </div>
            ))
          )}
        </div>

        <div className="user-my-issues-footer">
          <div className="user-my-issues-count">
            Showing 1 to {filteredIssues.length} of {filteredIssues.length} issues
          </div>

          <div className="user-my-issues-pagination">
            <button className="user-my-issues-page-btn">‹</button>
            <button className="user-my-issues-page-btn active">1</button>
            <button className="user-my-issues-page-btn">2</button>
            <button className="user-my-issues-page-btn">›</button>
          </div>
        </div>
      </div>

      <div className="user-my-issues-bottom-actions">
        <button
          className="user-my-issues-back-btn"
          onClick={() => navigate("/userdashboard")}
        >
          ← Back to Dashboard
        </button>

        <button className="user-my-issues-logout-btn" onClick={logout}>
          ⎋ Logout
        </button>
      </div>
    </div>
  );
}