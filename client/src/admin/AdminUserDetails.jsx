/**
 * AdminUserDetails.jsx
 *
 * Page for viewing a user's account details and reported issues.
 * 
 * Author/s: Amanda Foxley
 * Date: 31/8/26
 */

import { useNavigate, useParams } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";

export default function AdminUserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const logout = userLogout();

  return (
    <div className="admin-user-details">
      <div>
        <button type="button" onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
        <button type="button" onClick={() => navigate("/admin/manageissues")}>Manage Issues</button>
        <button type="button" onClick={() => navigate("/admin/usermanagement")}>User Management</button>
        <button type="button" onClick={logout}>Logout</button>
      </div>

      <section>
        <h2>Account Information</h2>
        <p>User information will be displayed here.</p>
        <button type="button" onClick={() => navigate(`/admin/users/${userId}/edit`)}>
          Edit User Details
        </button>
      </section>

      <section>
        <h2>Reported Issues</h2>
        <p>Issues reported by this user will be displayed here.</p>
        <p>Note: This section will only display issues <strong>reported by the user</strong>, not issues assigned to them.</p>
        <p>Add view issue functionality here as well - links back to issue details</p>
      </section>
    </div>
  );
}
31