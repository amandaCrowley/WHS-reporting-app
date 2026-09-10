/**
 * AdminEditUser.jsx
 *
 * Page for editing a user's account details.
 * 
 * Author/s: Amanda Foxley
 * Date: 31/8/26
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import "../styles/AdminEditUser.css"; 

const ROLE_OPTIONS = ["Student", "Staff", "Visitor", "Contractor"];

export default function AdminEditUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const logout = userLogout();
  const { userData } = getUserData();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "Student",
    isAdmin: false,
  });


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch user");
        }

        const userDataFromServer = await response.json();
        setUser(userDataFromServer);
        setFormData({
          firstName: userDataFromServer.firstName || "",
          lastName: userDataFromServer.lastName || "",
          role: userDataFromServer.role || "Student",
          isAdmin: Boolean(userDataFromServer.isAdmin),
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load user");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // only be able to grant admin to staff
  const canGrantAdminAccess = formData.role === "Staff";

  // role change logic
  const handleRoleChange = (event) => {
    const nextRole = event.target.value;
    setFormData((current) => ({
      ...current,
      role: nextRole,
      isAdmin: nextRole === "Staff" ? current.isAdmin : false,
    }));
  };

  // save changes 
  const handleSave = async () => {
    if (!userData?.firebaseUid) {
      setError("Admin details are not available. Please refresh and try again.");
      return;
    }

    // use edit profile method adapted for admin facing page
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();

    if (!trimmedFirstName) {
      setError("Please enter a first name.");
      return;
    }

    if (trimmedFirstName.length < 2) {
      setError("First name must be at least 2 characters.");
      return;
    }

    if (!trimmedLastName) {
      setError("Please enter a last name.");
      return;
    }

    if (trimmedLastName.length < 2) {
      setError("Last name must be at least 2 characters.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminFirebaseUid: userData.firebaseUid,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          role: formData.role,
          isAdmin: canGrantAdminAccess && formData.isAdmin,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      navigate(`/admin/users/${userId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update user");
    } finally {
      setSaving(false);
    }
  };

  //delete user from database 
  const handleDelete = async () => {
    if (!userData?.firebaseUid) {
      setError("Admin details are not available. Please refresh and try again.");
      return;
    }

    const confirmed = window.confirm(`Remove ${user?.firstName || "this user"} ${user?.lastName || ""} from the database? This cannot be undone.`);
    if (!confirmed) return;

    setError("");
    setDeleting(true);

    try {
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminFirebaseUid: userData.firebaseUid }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      navigate("/admin/usermanagement");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div><h1>Edit User</h1><p>Loading user details...</p></div>;
  }

  return (
    <div className="admin-edit-user">
      <div>
        <h1>Edit User Details</h1>
      </div>

      <div>
        <button type="button" onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
        <button type="button" onClick={() => navigate("/admin/manageissues")}>Manage Issues</button>
        <button type="button" onClick={() => navigate("/admin/usermanagement")}>User Management</button>
        <button type="button" onClick={logout}>Logout</button>
      </div>

      <section>
        <h2>User account</h2>

        {error && <p style={{ color: "#b42318", fontWeight: 700 }}>{error}</p>}

        {user && (
          <>
            <div className="admin-role-field">
              <label htmlFor="admin-user-first-name">First name</label>
              <input
                id="admin-user-first-name"
                type="text"
                value={formData.firstName}
                onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="admin-user-last-name">Last name</label>
              <input
                id="admin-user-last-name"
                type="text"
                value={formData.lastName}
                onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))}
              />
            </div>

            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Firebase UID:</strong> {user.firebaseUid}</p>

            <div className="admin-role-field">
              <label htmlFor="admin-user-role">Role</label>
              <select
                id="admin-user-role"
                value={formData.role}
                onChange={handleRoleChange}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="admin-access-control">
              <label>
                <input
                  type="checkbox"
                  checked={canGrantAdminAccess && formData.isAdmin}
                  disabled={!canGrantAdminAccess}
                  onChange={(event) => {
                    if (!canGrantAdminAccess) return;
                    setFormData((current) => ({ ...current, isAdmin: event.target.checked }));
                  }}
                />
                Administrator access
              </label>
              {!canGrantAdminAccess && (
                <p className="admin-access-help">
                  Admin access is only available to Staff users.
                </p>
              )}
            </div>

            <div className="admin-form-actions">
              <button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={() => navigate(`/admin/users/${userId}`)}>
                Cancel
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || user.firebaseUid === userData?.firebaseUid}
                style={{ background: "#b42318", color: "#fff" }}
              >
                {deleting ? "Deleting..." : "Remove user from database"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
