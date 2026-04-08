import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function IssueDetails() {
  const { issueId } = useParams(); // Get the issue ID from the URL
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/issues/${issueId}`);
        if (!res.ok) throw new Error("Failed to fetch issue");
        const data = await res.json();
        setIssue(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [issueId]);

  if (loading) return <p>Loading issue details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!issue) return <p>No issue found.</p>;

  return (

    <div>
      <h1>Issue Details</h1>
      <p>
        <strong>Description:</strong> {issue.IssueDescription}
      </p>
      <p>
        <strong>Status:</strong> {issue.Status}
      </p>
      <p>
        <strong>Location:</strong> {issue.Location}, {issue.Campus}
      </p>
      <p>
        <strong>Reported on:</strong>{" "}
        {new Date(issue.DateTimeReported).toLocaleString("en-AU", {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </p>
      {issue.WitnessNames && issue.WitnessNames.length > 0 && (
        <p>
          <strong>Witnesses:</strong> {issue.WitnessNames.join(", ")}
        </p>
      )}
      <p><strong>Assigned to staff:</strong> {issue.AssignedTo ? "Yes" : "No"}</p>
      <p>
        <strong>Image/s:</strong>
        {issue.ImageURL && issue.ImageURLs.map((url, i) => (
          <img key={i} src={url} alt="Issue" style={{ maxWidth: "200px", margin: "5px" }} />
        ))}
      </p>
      <br />
      <br />
      <button onClick={() => navigate("/myissues")}>Back to my issues</button>
      <button onClick={() => navigate("/userdashboard")}>Back to Dashboard</button>
    </div>
  );
}