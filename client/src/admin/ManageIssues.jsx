/**
 * ManageIssues.jsx
 *
 * This page is displayed when an admin user navigates to the manage issues page.
 * It displays a list of all issues in the system, with options to filter, search, and sort the issues.
 * Admin users can also assign issues to themselves and unassign issues.
 *
 * UI updated to remain consistent with the Admin Dashboard and
 * University of Newcastle visual design.
 *
 * Author/s: Dinh Dinh & Amanda Foxley
 * Date: 27/8/26
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  Search,
  SlidersHorizontal,
  Eye,
  UserCheck,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";

import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import NotificationBell from "../components/NotificationBell";

import UONLogo from "../images/UONLogo White.png";

import "../pages/UserDashboard.css";
import "./ManageIssues.css";

export default function ManageIssues() {
  const navigate = useNavigate();
  const logout = userLogout();
  const { userData, loading: userLoading, error: userError } = getUserData();

  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignmentFilter, setAssignmentFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [assigningIssueId, setAssigningIssueId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const issuesPerPage = 10;

  const fetchIssues = async () => {
    try {
      const query = userData?.firebaseUid
        ? `?firebaseUid=${encodeURIComponent(userData.firebaseUid)}`
        : "";

      const response = await fetch(
        `http://localhost:8000/api/issues${query}`
      ); // get all issues from the backend

      if (!response.ok) {
        throw new Error("Failed to fetch system issues");
      }

      const data = await response.json();

      setIssues(Array.isArray(data) ? data : []);
      setFilteredIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setIssues([]);
      setFilteredIssues([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch issues when the component mounts
  useEffect(() => {
    fetchIssues();
  }, [userData?.firebaseUid]);

  // Filter and sort issues whenever the issues, search, statusFilter,
  // assignmentFilter, priorityFilter, userData, or sortBy state changes
  useEffect(() => {
    let temp = [...issues];

    // Filter by status
    // Active includes both Open and In Progress issues.
    if (statusFilter === "Active") {
      temp = temp.filter(
        (issue) =>
          issue.status === "Open" ||
          issue.status === "In Progress"
      );
    } else if (statusFilter !== "All") {
      temp = temp.filter(
        (issue) => issue.status === statusFilter
      );
    }

    // Filter by assignment
    if (assignmentFilter !== "All") {
      temp = temp.filter((issue) => {
        const assignedToMe =
          issue.assignedTo &&
          userData &&
          String(issue.assignedTo) === String(userData._id);

        if (assignmentFilter === "Assigned to me") {
          return assignedToMe;
        }

        if (assignmentFilter === "Assigned to others") {
          return !!issue.assignedTo && !assignedToMe;
        }

        if (assignmentFilter === "Unassigned") {
          return !issue.assignedTo;
        }

        return true;
      });
    }

    // Filter by priority
    if (priorityFilter !== "All") {
      temp = temp.filter(
        (issue) => issue.priority === priorityFilter
      );
    }

    // Filter by search term on title, description, campus, location, or reporter
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();

      temp = temp.filter(
        (issue) =>
          issue._id?.toLowerCase().includes(lowerSearch) ||
          issue.title?.toLowerCase().includes(lowerSearch) ||
          issue.issueDescription?.toLowerCase().includes(lowerSearch) ||
          issue.location?.toLowerCase().includes(lowerSearch) ||
          issue.campus?.toLowerCase().includes(lowerSearch) ||
          issue.reportedByName?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort issues by dateTimeReported
    temp.sort((a, b) => {
      const aTime = new Date(a.dateTimeReported || 0).getTime();
      const bTime = new Date(b.dateTimeReported || 0).getTime();

      if (sortBy === "Oldest") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });

    setFilteredIssues(temp);
    setCurrentPage(1);
  }, [
    issues,
    search,
    statusFilter,
    assignmentFilter,
    priorityFilter,
    userData,
    sortBy,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(
    filteredIssues.length / issuesPerPage
  );

  const visibleIssues = filteredIssues.slice(
    (currentPage - 1) * issuesPerPage,
    currentPage * issuesPerPage
  );

  // Helper method to assign an issue to the current user.
  // This updates the assignedTo field in MongoDB to the current user's id.
  const assignIssueToMe = async (issueId) => {
    if (!userData?.firebaseUid) return;

    try {
      setAssigningIssueId(issueId);

      const response = await fetch(
        `http://localhost:8000/api/issues/${issueId}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: userData.firebaseUid,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error || "Failed to assign issue"
        );
      }

      // Update the issues state with the updated issue data returned
      // from the server.
      const updatedIssue = await response.json();

      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue._id === issueId ? updatedIssue : issue
        )
      );
    } catch (err) {
      console.error(err);

      alert(err.message || "Could not assign issue");
    } finally {
      setAssigningIssueId(null);
    }
  };

  // Helper method to unassign an issue from the current user.
  // This clears the assignedTo field in MongoDB.
  const unassignIssue = async (issueId) => {
    try {
      setAssigningIssueId(issueId);

      const response = await fetch(
        `http://localhost:8000/api/issues/${issueId}/unassign`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error || "Failed to clear assignment"
        );
      }

      // Update the issues state with the updated issue data returned
      // from the server.
      const updatedIssue = await response.json();

      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue._id === issueId ? updatedIssue : issue
        )
      );
    } catch (err) {
      console.error(err);

      alert(err.message || "Could not clear assignment");
    } finally {
      setAssigningIssueId(null);
    }
  };

  const formatReportedDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-AU", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getStatusClass = (status) => {
    if (status === "Open") {
      return "manage-status-open";
    }

    if (status === "In Progress") {
      return "manage-status-progress";
    }

    if (status === "Closed") {
      return "manage-status-closed";
    }

    return "";
  };

  const getPriorityClass = (priority) => {
    if (priority === "Critical") {
      return "manage-priority-critical";
    }

    if (priority === "High") {
      return "manage-priority-high";
    }

    if (priority === "Medium") {
      return "manage-priority-medium";
    }

    if (priority === "Low") {
      return "manage-priority-low";
    }

    return "manage-priority-none";
  };

  if (userLoading) {
    return (
      <p className="user-dashboard-message">
        Loading admin data...
      </p>
    );
  }

  if (userError) {
    return (
      <p className="user-dashboard-message">
        {userError}
      </p>
    );
  }

  if (!userData) {
    return (
      <p className="user-dashboard-message">
        No admin data found.
      </p>
    );
  }

  return (
    <div className="user-dashboard manage-issues-page">

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

        <nav
          className="user-dashboard-nav"
          aria-label="Administrator navigation"
        >
          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item active"
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
          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() =>
              navigate("/admin/reporting")
            }
          >
            <BarChart3 />
            <span>Reporting & Analytics</span>
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

        {/* =========================
            HEADER
        ========================== */}

        <header className="user-dashboard-header">
          <h1>Manage issues</h1>

          <div className="user-dashboard-header-user">
            <span>
              Welcome {userData.firstName || "Admin"}
            </span>

            <NotificationBell
              firebaseUid={userData?.firebaseUid}
            />
          </div>
        </header>

        {/* =========================
            PAGE CONTENT
        ========================== */}

        <main className="user-dashboard-content manage-issues-content">

          {/* =========================
              PAGE INFORMATION
          ========================== */}

          <section className="manage-issues-intro">
            <div>
              <h2>Manage reported issues</h2>

              <p>
                Review all reported workplace health and safety issues,
                filter the list, view issue details and manage admin
                assignments.
              </p>
            </div>

            <div className="manage-issues-result-count">
              <strong>
                {loading ? "..." : filteredIssues.length}
              </strong>

              <span>
                {filteredIssues.length === 1
                  ? "Issue found"
                  : "Issues found"}
              </span>
            </div>
          </section>

          {/* =========================
              SEARCH AND FILTER PANEL
          ========================== */}

          <section className="user-dashboard-issues-panel manage-filter-panel">
            <div className="manage-panel-heading">
              <div className="manage-panel-heading-icon">
                <SlidersHorizontal />
              </div>

              <div>
                <h2>Search and filter</h2>

                <p>
                  Narrow the issue list by keyword, status,
                  assignment, priority or reported date.
                </p>
              </div>
            </div>

            <div className="manage-filter-body">

              {/* Search */}

              <div className="manage-search-group">
                <label htmlFor="manage-search">
                  Search issues
                </label>

                <div className="manage-search-input-wrapper">
                  <Search />

                  <input
                    id="manage-search"
                    type="text"
                    placeholder="Search by title, description, campus, location or reporter..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <p className="manage-field-caption">
                  Search across issue titles, descriptions,
                  locations, campuses and reporter names.
                </p>
              </div>

              {/* Filters */}

              <div className="manage-filter-grid">
                <div className="manage-filter-field">
                  <label htmlFor="status-filter">
                    Status
                  </label>

                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value)
                    }
                  >
                    <option value="All">
                      All statuses
                    </option>

                    <option value="Active">
                      Active
                    </option>

                    <option value="Open">
                      Open
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Closed">
                      Closed
                    </option>
                  </select>

                  <p className="manage-field-caption">
                    Filter by issue progress.
                  </p>
                </div>

                <div className="manage-filter-field">
                  <label htmlFor="assignment-filter">
                    Assignment
                  </label>

                  <select
                    id="assignment-filter"
                    value={assignmentFilter}
                    onChange={(e) =>
                      setAssignmentFilter(e.target.value)
                    }
                  >
                    <option value="All">
                      All assignments
                    </option>

                    <option value="Unassigned">
                      Unassigned
                    </option>

                    <option value="Assigned to me">
                      Assigned to me
                    </option>

                    <option value="Assigned to others">
                      Assigned to others
                    </option>
                  </select>

                  <p className="manage-field-caption">
                    View issues by admin assignment.
                  </p>
                </div>

                <div className="manage-filter-field">
                  <label htmlFor="priority-filter">
                    Priority
                  </label>

                  <select
                    id="priority-filter"
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value)
                    }
                  >
                    <option value="All">
                      All priorities
                    </option>

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Critical">
                      Critical
                    </option>
                  </select>

                  <p className="manage-field-caption">
                    Filter by reported priority.
                  </p>
                </div>

                <div className="manage-filter-field">
                  <label htmlFor="sort-filter">
                    Sort by
                  </label>

                  <select
                    id="sort-filter"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value)
                    }
                  >
                    <option value="Newest">
                      Newest first
                    </option>

                    <option value="Oldest">
                      Oldest first
                    </option>
                  </select>

                  <p className="manage-field-caption">
                    Order issues by report date.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =========================
              ALL ISSUES PANEL
          ========================== */}

          <section className="user-dashboard-issues-panel manage-issues-panel">
            <div className="manage-issues-panel-header">
              <div>
                <h2>All reported issues</h2>

                <p>
                  View issue information and manage assignments
                  directly from the list below.
                </p>
              </div>

              <span className="manage-issues-count">
                {loading ? "..." : filteredIssues.length}
              </span>
            </div>

            {/* Loading */}

            {loading ? (
              <div className="manage-issues-message">
                Loading issues...
              </div>

              /* No results */

            ) : filteredIssues.length === 0 ? (
              <div className="manage-empty-state">
                <ClipboardList />

                <h3>No issues found</h3>

                <p>
                  No reported issues match your current
                  search and filter selections.
                </p>
              </div>

              /* Issues table */

            ) : (
              <div className="user-dashboard-table-container manage-table-container">
                <table className="user-dashboard-table manage-issues-table">
                  <thead>
                    <tr>
                      <th>Issue</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Reported by</th>
                      <th>Reported</th>
                      <th>Assigned to</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleIssues.map((issue) => {
                      const isAssignedToMe =
                        userData &&
                        issue.assignedTo &&
                        String(issue.assignedTo) ===
                        String(userData._id);

                      return (
                        <tr key={issue._id}>

                          {/* Issue */}

                          <td className="manage-wrap-cell manage-title-cell">
                            <strong>
                              {issue.title || "-"}
                            </strong>

                            <span>
                              {issue.issueDescription ||
                                "No description provided"}
                            </span>
                          </td>

                          {/* Location */}

                          <td className="manage-wrap-cell">
                            <strong>
                              {issue.campus || "-"}
                            </strong>

                            <span>
                              {issue.location || "-"}
                            </span>
                          </td>

                          {/* Status */}

                          <td>
                            <span
                              className={`manage-status-badge ${getStatusClass(
                                issue.status
                              )}`}
                            >
                              {issue.status || "-"}
                            </span>
                          </td>

                          {/* Priority */}

                          <td>
                            <span
                              className={`manage-priority-badge ${getPriorityClass(
                                issue.priority
                              )}`}
                            >
                              {issue.priority || "Not set"}
                            </span>
                          </td>

                          {/* Reporter */}

                          <td className="manage-wrap-cell">
                            {issue.reportedByName || "Unknown"}
                          </td>

                          {/* Reported date */}

                          <td className="manage-date-cell">
                            {formatReportedDate(
                              issue.dateTimeReported
                            )}
                          </td>

                          {/* Assignment */}

                          <td className="manage-wrap-cell">
                            {isAssignedToMe ? (
                              <span className="manage-assigned-me">
                                Assigned to you
                              </span>
                            ) : issue.assignedTo ? (
                              issue.assignedToName || "Assigned"
                            ) : (
                              <span className="manage-unassigned">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Actions */}

                          <td>
                            <div className="manage-action-buttons">
                              <button
                                type="button"
                                className="manage-action-button manage-view-button"
                                onClick={() =>
                                  navigate(
                                    `/issue/${issue._id}`,
                                    {
                                      state: {
                                        from: "manage-issues",
                                      },
                                    }
                                  )
                                }
                              >
                                <Eye />
                                <span>View</span>
                              </button>

                              {!issue.assignedTo ||
                                isAssignedToMe ? (
                                <button
                                  type="button"
                                  className="manage-action-button manage-assign-button"
                                  onClick={() =>
                                    assignIssueToMe(
                                      issue._id
                                    )
                                  }
                                  disabled={
                                    assigningIssueId ===
                                    issue._id ||
                                    isAssignedToMe ||
                                    issue.status ===
                                    "Closed"
                                  }
                                >
                                  <UserCheck />

                                  <span>
                                    {isAssignedToMe
                                      ? "Assigned"
                                      : "Assign"}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="manage-action-button manage-assign-button"
                                  disabled
                                  title="This issue is already assigned to another user"
                                >
                                  <UserCheck />
                                  <span>Assign</span>
                                </button>
                              )}

                              {issue.assignedTo && (
                                <button
                                  type="button"
                                  className="manage-action-button manage-clear-button"
                                  onClick={() =>
                                    unassignIssue(
                                      issue._id
                                    )
                                  }
                                  disabled={
                                    assigningIssueId ===
                                    issue._id ||
                                    issue.status ===
                                    "Closed"
                                  }
                                >
                                  <UserMinus />
                                  <span>Clear</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* =========================
                PAGINATION
            ========================== */}

            {!loading &&
              filteredIssues.length > 0 &&
              totalPages > 1 && (
                <div className="manage-pagination">
                  <div className="manage-pagination-info">
                    Showing{" "}
                    <strong>
                      {(currentPage - 1) *
                        issuesPerPage +
                        1}
                    </strong>
                    {" - "}
                    <strong>
                      {Math.min(
                        currentPage *
                        issuesPerPage,
                        filteredIssues.length
                      )}
                    </strong>
                    {" of "}
                    <strong>
                      {filteredIssues.length}
                    </strong>{" "}
                    issues
                  </div>

                  <div className="manage-pagination-controls">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) => page - 1
                        )
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft />
                      <span>Previous</span>
                    </button>

                    <span className="manage-page-number">
                      Page{" "}
                      <strong>
                        {currentPage}
                      </strong>{" "}
                      of{" "}
                      <strong>
                        {totalPages}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) => page + 1
                        )
                      }
                      disabled={
                        currentPage === totalPages
                      }
                    >
                      <span>Next</span>
                      <ChevronRight />
                    </button>
                  </div>
                </div>
              )}
          </section>
        </main>
      </div>
    </div>
  );
}