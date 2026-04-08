/**
 * .jsx
 * 
 * 
 * Author/s: Amanda Foxley
 * Date: 8/4/26
 */

// form to submit new issues (description, location, images etc)

import { useNavigate } from "react-router-dom";

export default function ReportIssue() {
  const navigate = useNavigate();

  return (
    <div>
        <h1>Report Issue</h1>
        <p>Submit a new issue report.</p>

        <br/>
        <button onClick={() => navigate("/userdashboard")}>Back to Dashboard</button>
        
    </div>
  );
}