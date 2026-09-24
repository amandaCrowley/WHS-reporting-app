/**
 * AdminAssignedIssues.jsx
 *
 * This page is displayed when an admin user navigates to the assigned issues section.
 * 
 * It displays the details of the admin user, including their name and email, as well as a summary of the total number of issues assigned to them, and the number of issues in each status (open, in progress, closed).
 * It also displays a list of issues assigned to the admin user, with links to view the details of each issue.
 * 
 * Author/s: Amanda Foxley
 * Date: 31/8/26
 * Modified by: Dinh Dinh
 * Date: 15/9/26
 */

import { useEffect, useState } from "react";
import MobilePageHeading from "../components/MobilePageHeading";
import useMobileNavigation from "../hooks/useMobileNavigation";
import { Link, useNavigate, useParams } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import { LayoutDashboard, ClipboardList, Users, LogOut } from "lucide-react";
import { getUserData } from "../hooks/getUserData";
import UONLogo from "../images/UONLogo White.png";
import "../pages/UserDashboard.css";
import "../styles/AdminAssignedIssues.css";
import NotificationBell from "../components/NotificationBell";

export default function AdminAssignedIssues() {
  const mobileNavigation = useMobileNavigation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const logout = userLogout();
  const { userData } = getUserData();
  const initials = `${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase();
  const [administrator, setAdministrator] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // Fetch administrator details and assigned issues when the component mounts or when the userId changes
  useEffect(() => {
    const controller = new AbortController();

    const fetchAssignedIssues = async () => {
      if (!userData?.firebaseUid || !userId) {
        return;
      }

      setLoading(true);
      setError("");
      setAdministrator(null);
      setIssues([]);

      try {
        const fetchData = async (url, message) => {
          const response = await fetch(url, {
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(message);
          }

          return response.json();
        };

        const [administrators, allIssues] = await Promise.all([
          fetchData(
            `http://localhost:8000/api/admin/users?firebaseUid=${encodeURIComponent(
              userData.firebaseUid,
            )}`,
            "Could not load administrator details.",
          ),
          fetchData(
            "http://localhost:8000/api/issues",
            "Could not load assigned issues.",
          ),
        ]);

        if (controller.signal.aborted) return;

        if (!Array.isArray(administrators)) {
          throw new Error("Could not load administrator details.");
        }

        if (!Array.isArray(allIssues)) {
          throw new Error("Could not load assigned issues.");
        }

        const selectedAdministrator = administrators.find(
          (admin) => String(admin._id) === String(userId),
        );

        if (!selectedAdministrator) {
          throw new Error("The selected administrator could not be found.");
        }

        setAdministrator(selectedAdministrator);

        // Match the selected administrator's MongoDB ID, including closed issues.
        setIssues(
          allIssues
            .filter((issue) => String(issue.assignedTo) === String(userId))
            .sort(
              (a, b) =>
                new Date(b.dateTimeReported || 0) -
                new Date(a.dateTimeReported || 0),
            ),
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Could not load assigned issues.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAssignedIssues();

    return () => controller.abort();
  }, [userId, userData?.firebaseUid]);



  // Set up the status summary for the assigned issues
  const summary = issues.reduce((counts, issue) => {
    if (issue.status === "Open") counts.open += 1;
    if (issue.status === "In Progress") counts.inProgress += 1;
    if (issue.status === "Closed") counts.closed += 1;
    return counts;
  }, { open: 0, inProgress: 0, closed: 0 });

  return (
    <div className={`user-dashboard admin-dashboard admin-assigned-issues-shell ${mobileNavigation.layoutClassName}`} onKeyDown={mobileNavigation.onKeyDown}>
      <aside className="user-dashboard-sidebar" {...mobileNavigation.sidebarProps}>
        <div className="user-dashboard-logo">
          <img src={UONLogo} alt="The University of Newcastle Australia" />
        </div>
        <nav className="user-dashboard-nav" aria-label="Administrator navigation">
          <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/dashboard")}>
            <LayoutDashboard /><span>Dashboard</span>
          </button>
          <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/manageissues")}>
            <ClipboardList /><span>Manage Issues</span>
          </button>
          <button type="button" className="user-dashboard-nav-item active" onClick={() => navigate("/admin/usermanagement")}>
            <Users /><span>User Management</span>
          </button>
        </nav>
        <div className="user-dashboard-logout-section">
          <button type="button" className="user-dashboard-logout" onClick={logout}>
            <LogOut /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="user-dashboard-main">
        <header className="user-dashboard-header">
          <MobilePageHeading title="Assigned Issues" {...mobileNavigation.headingProps} />
          <div className="user-dashboard-header-user">
            <span>Welcome {userData?.firstName || "Admin"}</span>
            <NotificationBell firebaseUid={userData?.firebaseUid} />
          </div>
        </header>
        <main className="user-dashboard-content">
          <div className="admin-assigned-issues">

            <section>
              <h2>{administrator
                  ? `${administrator.firstName|| " "}'s Issue Summary`
                  : "Issue Summary"}
                  </h2>
              {loading && <p role="status">Loading administrator and assigned issues...</p>}
              {error && <p role="alert">{error}</p>}
              {!loading && !error && administrator && (
                <div>
                  <div className="assigned-admin-information">
                    <p><strong>Name:</strong> {[administrator.firstName, administrator.lastName].filter(Boolean).join(" ") || "Not provided"}</p>
                    <p><strong>Email:</strong> {administrator.email || "Not provided"}</p>
                  </div>
                  <dl className="assigned-issue-stats">
                    <div><dt>Total assigned issues</dt><dd>{issues.length}</dd></div>
                    <div><dt>Open issues</dt><dd>{summary.open}</dd></div>
                    <div><dt>In progress issues</dt><dd>{summary.inProgress}</dd></div>
                    <div><dt>Closed issues</dt><dd>{summary.closed}</dd></div>
                  </dl>
                </div>
              )}
            </section>

            <section>
              <h2>
                All issues assigned to{" "}
                {administrator
                  ? `${administrator.firstName || ""} ${administrator.lastName || ""}`.trim()
                  : "this administrator"}
              </h2>
              {!loading && !error && (issues.length === 0 ? (
                <p>No issues are assigned to this administrator.</p>
              ) : (
                <ul className="assigned-issues-list">
                  {issues.map((issue) => (
              <li key={issue._id} className="assigned-issue-card">
                      <h3>{issue.title || "Untitled issue"}</h3>
                      <p><strong>Status:</strong> {issue.status || "Not provided"}</p>
                      <p><strong>Priority:</strong> {issue.priority || "Not set"}</p>
                      <p>
                        <strong>Location:</strong> {issue.location || "Not provided"}
                        {issue.campus ? ` - ${issue.campus}` : ""}
                      </p>
                      <p><strong>Reported by:</strong> {issue.reportedByName || "Unknown"}</p>
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
              ))}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
