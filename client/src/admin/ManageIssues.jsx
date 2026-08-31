/**
 * ManageIssues.jsx
 *
 * This page is displayed when an admin user navigates to the manage issues page.
 * It displays a list of all issues in the system, with options to filter, search, and sort the issues.
 * Admin users can also assign issues to themselves, unassign issues, and update the status of issues.
 *
 * Author/s: Dinh Dinh & Amanda Foxley
 * Date: 27/8/26
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";

export default function ManageIssues() {
  const navigate = useNavigate();
  const logout = userLogout();
  const { userData } = getUserData();

  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignmentFilter, setAssignmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [assigningIssueId, setAssigningIssueId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const issuesPerPage = 10;

  const fetchIssues = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/issues"); //get all issues from the backend

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
  }, []);

  // Filter and sort issues whenever the issues, search, statusFilter, assignmentFilter, userData, or sortBy state changes
  useEffect(() => {
    let temp = [...issues];

    // Filter by status
    if (statusFilter !== "All") {
      temp = temp.filter((issue) => issue.status === statusFilter);
    }

    // Filter by assignment
    if (assignmentFilter !== "All") {
      temp = temp.filter((issue) => {
        const assignedToMe =
          issue.assignedTo && userData && String(issue.assignedTo) === String(userData._id);

        if (assignmentFilter === "Assigned to me") return assignedToMe;
        if (assignmentFilter === "Assigned to others") return !!issue.assignedTo && !assignedToMe;
        if (assignmentFilter === "Unassigned") return !issue.assignedTo;
        return true;
      });
    }

    // Filter by search term on title, description, campus, location, or reporter
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();

      temp = temp.filter(
        (issue) =>
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

    setFilteredIssues(temp); // Update the filtered issues state
    setCurrentPage(1);
  }, [issues, search, statusFilter, assignmentFilter, userData, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredIssues.length / issuesPerPage); // Calculate total pages based on filtered issues and issues per page
  const visibleIssues = filteredIssues.slice( // Get the issues to display on the current page
    (currentPage - 1) * issuesPerPage,
    currentPage * issuesPerPage
  );

  //Helper method to assign an issue to the current user. This will update the assignedTo field in the mongoDB database for that issue to the current user's id.
  const assignIssueToMe = async (issueId) => {
    if (!userData?.firebaseUid) return;

    try {
      setAssigningIssueId(issueId);

      const response = await fetch(`http://localhost:8000/api/issues/${issueId}/assign`, { //get the issue from mongoDB using it's issue id
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: userData.firebaseUid }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to assign issue");
      }

      //update the issues state with the updated issue data returned from the server. This will update the UI to reflect the change in admin assignment.
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

  //Helper method to unassign an issue from the current user. This will clear the assignedTo field to null in the mongoDB database for that issue.
  const unassignIssue = async (issueId) => {
    try {
      setAssigningIssueId(issueId);

      const response = await fetch(`http://localhost:8000/api/issues/${issueId}/unassign`, { //get the issue from mongoDB using it's issue id
        method: "PUT",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to clear assignment");
      }

      //update the issues state with the updated issue data returned from the server. This will update the UI to reflect the change in admin assignment.
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

  // Function to update the status of an issue - can be open, in progress or closed. Admins can change the status of any issue
  const updateIssueStatus = async (issueId, nextStatus) => { //nextStatus is the new status
    try {
      setUpdatingStatusId(issueId);

      const response = await fetch(`http://localhost:8000/api/issues/${issueId}`, { //get the issue from mongoDB using it's id
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }), //update the status of the issue to the new status
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update issue status");
      }

      const updatedIssue = await response.json();
      setIssues((currentIssues) => // update the current issues state with the updated issue these will be displayed on the manage issues page
        currentIssues.map((issue) =>
          issue._id === issueId ? updatedIssue : issue
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not update issue status");
    } finally {
      setUpdatingStatusId(null);
    }
  };


  return (
    <div className="admin-manage-issues">
      <div>
        <h1>Manage Issues</h1>
        <button type="button" onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
        <button type="button" onClick={() => navigate("/admin/usermanagement")}>User Management</button>
        <button type="button" onClick={logout}>Logout</button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search by title, description, campus, location or reporter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={assignmentFilter}
          onChange={(e) => setAssignmentFilter(e.target.value)}
        >
          <option value="All">All assignments</option>
          <option value="Unassigned">Unassigned</option>
          <option value="Assigned to me">Assigned to me</option>
          <option value="Assigned to others">Assigned to others</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="Newest">Newest first</option>
          <option value="Oldest">Oldest first</option>
        </select>
      </div>

      {loading ? (
        <p>Loading issues...</p>
      ) : filteredIssues.length === 0 ? (
        <p>No issues found.</p>
      ) : (
        <ul>

          {/* List to display all issues in the system - these can be filtered/searched as needed */}
          {visibleIssues.map((issue) => {
            const isAssignedToMe =
              userData && issue.assignedTo && String(issue.assignedTo) === String(userData._id);

            return (
              <li key={issue._id}>
                <strong>{issue.title}</strong>
                <div>{issue.location} · {issue.campus}</div>
                <div>Status: {issue.status}</div>
                <div>Reported by: {issue.reportedByName || "Unknown"}</div>
                <div>
                  Reported: {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
                <div>
                  Assigned to: {issue.assignedToName || "Unassigned"}
                </div>

                <div>
                  <label htmlFor={`status-${issue._id}`}>Status:</label>
                  <select
                    id={`status-${issue._id}`}
                    value={issue.status || "Open"}
                    onChange={(e) => updateIssueStatus(issue._id, e.target.value)}
                    disabled={updatingStatusId === issue._id}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/issue/${issue._id}`)}
                >
                  View Issue
                </button>

                {!issue.assignedTo || isAssignedToMe ? (
                  <button
                    type="button"
                    onClick={() => assignIssueToMe(issue._id)}
                    disabled={assigningIssueId === issue._id || isAssignedToMe || issue.status === "Closed"}
                  >
                    {isAssignedToMe ? "Assigned to You" : "Assign to Me"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={true}
                    title="This issue is already assigned to another user"
                  >
                    Assign to Me
                  </button>
                )}

                {issue.assignedTo && (
                  <button
                    type="button"
                    onClick={() => unassignIssue(issue._id)}
                    disabled={assigningIssueId === issue._id || issue.status === "Closed"}
                  >
                    Clear Assignment
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination controls */}
      {!loading && filteredIssues.length > 0 && totalPages > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => page - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span> Page {currentPage} of {totalPages} </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
