/**
 * AdminDashboard.jsx
 *
 * This page is displayed when an admin user navigates to the admin dashboard.
 *
 * It displays a list of issues assigned to the admin user, as well as a summary
 * of recent unassigned issues in the system.
 *
 * Existing admin logic remains unchanged.
 * UI updated to match the User Dashboard.
 *
 * Author/s: Dinh Dinh, Grish Gautam and Amanda Foxley
 * Date: 27/8/26
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  FileText,
  CircleAlert,
  Clock3,
  Check,
  UserMinus,
  UserCheck,
} from "lucide-react";

import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";

import UONLogo from "../images/UONLogo White.png";

import "../pages/UserDashboard.css";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const logout = userLogout();

  const { userData, loading, error } = getUserData();

  const [assignedIssues, setAssignedIssues] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);

  const [dashboardStats, setDashboardStats] = useState({
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

    const fetchDashboardData = async () => {
      try {
        setIssuesLoading(true);

        const dashboardResponse = await fetch(
          `http://localhost:8000/api/admin/dashboard/${userData.firebaseUid}`
        );

        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch admin dashboard data");
        }

        const dashboardData = await dashboardResponse.json();

        setDashboardStats(dashboardData.stats || {});

        setAssignedIssues(
          Array.isArray(dashboardData.assignedIssues)
            ? dashboardData.assignedIssues
            : []
        );

        setRecentIssues(
          Array.isArray(dashboardData.recentIssues)
            ? dashboardData.recentIssues
            : []
        );
      } catch (err) {
        console.error(err);

        setAssignedIssues([]);
        setRecentIssues([]);
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchDashboardData();
  }, [userData]);

  if (loading) {
    return (
      <div className="admin-dashboard-message">
        <h1>Admin Dashboard</h1>
        <p>Loading admin data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-message">
        <h1>Admin Dashboard</h1>
        <p>{error}</p>
      </div>
    );
  }

  const initials =
    `${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="user-dashboard admin-dashboard">
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
            onClick={() => navigate("/admin/dashboard")}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/admin/manageissues")}
          >
            <ClipboardList />
            <span>Manage Issues</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/admin/usermanagement")}
          >
            <Users />
            <span>User Management</span>
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
        <header className="user-dashboard-header">
          <h1>Admin dashboard</h1>

          <div className="user-dashboard-header-user">
            <span>
              Welcome {userData?.firstName || "Admin"}
            </span>

            <div className="profile-avatar">
              <span>{initials || "A"}</span>
            </div>
          </div>
        </header>

        <main className="user-dashboard-content">
          {/* =========================
              TOTAL ISSUES
          ========================== */}

          <section className="user-dashboard-total-card">
            <div className="user-dashboard-total-content">
              <div className="user-dashboard-total-icon">
                <FileText />
              </div>

              <div>
                <h2>Total Issues</h2>

                <p>
                  {issuesLoading
                    ? "..."
                    : dashboardStats.total}
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
              MAIN STATUS CARDS
          ========================== */}

          <section className="user-dashboard-status-grid">
            <article className="user-dashboard-status-card status-open">
              <div className="user-dashboard-status-icon">
                <CircleAlert />
              </div>

              <div className="user-dashboard-status-content">
                <h3>Open</h3>

                <strong>
                  {issuesLoading
                    ? "..."
                    : dashboardStats.open}
                </strong>

                <p>Waiting for action</p>
              </div>
            </article>

            <article className="user-dashboard-status-card status-progress">
              <div className="user-dashboard-status-icon">
                <Clock3 />
              </div>

              <div className="user-dashboard-status-content">
                <h3>In Progress</h3>

                <strong>
                  {issuesLoading
                    ? "..."
                    : dashboardStats.inProgress}
                </strong>

                <p>Being worked on</p>
              </div>
            </article>

            <article className="user-dashboard-status-card status-closed">
              <div className="user-dashboard-status-icon">
                <Check />
              </div>

              <div className="user-dashboard-status-content">
                <h3>Closed</h3>

                <strong>
                  {issuesLoading
                    ? "..."
                    : dashboardStats.closed}
                </strong>

                <p>Resolved issues</p>
              </div>
            </article>
          </section>

          {/* =========================
              ADMIN EXTRA STATS
          ========================== */}

          <section className="admin-dashboard-secondary-grid">
            <article className="user-dashboard-status-card admin-status-unassigned">
              <div className="user-dashboard-status-icon">
                <UserMinus />
              </div>

              <div className="user-dashboard-status-content">
                <h3>Unassigned</h3>

                <strong>
                  {issuesLoading
                    ? "..."
                    : dashboardStats.unassigned}
                </strong>

                <p>Issues needing assignment</p>
              </div>
            </article>

            <article className="user-dashboard-status-card admin-status-assigned">
              <div className="user-dashboard-status-icon">
                <UserCheck />
              </div>

              <div className="user-dashboard-status-content">
                <h3>My Assigned Issues</h3>

                <strong>
                  {issuesLoading
                    ? "..."
                    : dashboardStats.assignedToMe}
                </strong>

                <p>Currently assigned to you</p>
              </div>
            </article>
          </section>

          {/* =========================
              MY ASSIGNED ISSUES
          ========================== */}

          <section className="admin-dashboard-issues-panel">
            <div className="admin-dashboard-panel-header">
              <div>
                <h2>My assigned issues</h2>

                <p>
                  Open and in-progress issues currently assigned to you.
                </p>
              </div>
            </div>

            {issuesLoading ? (
              <div className="admin-dashboard-panel-message">
                Loading assigned issues...
              </div>
            ) : assignedIssues.length === 0 ? (
              <div className="admin-dashboard-panel-message">
                No open issues assigned to you.
              </div>
            ) : (
              <div className="admin-dashboard-issue-list">
                {assignedIssues
                  .filter(
                    (issue) =>
                      issue.status !== "Closed"
                  )
                  .map((issue) => (
                    <article
                      className="admin-dashboard-issue-card"
                      key={issue._id}
                    >
                      <div className="admin-dashboard-issue-main">
                        <h3>
                          {issue.title || "Untitled Issue"}
                        </h3>

                        <p className="admin-dashboard-location">
                          {issue.location || "-"} ·{" "}
                          {issue.campus || "-"}
                        </p>
                      </div>

                      <div className="admin-dashboard-issue-details">
                        <div>
                          <span>Status</span>
                          <strong>
                            {issue.status || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Priority</span>
                          <strong>
                            {issue.priority || "Not set"}
                          </strong>
                        </div>

                        <div>
                          <span>Assigned to</span>
                          <strong>
                            {issue.assignedToName ||
                              "Unassigned"}
                          </strong>
                        </div>

                        <div>
                          <span>Reported</span>
                          <strong>
                            {new Date(
                              issue.dateTimeReported
                            ).toLocaleString("en-AU", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="admin-dashboard-view-button"
                        onClick={() =>
                          navigate(
                            `/issue/${issue._id}`
                          )
                        }
                      >
                        View Issue
                      </button>
                    </article>
                  ))}
              </div>
            )}
          </section>

          {/* =========================
              RECENT UNASSIGNED
          ========================== */}

          <section className="admin-dashboard-issues-panel">
            <div className="admin-dashboard-panel-header">
              <div>
                <h2>Recent Unassigned Issues</h2>

                <p>
                  The most recently reported issues that are not currently assigned to an admin.
                </p>
              </div>
            </div>

            {issuesLoading ? (
              <div className="admin-dashboard-panel-message">
                Loading recent issues...
              </div>
            ) : recentIssues.length === 0 ? (
              <div className="admin-dashboard-panel-message">
                No recent unassigned issues.
              </div>
            ) : (
              <div className="admin-dashboard-issue-list">
                {recentIssues.map((issue) => (
                  <article
                    className="admin-dashboard-issue-card"
                    key={issue._id}
                  >
                    <div className="admin-dashboard-issue-main">
                      <h3>
                        {issue.title || "Untitled Issue"}
                      </h3>

                      <p className="admin-dashboard-location">
                        {issue.campus || "-"} ·{" "}
                        {issue.location || "-"}
                      </p>
                    </div>

                    <div className="admin-dashboard-issue-details">
                      <div>
                        <span>Status</span>
                        <strong>
                          {issue.status || "-"}
                        </strong>
                      </div>

                      <div>
                        <span>Priority</span>
                        <strong>
                          {issue.priority || "Not set"}
                        </strong>
                      </div>

                      <div>
                        <span>Assigned to</span>
                        <strong>
                          {issue.assignedToName ||
                            "Unassigned"}
                        </strong>
                      </div>

                      <div>
                        <span>Reported</span>
                        <strong>
                          {new Date(
                            issue.dateTimeReported
                          ).toLocaleString("en-AU", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="admin-dashboard-view-button"
                      onClick={() =>
                        navigate(
                          `/issue/${issue._id}`
                        )
                      }
                    >
                      View Issue
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}