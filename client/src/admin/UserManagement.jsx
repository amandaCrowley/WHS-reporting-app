/**
 * UserManagement.jsx
 *
 * This page displays a list of all users in the system, with options to search, filter, and edit user details.
 * Administrators can also change a user's role and administrator status from this page.
 * 
 * A list of 10 users is displayed per page, with pagination controls to navigate through the list of users. (This can be changed in the usersPerPage variable in the code below.)
 * 
 * Author/s: Dinh Dinh & Amanda Foxley
 * Date: 27/8/26
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import "../styles/AdminUserManagement.css"; //This is where the popup confirmation is styled

export default function UserManagement() {

  const navigate = useNavigate();
  const logout = userLogout();
  const { userData } = getUserData(); //get the currently logged in user's data using the custom hook getUserData

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
  const usersPerPage = 10; // Number of users to display per page used for pagination

  const isCurrentAdmin = (user) => user.firebaseUid === userData?.firebaseUid;
  const canGrantAdminAccess = (user) => user.role === "Staff";

  // Fetch all users from MongoDB when the page loads
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");

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
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const searchMatches =
      !search.trim() ||
      fullName.includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const roleMatches = roleFilter === "All" || user.role === roleFilter;
    const adminMatches =
      adminFilter === "All" ||
      (adminFilter === "Admin" && user.isAdmin) ||
      (adminFilter === "User" && !user.isAdmin);

    return searchMatches && roleMatches && adminMatches;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage); // Calculate the total number of pages based on the filtered users and users per page

  // Display only the users belonging to the current page
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Open the confirmation dialog before changing a user's details
  const requestUserUpdate = (userId, updates, changeDescription) => {
    const user = users.find((item) => item._id === userId);
    if (!user) return;

    setPendingUpdate({
      userId,
      updates,
      userName: `${user.firstName} ${user.lastName}`,
      changeDescription,
    });
  };

  // Save a confirmed role or administrator status change through the server API routes
  const updateUser = async () => {
    if (!userData?.firebaseUid || !pendingUpdate) return;

    try {
      setUpdatingUserId(pendingUpdate.userId);
      const response = await fetch(`http://localhost:8000/api/admin/users/${pendingUpdate.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingUpdate.updates, adminFirebaseUid: userData.firebaseUid }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update user");

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user._id === pendingUpdate.userId ? data : user))
      );
      setPendingUpdate(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update user");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="admin-user-management">
      <div>
        <h1>User Management</h1>
      </div>

      <div>
        <button type="button" onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
        <button type="button" onClick={() => navigate("/admin/manageissues")}>Manage Issues</button>
        <button type="button" onClick={logout}>Logout</button>
      </div>

      {/* Search and filter controls for the user directory */}
      <section>
        <h2>User Directory</h2>
        <div>
          <input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />

          <select value={roleFilter} onChange={(event) => {
            setRoleFilter(event.target.value);
            setCurrentPage(1);
          }}>
            <option value="All">All roles</option>
            <option value="Student">Student</option>
            <option value="Staff">Staff</option>
            <option value="Visitor">Visitor</option>
            <option value="Contractor">Contractor</option>
          </select>

          <select value={adminFilter} onChange={(event) => {
            setAdminFilter(event.target.value);
            setCurrentPage(1);
          }}>
            <option value="All">All users</option>
            <option value="Admin">Admins</option>
            <option value="User">Non-admins</option>
          </select>
        </div>

        {/* User records are shown in a paginated table once loading is complete */}
        {loading ? (
          <p>Loading users...</p>
        ) : error ? (
          <p>{error}</p>
        ) : visibleUsers.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table>
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

              {/* Render each visible user as a table row - There will be up to 10 users displayed per page */}
              {visibleUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role || "Student"}
                      disabled={updatingUserId === user._id}
                      onChange={(event) => requestUserUpdate(
                        user._id,
                        { role: event.target.value },
                        `change the role from ${user.role || "Student"} to ${event.target.value}`
                      )}
                    >
                      <option value="Student">Student</option>
                      <option value="Staff">Staff</option>
                      <option value="Visitor">Visitor</option>
                      <option value="Contractor">Contractor</option>
                    </select>
                  </td>
                  <td>{user.isAdmin ? "Yes" : "No"}</td>
                  <td>
                    <button type="button" onClick={() => navigate(`/admin/users/${user._id}`)}>
                      View details
                    </button>
                    <button type="button" onClick={() => navigate(`/admin/users/${user._id}/edit`)}>
                      Edit user
                    </button>
                    <button type="button" onClick={() => navigate(`/admin/users/${user._id}/assigned-issues`)} disabled={!user.isAdmin}>
                      Assigned Issues
                    </button>
                    <button type="button" onClick={() => requestUserUpdate(user._id,
                        { isAdmin: !user.isAdmin },
                        user.isAdmin ? "remove administrator access" : "grant administrator access"
                      )}
                      disabled={
                        updatingUserId === user._id ||
                        (user.isAdmin && isCurrentAdmin(user)) ||
                        (!user.isAdmin && !canGrantAdminAccess(user))
                      }
                      title={
                        user.isAdmin && isCurrentAdmin(user)
                          ? "Another administrator must remove your admin status"
                          : !user.isAdmin && !canGrantAdminAccess(user)
                            ? "Only Staff users can be granted administrator access"
                            : undefined
                      }
                    >
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination controls for navigating through the user list */}
        {!loading && !error && filteredUsers.length > 0 && totalPages > 1 && (
          <div>
            <button type="button" onClick={() => setCurrentPage((page) => page - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <span> Page {currentPage} of {totalPages} </span>
            <button type="button" onClick={() => setCurrentPage((page) => page + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </section>

      {/* Popup to confirm role and administrator status changes */}
      {pendingUpdate && (
        <div className="admin-confirmation-backdrop" role="presentation">
          <div
            className="admin-confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirmation-title"
          >
            <p className="admin-confirmation-eyebrow">Confirm user change</p>
            <h2 id="admin-confirmation-title">Update {pendingUpdate.userName}?</h2>
            <p>
              You are about to {pendingUpdate.changeDescription}. This change
              will be saved to the user&apos;s account.
            </p>
            <div className="admin-confirmation-actions">
              <button type="button" onClick={() => setPendingUpdate(null)}>
                Cancel
              </button>
              <button type="button" className="admin-confirmation-confirm" onClick={updateUser}>
                Confirm change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
