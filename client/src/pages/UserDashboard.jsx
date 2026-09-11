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

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  FilePlus2,
  CircleAlert,
  UserRound,
  LogOut,
  FileText,
  Clock3,
  Wrench,
  Check,
  Plus,
  ChevronDown,
} from "lucide-react";

import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";

import UONLogo from "../images/UONLogo White.png";

import "./UserDashboard.css";

export default function UserDashboard() {
  const { userData, loading, error } = getUserData();

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState("");

  const navigate = useNavigate();
  const logout = userLogout();

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

  return (
    <div className="user-dashboard">
      {/* =========================
          LEFT SIDEBAR
      ========================== */}

      <aside className="user-dashboard-sidebar">
        <div className="user-dashboard-logo">
          <img
            src={UONLogo}
            alt="The University of Newcastle Australia"
          />
        </div>

        <nav className="user-dashboard-nav">
          <button
            type="button"
            className="user-dashboard-nav-item active"
            onClick={() => navigate("/userdashboard")}
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
          <h1>User dashboard</h1>

          <div className="user-dashboard-header-user">
            <span>
              Welcome {userData.firstName || "User"}
            </span>
            <div className="profile-avatar">
              <span>{initials}</span>
            </div>

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

            <div
              className="user-dashboard-watermark"
              aria-hidden="true"
            >
              <div className="watermark-circle watermark-circle-one" />
              <div className="watermark-circle watermark-circle-two" />
              <div className="watermark-circle watermark-circle-three" />
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

              <div className="user-dashboard-table-container">

                <table className="user-dashboard-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Date reported</th>
                      <th>View</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentIssues.map((issue) => (
                      <tr key={issue._id}>
                        <td>{issue.title || "-"}</td>
                        <td>{issue.location || "-"}</td>
                        <td>{issue.status || "-"}</td>
                        <td>
                          {issue.dateTimeReported
                            ? new Date(
                              issue.dateTimeReported
                            ).toLocaleDateString("en-AU")
                            : "-"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="user-dashboard-view-button"
                            onClick={() =>
                              navigate(`/issue/${issue._id}`, {
                                state: { from: "dashboard" },
                              })
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

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
        </main>
      </div>
    </div>
  );
}