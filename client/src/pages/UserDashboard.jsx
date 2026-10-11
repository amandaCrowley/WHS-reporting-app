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
 * Author/s: Grish Gautam & Amanda Foxley
 */

/**
 * UserDashboard.jsx
 *
 * Dashboard page for the WHS Reporting App.
 * UI updated to match the University of Newcastle dashboard design.
 *
 * Existing issue fetching, statistics, routing, and logout behaviour
 * remain unchanged.
 *
 * Author/s: Grish Gautam
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  FilePlus2,
  CircleAlert,
  UserRound,
  LogOut,
  FileText,
  Clock3,
  Check,
  Plus,
  Menu,
  X,
} from "lucide-react";

import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import { useNotifications } from "../hooks/useNotifications";
import NotificationBell from "../components/NotificationBell";
import UONLogo from "../images/UONLogo White.png";
import { getAuth } from "firebase/auth";

import "./UserDashboard.css";

export default function UserDashboard() {
  const { userData, loading, error } = getUserData();

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const navigationRef = useRef(null);

  // Admin access request state
  const [adminRequestStatus, setAdminRequestStatus] = useState("None");
  const [adminRequestReason, setAdminRequestReason] = useState("");
  const [adminRequestLoading, setAdminRequestLoading] = useState(false);
  const [adminRequestSubmitting, setAdminRequestSubmitting] = useState(false);
  const [adminRequestError, setAdminRequestError] = useState("");
  const [adminRequestMessage, setAdminRequestMessage] = useState("");
  const [adminRequestIsAdmin, setAdminRequestIsAdmin] = useState(false);

  /* Mobile menu focus management: When the mobile menu is opened, focus should be set to the first navigation button.*/
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      navigationRef.current?.querySelector("nav button")?.focus();
    }
  }, [mobileMenuOpen]);

  const navigate = useNavigate();
  const logout = userLogout();
  const { notifications, unreadCount } = useNotifications(userData?.firebaseUid);

  /**
 * Fetch the logged-in staff member's admin access request.
 */
  useEffect(() => {
    if (!userData || userData.role !== "Staff" || userData.isAdmin) {
      return;
    }

    let cancelled = false;

    const fetchAdminAccessRequest = async () => {
      try {
        setAdminRequestLoading(true);
        setAdminRequestError("");

        const currentUser = getAuth().currentUser;

        if (!currentUser) {
          throw new Error("You must be logged in to view your request.");
        }

        const token = await currentUser.getIdToken();

        const response = await fetch(
          "http://localhost:8000/api/admin-access/request",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load admin access request."
          );
        }

        if (cancelled) return;

        setAdminRequestStatus(data.status || "None");
        setAdminRequestReason(data.reason || "");
        setAdminRequestIsAdmin(data.isAdmin === true);
      } catch (err) {
        if (!cancelled) {
          setAdminRequestError(
            err.message || "Failed to load admin access request."
          );
        }
      } finally {
        if (!cancelled) {
          setAdminRequestLoading(false);
        }
      }
    };

    fetchAdminAccessRequest();

    return () => {
      cancelled = true;
    };
  }, [userData]);
  /**
   * Fetch all issues submitted by the logged-in user.
   */
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

  /**
   * Calculate dashboard statistics.
   */
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

  /**
   * Newest issues appear first.
   */
  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      const dateA = new Date(a.dateTimeReported || 0).getTime();
      const dateB = new Date(b.dateTimeReported || 0).getTime();

      return dateB - dateA;
    });
  }, [issues]);

  const recentIssues = sortedIssues.slice(0, 5);

  const openIssueDetails = (issueId) => {
    navigate(`/issue/${issueId}`, {
      state: { from: "dashboard" },
    });
  };

  if (loading) {
    return <p className="user-dashboard-message">Loading user data...</p>;
  }

  if (error) {
    return (
      <p className="user-dashboard-message">
        {error} Redirecting to login...
      </p>
    );
  }

  // Build initials for avatar
  const initials =
    `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase();

  if (!userData) {
    return <p className="user-dashboard-message">No user data found.</p>;
  }
  const getStatusClass = (status) => {
    if (status === "Open") {
      return "user-dashboard-status-open";
    }

    if (status === "In Progress") {
      return "user-dashboard-status-progress";
    }

    if (status === "Closed") {
      return "user-dashboard-status-closed";
    }

    return "user-dashboard-status-default";
  };

  /**
 * Submit an admin access request.
 */
  const submitAdminAccessRequest = async (event) => {
    event.preventDefault();

    const reason = adminRequestReason.trim();

    if (reason.length < 10 || reason.length > 1000) {
      setAdminRequestError(
        "Please enter a reason between 10 and 1000 characters."
      );
      return;
    }

    try {
      setAdminRequestSubmitting(true);
      setAdminRequestError("");
      setAdminRequestMessage("");

      const currentUser = getAuth().currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in to submit a request.");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(
        "http://localhost:8000/api/admin-access/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setAdminRequestStatus("Pending");
      setAdminRequestMessage(
        "Your admin access request has been submitted successfully."
      );
    } catch (err) {
      setAdminRequestError(
        err.message || "Failed to submit admin access request."
      );
    } finally {
      setAdminRequestSubmitting(false);
    }
  };

  return (
    <div
      className={`user-dashboard user-dashboard-home${mobileMenuOpen ? " mobile-menu-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && mobileMenuOpen) {
          closeMobileMenu();
        }
      }}
    >
      {/* =========================
          LEFT SIDEBAR
      ========================== */}

      <aside ref={navigationRef} className="user-dashboard-sidebar" id="dashboard-navigation">
        <div className="user-dashboard-logo">
          <img
            src={UONLogo}
            alt="The University of Newcastle Australia"
          />
        </div>

        <nav className="user-dashboard-nav" aria-label="User navigation">
          <button
            type="button"
            className="user-dashboard-nav-item active"
            aria-current="page"
            onClick={closeMobileMenu}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/reportissue")}
          >
            <FilePlus2 />
            <span>Report Issues</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/myissues")}
          >
            <CircleAlert />
            <span>My Issues</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/profile")}
          >
            <UserRound />
            <span>Profile</span>
          </button>
        </nav>

        <div className="user-dashboard-logout-section">
          <button
            type="button"
            className="user-dashboard-logout"
            onClick={logout}
          >
            <LogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================
          RIGHT SIDE
      ========================== */}

      <div className="user-dashboard-main">
        {/* Top header */}

        <header className="user-dashboard-header">
          <div className="user-dashboard-heading-row">
            <button
              ref={menuButtonRef}
              type="button"
              className="user-dashboard-menu-toggle"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
              aria-controls="dashboard-navigation"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
            <h1>User dashboard</h1>
          </div>

          <div className="user-dashboard-header-user">

            <span>
              Welcome {userData.firstName || "User"}
            </span>
            <NotificationBell firebaseUid={userData.firebaseUid} />

          </div>
        </header>

        {/* Main dashboard content */}

        <main className="user-dashboard-content">
          {/* =========================
              TOTAL ISSUES BANNER
          ========================== */}

          <section className="user-dashboard-total-card">
            <div className="user-dashboard-total-content">
              <div className="user-dashboard-total-icon">
                <FileText />
              </div>

              <div>
                <h2>Total Issues Submitted</h2>

                <p>
                  {issuesLoading ? "..." : stats.total}
                </p>
              </div>
            </div>

            <div className="dashboard-notifications-heading">
              <h2>Notifications</h2>
              <p>
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
            </div>
          </section>

          {/* =========================
              STATUS CARDS
          ========================== */}

          <section className="user-dashboard-status-grid">
            {/* OPEN */}

            <article className="user-dashboard-status-card status-open">
              <div className="user-dashboard-status-icon">
                <CircleAlert />
              </div>

              <div className="user-dashboard-status-content">
                <h3>Open</h3>

                <strong>
                  {issuesLoading ? "..." : stats.open}
                </strong>

                <p>Waiting for admin</p>
              </div>
            </article>

            {/* IN PROGRESS */}

            <article className="user-dashboard-status-card status-progress">
              <div className="user-dashboard-status-icon">
                <Clock3 />
              </div>

              <div className="user-dashboard-status-content">
                <h3>In Progress</h3>

                <strong>
                  {issuesLoading ? "..." : stats.inProgress}
                </strong>

                <p>Being worked on</p>
              </div>
            </article>

            {/* CLOSED */}

            <article className="user-dashboard-status-card status-closed">
              <div className="user-dashboard-status-icon">
                <Check />
              </div>

              <div className="user-dashboard-status-content">
                <h3>Closed</h3>

                <strong>
                  {issuesLoading ? "..." : stats.closed}
                </strong>

                <p>Resolved issues</p>
              </div>
            </article>
          </section>
          {/* =========================
              ISSUES AREA
          ========================== */}

          <section className="user-dashboard-issues-panel">
            <div className="admin-dashboard-panel-header">
              <div>
                <h2>My reported issues</h2>
                <p>
                  View the WHS issues you have reported and check their current status.
                </p>
              </div>
            </div>
            {issuesLoading ? (
              <div className="user-dashboard-panel-message">
                Loading issues...
              </div>
            ) : issuesError ? (
              <div className="user-dashboard-panel-message">
                Error: {issuesError}
              </div>
            ) : sortedIssues.length === 0 ? (
              /* Empty state shown in target UI */

              <div className="user-dashboard-empty">
                <div className="user-dashboard-empty-illustration">
                  <div className="empty-clipboard">
                    <div className="empty-clipboard-clip" />

                    <div className="empty-clipboard-paper">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className="empty-leaves left-leaves">
                    <i />
                    <i />
                    <i />
                  </div>

                  <div className="empty-leaves right-leaves">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>

                <h2>No issues submitted yet</h2>

                <p>
                  When you report an issue, it will appear here.
                </p>

                <button
                  type="button"
                  className="user-dashboard-report-button"
                  onClick={() => navigate("/reportissue")}
                >
                  <Plus />

                  <span>Report New Issue</span>
                </button>
              </div>
            ) : (
              /* Existing issue information remains available */

              <div className="user-dashboard-issue-list">
                {recentIssues.map((issue) => {
                  const statusClass = getStatusClass(issue.status);

                  return (
                    <div
                      key={issue._id}
                      className="user-dashboard-issue-card"
                      onClick={() => openIssueDetails(issue._id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openIssueDetails(issue._id);
                        }
                      }}
                    >
                      <div className="user-dashboard-issue-main">
                        <h3>{issue.title || "-"}</h3>

                        <p className="user-dashboard-location">
                          {issue.location || "-"}
                        </p>
                      </div>

                      <div className="user-dashboard-issue-details">
                        <div>
                          <span>Status</span>
                          <strong className={`user-dashboard-status-badge ${statusClass}`}>
                            {issue.status || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Campus</span>
                          <strong>{issue.campus || "-"}</strong>
                        </div>

                        <div>
                          <span>Date reported</span>
                          <strong>
                            {issue.dateTimeReported
                              ? new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                              : "-"}
                          </strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="user-dashboard-view-button"
                        aria-label={`View details for ${issue.title || "issue"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openIssueDetails(issue._id);
                        }}
                      >
                        View <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  );
                })}

                {sortedIssues.length > 5 && (
                  <div className="user-dashboard-issues-footer">
                    <span>
                      Showing your 5 most recent issues
                    </span>

                    <button
                      type="button"
                      className="user-dashboard-view-all-button"
                      onClick={() => navigate("/myissues")}
                    >
                      View all issues
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* =========================
            STAFF ADMIN ACCESS REQUEST
          ========================== */}

          {userData.role === "Staff" &&
            !userData.isAdmin &&
            !adminRequestIsAdmin && (
              <section
                className="admin-access-request-panel"
                aria-labelledby="admin-access-request-heading"
              >
                <div className="admin-access-request-header">
                  <div>
                    <h2 id="admin-access-request-heading">
                      Administrator Access
                    </h2>

                    <p>
                      Need access to WHS management features? Request administrator privileges here.
                    </p>
                  </div>
                </div>

                <div className="admin-access-content">
                  {adminRequestLoading ? (
                    <p className="admin-access-request-message">
                      Loading your request status...
                    </p>
                  ) : adminRequestStatus === "Pending" ? (
                    <div
                      className="admin-access-request-status pending"
                      role="status"
                    >
                      <Clock3 aria-hidden="true" />

                      <div>
                        <h3>Request Pending</h3>
                        <p>
                          Your request has been submitted and is awaiting
                          administrator review.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {adminRequestStatus === "Rejected" && (
                        <div
                          className="admin-access-request-status rejected"
                          role="status"
                        >
                          <CircleAlert aria-hidden="true" />

                          <div>
                            <h3>Request Not Approved</h3>
                            <p>
                              Your previous request was not approved. You may
                              submit a new request with additional information.
                            </p>
                          </div>
                        </div>
                      )}

                      {adminRequestMessage && (
                        <p
                          className="admin-access-request-success"
                          role="status"
                        >
                          {adminRequestMessage}
                        </p>
                      )}

                      <form onSubmit={submitAdminAccessRequest}>
                        <textarea
                          id="admin-access-request-reason"
                          value={adminRequestReason}
                          onChange={(event) => {
                            setAdminRequestReason(event.target.value);
                            setAdminRequestError("");
                            setAdminRequestMessage("");
                          }}
                          placeholder="Explain your responsibilities and why you need access. A WHS administrator will review your request and contact you if more information is necessary."
                          rows={4}
                          minLength={10}
                          maxLength={1000}
                          required
                          disabled={adminRequestSubmitting}
                        />

                        <p className="admin-access-request-hint">
                          {adminRequestReason.trim().length}/1000 characters
                          (minimum 10).
                        </p>

                        {adminRequestError && (
                          <p
                            className="admin-access-request-error"
                            role="alert"
                          >
                            {adminRequestError}
                          </p>
                        )}

                        <button
                          type="submit"
                          className="admin-access-request-button"
                          disabled={
                            adminRequestSubmitting ||
                            adminRequestReason.trim().length < 10 ||
                            adminRequestReason.trim().length > 1000
                          }
                        >
                          {adminRequestSubmitting
                            ? "Submitting..."
                            : adminRequestStatus === "Rejected"
                              ? "Resubmit Request"
                              : "Request Admin Access"}
                        </button>
                      </form>

                    </>
                  )}
                </div>
              </section>
            )}
        </main>
      </div>
    </div>
  );
}
