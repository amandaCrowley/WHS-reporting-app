/**
 * IssueDetails.jsx
 *
 * This page displays all of the details of a single issue, including:
 *  - Description, status, location, campus, reported data and time, witnesses, staff assignment and any images attached to the issue
 *
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import "../styles/IssueDetails.css";

export default function IssueDetails() {
  const { issueId } = useParams(); // Get the issue ID from the URL
  const navigate = useNavigate();
  const logout = userLogout(); //Handle logout using logout hook

  //Local state variables
  const [issue, setIssue] = useState(null); // Stores the fetched issue details
  const [loading, setLoading] = useState(true); // True while fetching the issue
  const [error, setError] = useState(""); // Stores any error messages

  /**
   * Fetch the issue details from the server/backend when this page/component loads or if the issueId changes
   */
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        // Call backend API to fetch issue by ID
        const res = await fetch(`http://localhost:8000/api/issues/${issueId}`);
        if (!res.ok) throw new Error("Failed to fetch issue");
        const data = await res.json();

        setIssue(data); // Store fetched issue in state
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false); // Stop loading regardless of success/failure
      }
    };

    fetchIssue(); //Call method to fetch the issue by ID from the backend
  }, [issueId]);

  // side bar if necessary
  const Sidebar = () => (
    <aside className="report-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">📊</div>
        <h2>Dashboard</h2>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className="sidebar-item"
          onClick={() => navigate("/userdashboard")}
        >
          <span className="sidebar-icon">🏠</span>
          <span>Home</span>
        </button>

        <button
          type="button"
          className="sidebar-item"
          onClick={() => navigate("/reportissue")}
        >
          <span className="sidebar-icon">📄</span>
          <span>Report Issues</span>
        </button>

        <button
          type="button"
          className="sidebar-item active"
          onClick={() => navigate("/myissues")}
        >
          <span className="sidebar-icon">‼️</span>
          <span>My Issues</span>
        </button>

        <button
          type="button"
          className="sidebar-item"
          onClick={() => navigate("/profile")}
        >
          <span className="sidebar-icon">👤</span>
          <span>Profile</span>
        </button>

        <button type="button" className="sidebar-item" onClick={logout}>
          <span className="sidebar-icon">↪</span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );



  // Maps an issue status to the matching badge class (same classes as UserMyIssues)
  const getStatusClass = (status) => {
    if (status === "Open") return "user-my-issues-status-open";
    if (status === "In Progress") return "user-my-issues-status-progress";
    if (status === "Resolved") return "user-my-issues-status-resolved";
    return "";
  };

  //Display info to the user about what the page is doing
  if (loading) {
    return (
      <div className="report-layout">
        <Sidebar />
        <div className="issues-details-container">
          <div className="issue-details-status">Loading issue data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-layout">
        <Sidebar />
        <div className="issues-details-container">
          <div className="issue-details-status issue-details-status-error">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="report-layout">
        <Sidebar />
        <div className="issues-details-container">
          <div className="issue-details-status">No issue found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-layout">
      <Sidebar />

      <div className="issues-details-container">
        <header className="issue-details-header">
          <div>
            <h1 className="issue-details-title">Issue Details</h1>
          </div>

          <span
            className={`user-my-issues-status-badge ${getStatusClass(issue.status)}`}
          >
            {issue.status}
          </span>
        </header>

        <section className="issue-details-card">
          <div className="issue-details-card-header">Description</div>
          <div className="issue-details-card-body">
            <p>{issue.issueDescription}</p>
          </div>
        </section>

        <div className="issue-details-grid">
          <section className="issue-details-card">
            <div className="issue-details-card-header">Location</div>
            <div className="issue-details-card-body">
              <div className="issue-details-row">
                <span className="issue-details-icon">📍</span>
                <span>
                  {issue.location}, {issue.campus}
                </span>
              </div>
            </div>
          </section>

          <section className="issue-details-card">
            <div className="issue-details-card-header">Reported On</div>
            <div className="issue-details-card-body">
              <div className="issue-details-row">
                <span className="issue-details-icon">🕒</span>
                <span>
                  {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </section>

          <section className="issue-details-card">
            <div className="issue-details-card-header">Assigned To</div>
            <div className="issue-details-card-body">
              <div className="issue-details-row">
                <span className="issue-details-icon">👤</span>
                <span>
                  {issue.assignedTo ? issue.assignedTo : "Unassigned"}
                </span>
              </div>
            </div>
          </section>

          {issue.witnessNames && issue.witnessNames.length > 0 && (
            <section className="issue-details-card">
              <div className="issue-details-card-header">Witnesses</div>
              <div className="issue-details-card-body">
                <div className="witness-pill-container">
                  {issue.witnessNames.map((name, i) => (
                    <span className="witness-pill" key={i}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {issue.imageURL && issue.imageURL.length > 0 && (
          <section className="issue-details-card">
            <div className="issue-details-card-header">Image/s</div>
            <div className="issue-details-card-body">
              <div className="issue-details-image-row">
                {issue.imageURL.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Issue evidence"
                    className="issue-details-image"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="issue-details-actions">
          <button
            className="btn primary-btn"
            onClick={() => navigate(`/editIssue/${issueId}`)}
          >
            Edit Issue
          </button>
          <button
            className="btn secondary-btn"
            onClick={() => navigate("/myissues")}
          >
            Back to my issues
          </button>
          <button
            className="btn secondary-btn"
            onClick={() => navigate("/userdashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
