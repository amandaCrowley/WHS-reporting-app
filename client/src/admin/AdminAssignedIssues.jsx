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
 */

import { useNavigate, useParams } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";

export default function AdminAssignedIssues() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const logout = userLogout();

  return (
    <div className="admin-assigned-issues">
      <div>
        <h1>Assigned Issues</h1>
      </div>

      <div>
        <button type="button" onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
        <button type="button" onClick={() => navigate("/admin/manageissues")}>Manage Issues</button>
        <button type="button" onClick={() => navigate("/admin/usermanagement")}>User Management</button>
        <button type="button" onClick={logout}>Logout</button>
      </div>

      <section>
        <h2>Administrator Summary</h2>
        <p>administrator's name and email</p>
        <div>
          <p>Total assigned issues: </p>
          <p>Open issues: </p>
          <p>In progress issues: </p>
          <p>Closed issues: </p>
        </div>
      </section>

      <section>
        <h2>Assigned Issue List</h2>
        <p>Issues assigned to this administrator will be displayed here.</p>
      </section>

      <button type="button" onClick={() => navigate("/admin/usermanagement")}>
        Back to User Management
      </button>
    </div>
  );
}
