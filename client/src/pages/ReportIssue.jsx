/**
 * ReportIssue.jsx
 * 
 * This page is used to submit a user's issues/hazards they have encountered on UoN campuses
 * It contains a form to submit new issues (description, location, images etc)
 * 
 * Author/s: Amanda Foxley
 * Date: 8/4/26
 */

import { useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout"


export default function ReportIssue() {
  const navigate = useNavigate();
  const logout = userLogout();

  return (
    <div>
        <h1>Report Issue</h1>
        <p>Submit a new issue report.</p>

        <br/>
        <button onClick={() => navigate("/userdashboard")}>Back to Dashboard</button>
        <br />
        <button onClick={logout}>Logout</button>
        
    </div>
  );
}