//Full list of user’s submitted issues (Search, filter, clickon issue leads to issue details page)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

export default function UserMyIssues() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) return;

        const res = await fetch(
          `http://localhost:8000/api/issues/user/${user.uid}` //get all issues with this user ID
        );
        const data = await res.json();

        setIssues(data);
        setFilteredIssues(data);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  //Filter issues
  useEffect(() => {
    let temp = issues;

    if (statusFilter !== "All") {
      temp = temp.filter(issue => issue.Status === statusFilter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();

      temp = temp.filter(issue =>
        issue.IssueDescription?.toLowerCase().includes(searchLower) ||
        issue.Campus?.toLowerCase().includes(searchLower) ||
        issue.Location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredIssues(temp);
  }, [search, statusFilter, issues]);

  if (loading) return <p>Loading your issues...</p>;

  return (
    <div>
      <h1>My Issues</h1>

      {/* Search issue descriptions + campus + location*/}
      <input
        type="text"
        placeholder="Search issues..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginRight: "10px" }}
      />

      {/* Filter issues by status */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="All">All</option>
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
      </select>

      <hr />

      {/* Issues list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredIssues.length === 0 && <p>No issues found.</p>}

        {filteredIssues.map(issue => (
          <div

            key={issue._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "10px",
              backgroundColor: "#f9f9f9",
            }}
            onClick={() => navigate(`/issue/${issue._id}`)}
          >
            <strong>{issue.IssueDescription}</strong>

            {/* Status badge */}
            <p>
              Status:{issue.Status}
            </p>
            <p>
              <em>{issue.Location} | {issue.Campus} </em>
            </p>
            <p>
              Date reported: {new Date(issue.DateTimeReported).toLocaleString("en-AU", {
                dateStyle: "short"
              })}
            </p>
          </div>
        ))}
      </div>

      <br />
      <button onClick={() => navigate("/userdashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}