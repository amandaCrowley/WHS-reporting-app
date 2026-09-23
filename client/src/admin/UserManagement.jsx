/**
 * UserManagement.jsx
 *
 * This page displays a list of all users in the system, with options to search,
 * filter, and edit user details.
 * Administrators can also change a user's role and administrator status from
 * this page.
 *
 * A list of 10 users is displayed per page, with pagination controls to navigate
 * through the list of users. (This can be changed in the usersPerPage variable
 * in the code below.)
 *
 * Author/s: Grish Gautam, Dinh Dinh & Amanda Foxley
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
  UserRound,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import NotificationBell from "../components/NotificationBell";

import UONLogo from "../images/UONLogo White.png";

import "../pages/UserDashboard.css";
import "./UserManagement.css";

export default function UserManagement() {
  const navigate = useNavigate();
  const logout = userLogout();

  // Get the currently logged in user's data using the custom hook getUserData
  const { userData } = getUserData();

  // User directory state and management controls
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [adminFilter, setAdminFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  // Number of users to display per page used for pagination
  const usersPerPage = 10;

  const isCurrentAdmin = (user) =>
    user.firebaseUid === userData?.firebaseUid;

  const canGrantAdminAccess = (user) =>
    user.role === "Staff";

  // Fetch all users from MongoDB when the page loads
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/users"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply the search and directory filters to the loaded users
  const filteredUsers = users.filter((user) => {
    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();

    const searchMatches =
      !search.trim() ||
      fullName.includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    const roleMatches =
      roleFilter === "All" || user.role === roleFilter;

    const adminMatches =
      adminFilter === "All" ||
      (adminFilter === "Admin" && user.isAdmin) ||
      (adminFilter === "User" && !user.isAdmin);

    return searchMatches && roleMatches && adminMatches;
  });

  // Calculate total number of pages
  const totalPages = Math.ceil(
    filteredUsers.length / usersPerPage
  );

  // Display only users belonging to the current page
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Open confirmation dialog before changing user details
  const requestUserUpdate = (
    userId,
    updates,
    changeDescription
  ) => {
    const user = users.find(
      (item) => item._id === userId
    );

    if (!user) return;

    setPendingUpdate({
      userId,
      updates,
      userName: `${user.firstName} ${user.lastName}`,
      changeDescription,
    });
  };

  // Save a confirmed role or administrator status change
  const updateUser = async () => {
    if (!userData?.firebaseUid || !pendingUpdate) {
      return;
    }

    try {
      setUpdatingUserId(pendingUpdate.userId);

      const response = await fetch(
        `http://localhost:8000/api/admin/users/${pendingUpdate.userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...pendingUpdate.updates,
            adminFirebaseUid: userData.firebaseUid,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update user"
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === pendingUpdate.userId
            ? data
            : user
        )
      );

      setPendingUpdate(null);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Could not update user"
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="user-dashboard user-management-page">

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
            className="user-dashboard-nav-item"
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() =>
              navigate("/admin/manageissues")
            }
          >
            <ClipboardList />
            <span>Manage Issues</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item active"
            onClick={() =>
              navigate("/admin/usermanagement")
            }
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
          <h1>User management</h1>

          <div className="user-dashboard-header-user">
            <span>
              Welcome {userData?.firstName || "Admin"}
            </span>

            <NotificationBell
              firebaseUid={userData?.firebaseUid}
            />
          </div>
        </header>

        {/* =========================
            PAGE CONTENT
        ========================== */}

        <main className="user-dashboard-content user-management-content">
          {/* =========================
              USER DIRECTORY
          ========================== */}

          <section className="user-management-directory">
            <div className="user-management-directory-header">
              <div className="user-management-info-icon">
                <ShieldCheck />
              </div>
              <div className="user-management-directory-info">
                <p>
                  Review registered users and manage their system permissions.
                  Administrator access can only be granted to staff accounts.
                </p>
              </div>


              <div className="user-management-result-count">
                <strong>{filteredUsers.length}</strong>
                <span>
                  {filteredUsers.length === 1 ? "user found" : "users found"}
                </span>
              </div>
            </div>

            {/* =========================
                SEARCH + FILTERS
            ========================== */}

            <div className="user-management-filters">

              <div className="user-management-search">
                <Search />

                <input
                  type="search"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">
                  All roles
                </option>
                <option value="Student">
                  Student
                </option>
                <option value="Staff">
                  Staff
                </option>
                <option value="Visitor">
                  Visitor
                </option>
                <option value="Contractor">
                  Contractor
                </option>
              </select>

              <select
                value={adminFilter}
                onChange={(event) => {
                  setAdminFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">
                  All users
                </option>
                <option value="Admin">
                  Admins
                </option>
                <option value="User">
                  Non-admins
                </option>
              </select>
            </div>

            {/* =========================
                USER TABLE
            ========================== */}

            {loading ? (
              <div className="user-management-state">
                <p>Loading users...</p>
              </div>
            ) : error ? (
              <div className="user-management-state user-management-error">
                <p>{error}</p>
              </div>
            ) : visibleUsers.length === 0 ? (
              <div className="user-management-state">
                <p>No users found.</p>
              </div>
            ) : (
              <div className="user-management-table-wrapper">
                <table className="user-management-table">
                  <thead>
                    <tr>
                      <th>First name</th>
                      <th>Last name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Administrator</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Render each visible user as a table row */}
                    {visibleUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          {user.firstName}
                        </td>

                        <td>
                          {user.lastName}
                        </td>

                        <td>
                          {user.email}
                        </td>

                        <td>
                          <select
                            className="user-management-role-select"
                            value={
                              user.role ||
                              "Student"
                            }
                            disabled={
                              updatingUserId ===
                              user._id
                            }
                            onChange={(event) =>
                              requestUserUpdate(
                                user._id,
                                {
                                  role:
                                    event.target
                                      .value,
                                },
                                `change the role from ${user.role ||
                                "Student"
                                } to ${event.target
                                  .value
                                }`
                              )
                            }
                          >
                            <option value="Student">
                              Student
                            </option>

                            <option value="Staff">
                              Staff
                            </option>

                            <option value="Visitor">
                              Visitor
                            </option>

                            <option value="Contractor">
                              Contractor
                            </option>
                          </select>
                        </td>

                        <td>
                          <span
                            className={`user-management-admin-status ${user.isAdmin
                              ? "is-admin"
                              : ""
                              }`}
                          >
                            {user.isAdmin
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>

                        <td>
                          <div className="user-management-actions">

                            <button
                              type="button"
                              className="user-management-action-secondary"
                              onClick={() =>
                                navigate(
                                  `/admin/users/${user._id}`
                                )
                              }
                            >
                              View details
                            </button>

                            <button
                              type="button"
                              className="user-management-action-secondary"
                              onClick={() =>
                                navigate(
                                  `/admin/users/${user._id}/edit`
                                )
                              }
                            >
                              Edit user
                            </button>

                            <button
                              type="button"
                              className="user-management-action-secondary"
                              onClick={() =>
                                navigate(
                                  `/admin/users/${user._id}/assigned-issues`
                                )
                              }
                              disabled={
                                !user.isAdmin
                              }
                            >
                              Assigned Issues
                            </button>

                            <button
                              type="button"
                              className="user-management-action-primary"
                              onClick={() =>
                                requestUserUpdate(
                                  user._id,
                                  {
                                    isAdmin:
                                      !user.isAdmin,
                                  },
                                  user.isAdmin
                                    ? "remove administrator access"
                                    : "grant administrator access"
                                )
                              }
                              disabled={
                                updatingUserId ===
                                user._id ||
                                (user.isAdmin &&
                                  isCurrentAdmin(
                                    user
                                  )) ||
                                (!user.isAdmin &&
                                  !canGrantAdminAccess(
                                    user
                                  ))
                              }
                              title={
                                user.isAdmin &&
                                  isCurrentAdmin(user)
                                  ? "Another administrator must remove your admin status"
                                  : !user.isAdmin &&
                                    !canGrantAdminAccess(
                                      user
                                    )
                                    ? "Only Staff users can be granted administrator access"
                                    : undefined
                              }
                            >
                              {user.isAdmin
                                ? "Remove Admin"
                                : "Make Admin"}
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* =========================
                PAGINATION
            ========================== */}

            {!loading &&
              !error &&
              filteredUsers.length > 0 &&
              totalPages > 1 && (
                <div className="user-management-pagination">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) => page - 1
                      )
                    }
                    disabled={
                      currentPage === 1
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {currentPage} of{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) => page + 1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                  >
                    Next
                  </button>
                </div>
              )}
          </section>
        </main>
      </div>

      {/* =========================
          CONFIRMATION POPUP
      ========================== */}

      {pendingUpdate && (
        <div
          className="user-management-confirmation-backdrop"
          role="presentation"
        >
          <div
            className="user-management-confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="user-management-confirmation-title"
          >
            <p className="user-management-confirmation-eyebrow">
              Confirm user change
            </p>

            <h2 id="user-management-confirmation-title">
              Update {pendingUpdate.userName}?
            </h2>

            <p>
              You are about to{" "}
              {pendingUpdate.changeDescription}.
              This change will be saved to the
              user&apos;s account.
            </p>

            <div className="user-management-confirmation-actions">
              <button
                type="button"
                onClick={() =>
                  setPendingUpdate(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="user-management-confirmation-confirm"
                onClick={updateUser}
              >
                Confirm change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}