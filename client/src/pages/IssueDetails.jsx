/**
 * IssueDetails.jsx
 *
 * This page displays all of the details of a single issue, including:
 *  - Description, status, location, campus, reported data and time, witnesses, staff assignment and any images attached to the issue
 * Admin users can also assign the issue to themselves, unassign the issue, and update the status of the issue.
 *
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";
import "../styles/IssueDetails.css";

export default function IssueDetails() {
  const { issueId } = useParams(); // Get the issue ID from the URL
  const navigate = useNavigate();
  const logout = userLogout(); //Handle logout using logout hook
  const { userData } = getUserData();

  //Local state variables
  const [issue, setIssue] = useState(null); // Stores the fetched issue details
  const [loading, setLoading] = useState(true); // True while fetching the issue
  const [error, setError] = useState(""); // Stores any error messages
  const [assigningIssue, setAssigningIssue] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Fetch the issue details from the server/backend when this page/component loads or if the issueId changes
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

    fetchIssue();
  }, [issueId]);

  const addComment = async (event) => {
    event.preventDefault();
    const comment = newComment.trim();
    if (!comment || !userData?.firebaseUid) return;

    try {
      setAddingComment(true);
      setCommentError("");
      const response = await fetch(`http://localhost:8000/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: userData.firebaseUid, comment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add comment");

      setIssue(prev => ({ ...prev, issueComments: [...(prev.issueComments || []), data] }));
      setNewComment("");
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setAddingComment(false);
    }
  };

  //Helper method to assign the issue to the current user/admin. This will update the assignedTo field in the mongoDB database for that issue to the current user's id.
  const assignIssueToMe = async () => {
    if (!userData?.firebaseUid || !issue?._id) return;

    try {
      setAssigningIssue(true);
      const response = await fetch(`http://localhost:8000/api/issues/${issue._id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: userData.firebaseUid }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to assign issue");
      }

      const updatedIssue = await response.json();
      setIssue(updatedIssue);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not assign issue");
    } finally {
      setAssigningIssue(false);
    }
  };

  // Helper method to unassign the issue from the current user/admin. This will update the assignedTo field in the mongoDB database for that issue to null.
  const unassignIssue = async () => {
    if (!issue?._id) return;

    try {
      setAssigningIssue(true);
      const response = await fetch(`http://localhost:8000/api/issues/${issue._id}/unassign`, {
        method: "PUT",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to unassign issue");
      }

      const updatedIssue = await response.json();
      setIssue(updatedIssue);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not unassign issue");
    } finally {
      setAssigningIssue(false);
    }
  };

  //Helper method to update the status of the issue. This will update the status field in the mongoDB database for that issue to the nextStatus value.
  const updateIssueStatus = async (nextStatus) => {
    if (!issue?._id) return;
    if (nextStatus === "Closed" && !issue.issueComments?.some((issueComment) => issueComment.comment?.trim())) {
      setStatusError("Add at least one resolution comment stating how the issue was resolved before closing this issue.");
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");
      const response = await fetch(`http://localhost:8000/api/issues/${issue._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update issue status");
      }

      const updatedIssue = await response.json();
      setIssue(updatedIssue);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not update issue status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // side bar if necessary
  const Sidebar = () => (
    <aside className="report-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">📊</div>
        <h2>Dashboard</h2>
      </div>

      <nav className="sidebar-nav">
        {!userData?.isAdmin && (
          <>
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
          </>
        )}

        {userData?.isAdmin && (
          <>
            <button
              type="button"
              className="sidebar-item"
              onClick={() => navigate("/admin/dashboard")}
            >
              <span className="sidebar-icon">🏠</span>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => navigate("/admin/manageissues")}
            >
              <span className="sidebar-icon">🛠️</span>
              <span>Manage Issues</span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => navigate("/admin/usermanagement")}
            >
              <span className="sidebar-icon">👥</span>
              <span>User Management</span>
            </button>
          </>
        )}

        <button type="button" className="sidebar-item" onClick={logout}>
          <span className="sidebar-icon">↪</span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );



  // Maps an issue status to the matching CSS class for styling the status badge. This is used to visually differentiate between different issue statuses.
  const getStatusClass = (status) => {
    if (status === "Open") return "user-my-issues-status-open";
    if (status === "In Progress") return "user-my-issues-status-progress";
    if (status === "Closed") return "user-my-issues-status-resolved";
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
          <div className="issue-details-heading">
            <p className="issue-details-eyebrow">Issue report</p>
            <h1 className="issue-details-title">{issue.title}</h1>
          </div>

          <span
            className={`user-my-issues-status-badge ${getStatusClass(issue.status)}`}
          >
            {issue.status}
          </span>
        </header>

        <div className="issue-details-summary">
          <div className="issue-summary-item">
            <span className="issue-summary-label">Reported by</span>
            <span>{issue.reportedByName || "Unknown reporter"}</span>
          </div>
          <div className="issue-summary-item">
            <span className="issue-summary-label">Incident</span>
            <span>
              {issue.dateTimeIssueOccurred
                ? new Date(issue.dateTimeIssueOccurred).toLocaleString("en-AU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "Not recorded"}
            </span>
          </div>
          <div className="issue-summary-item">
            <span className="issue-summary-label">Assigned to</span>
            <span>{issue.assignedToName || "Unassigned"}</span>
          </div>
          <div className="issue-summary-item">
            <span className="issue-summary-label">Location</span>
            <span>{issue.location || "Unknown location"}</span>
          </div>
          <div className="issue-summary-item">
            <span className="issue-summary-label">Campus</span>
            <span>{issue.campus || "Unknown campus"}</span>
          </div>
          <div className="issue-summary-item">
            <span className="issue-summary-label">Witnesses</span>
            <span>{issue.witnessNames?.length ? `${issue.witnessNames.length} recorded` : "No witnesses"}</span>
          </div>
        </div>

        <div className="issue-details-main-layout">
          <div className="issue-details-main-column">
            <section className="issue-details-card">
              <div className="issue-details-card-header">Description</div>
              <div className="issue-details-card-body">
                <p>{issue.issueDescription || "No description provided."}</p>
              </div>
            </section>

            {issue.additionalDetails && (
              <section className="issue-details-card">
                <div className="issue-details-card-header">Additional details</div>
                <div className="issue-details-card-body">
                  <p>{issue.additionalDetails}</p>
                </div>
              </section>
            )}

            {issue.imageURLs && issue.imageURLs.length > 0 && (
              <section className="issue-details-card">
                <div className="issue-details-card-header">Evidence</div>
                <div className="issue-details-card-body">
                  <div className="issue-details-image-row">
                    {issue.imageURLs.map((url, i) => (
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

            <section className="issue-details-card">
              <div className="issue-details-card-header">Admin Comments</div>

              <div className="issue-details-card-body">

                {/* Existing comments */}
                {issue.issueComments?.length ? (
                  <div className="issue-comments-list">
                    {issue.issueComments.map((issueComment) => (
                      <div
                        className="issue-comment"
                        key={issueComment._id}
                      >
                        <p>{issueComment.comment}</p>

                        <small>
                          {issueComment.commentedByName} ·{" "}
                          {new Date(
                            issueComment.dateTimeCommented
                          ).toLocaleString("en-AU")}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="issue-details-empty-text">
                    No comments recorded.
                  </p>
                )}

                {/* Add a new comment */}
                {userData?.isAdmin && (
                  <form
                    className="issue-comment-form"
                    onSubmit={addComment}
                  >
                    <textarea
                      value={newComment}
                      onChange={(event) =>
                        setNewComment(event.target.value)
                      }
                      maxLength={300}
                      placeholder="Add a progress or resolution comment"
                      aria-label="New admin comment"
                    />

                    <button
                      type="submit"
                      disabled={
                        addingComment || !newComment.trim()
                      }
                    >
                      {addingComment ? "Adding..." : "Add comment"}
                    </button>

                    {commentError && (
                      <p className="issue-comment-error">
                        {commentError}
                      </p>
                    )}
                  </form>
                )}

              </div>
            </section>
          </div>

          {/* Side column for witness information */}
          <aside className="issue-details-side-column">
            <section className="issue-details-card">
              <div className="issue-details-card-header">Witnesses</div>
              <div className="issue-details-card-body">
                {issue.witnessNames && issue.witnessNames.length > 0 ? (
                  <div className="witness-pill-container">
                    {issue.witnessNames.map((name, i) => (
                      <span className="witness-pill" key={i}>
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="issue-details-empty-text">No witnesses recorded.</p>
                )}
              </div>
            </section>

            {/* Side column for additional relevant information */}
            <section className="issue-details-card">
              <div className="issue-details-card-header">Issue snapshot</div>
              <div className="issue-details-card-body issue-details-meta-list">
                <div className="issue-meta-row">
                  <span>Status</span>
                  {userData?.isAdmin ? (
                    <select
                      value={issue.status || "Open"}
                      onChange={(e) => updateIssueStatus(e.target.value)}
                      disabled={updatingStatus}
                      title="Change the issue status"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                  ) : (
                    <strong>{issue.status}</strong>
                  )}
                </div>

                {statusError && (
                  <p className="issue-status-error">{statusError}</p>
                )}
                <div className="issue-meta-row">
                  <span>Priority</span>
                  <strong>{issue.priority || "Not set"}</strong>
                </div>
                <div className="issue-meta-row">
                  <span>Reported date</span>
                  <strong>
                    {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </strong>
                </div>
                <div className="issue-meta-row">
                  <span>Location</span>
                  <strong>{issue.location || "Unknown"}</strong>
                </div>
                <div className="issue-meta-row">
                  <span>Campus</span>
                  <strong>{issue.campus || "Unknown"}</strong>
                </div>
                <div className="issue-meta-row">
                  <span>Assigned</span>
                  <strong>{issue.assignedToName || "Unassigned"}</strong>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Admin actions section - This will be displayed if the current user is an admin user */}
        {userData?.isAdmin && (
          <div className="issue-details-actions admin-actions">
            {statusError && <p className="issue-status-error">{statusError}</p>}
            {!issue.assignedTo || issue.assignedTo === userData?._id ? (
              <button
                className="btn primary-btn"
                type="button"
                onClick={assignIssueToMe}
                disabled={assigningIssue || issue.assignedTo === userData?._id || issue.status === "Closed"}
              >
                {assigningIssue ? "Assigning..." :
                  issue.assignedTo === userData?._id ? "Assigned to You" : "Assign to Me"}
              </button>
            ) : null}

            {issue.assignedTo && (
              <button
                className="btn secondary-btn"
                type="button"
                onClick={unassignIssue}
                disabled={assigningIssue || issue.status === "Closed"}
                title={issue.status === "Closed" ? "Closed issues cannot be reassigned or unassigned" : undefined}
                style={issue.status === "Closed" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                {assigningIssue ? "Updating..." : "Unassign"}
              </button>
            )}

            <button
              className="btn primary-btn"
              type="button"
              onClick={() => navigate(`/editIssue/${issueId}`)}
              disabled={issue.status === "Closed"}
              title={
                issue.status === "Closed"
                  ? "Closed issues cannot be edited"
                  : "Edit this issue"
              }
              style={
                issue.status === "Closed"
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : undefined
              }
            >
              Edit Issue
            </button>

            <button
              className="btn secondary-btn"
              type="button"
              onClick={() => navigate("/admin/manageissues")}
            >
              Back to Manage Issues
            </button>
          </div>
        )}

        {/* Normal user actions section - This will be displayed if the current user is NOT an admin user */}
        {!userData?.isAdmin && (
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
        )}
      </div>
    </div>
  );
}
