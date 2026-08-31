/**
 * AdminEditUser.jsx
 *
 * Page for editing a user's account details.
 * 
 * Author/s: Amanda Foxley
 * Date: 31/8/26
 */

import { useNavigate, useParams } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";

export default function AdminEditUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const logout = userLogout();

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
        <p>Add user edit form</p>
        <p>Email and Firebase UID read-only</p>
      </section>

      <section>
        <h2>Perhaps a send password reset email option????</h2>
      </section>

      <button type="button" onClick={() => navigate(`/admin/users/${userId}`)}>
        Back to User Details
      </button>
    </div>
  );
}
