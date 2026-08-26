/**
 * IssueDetails.jsx
 * 
 * This page displays all of the details of a single issue, including:
 *  - Description, status, location, campus, reported data and time, witnesses, staff assignment and any images attached to the issue
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";

export default function IssueDetails() {
  const { issueId } = useParams(); // Get the issue ID from the URL
  const navigate = useNavigate();
  const logout = userLogout(); //Handle logout using logout hook

  //Local state variables
  const [issue, setIssue] = useState(null);       // Stores the fetched issue details
  const [loading, setLoading] = useState(true);   // True while fetching the issue
  const [error, setError] = useState("");         // Stores any error messages
  const [selectedImage, setSelectedImage] = useState(null);

  /**
   * Fetch the issue details from the server/backend when this page/component loads or if the issueId changes
   */
  useEffect(() => {
    const fetchIssue = async () => {
      try {

        // Call backend API to fetch issue by ID
        const res = await fetch(`http://localhost:8000/api/issues/${issueId}`);
        if (!res.ok) throw new Error("Failed to fetch issue");
        const data = await res.json();

        setIssue(data);   // Store fetched issue in state

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false); // Stop loading regardless of success/failure
      }
    };

    fetchIssue(); //Call method to fetch the issue by ID from the backend
  }, [issueId]);

  //Display info to the user about what the page is doing
  if (loading) return <p>Loading user data...</p>;    //This will display whilst the data is being fetched from the database
  if (error) return <p>{error}</p>; //If there is an error, display 
  if (!issue) return <p>No issue found.</p>;

  return (

    <div>


      <h1>Issue Details</h1>

      <strong>Reported by:</strong> {issue.reportedByName}

      {/* Issue description */}
      <p>
        <strong>Description:</strong> {issue.issueDescription}
      </p>

      {/* issue status */}
      <p>
        <strong>Status:</strong> {issue.status}
      </p>

      {/* issue location */}
      <p>
        <strong>Location:</strong> {issue.location}, {issue.campus}
      </p>

      {/* Issue reported date */}
      <p>
        <strong>Reported on:</strong>{" "}
        {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
          dateStyle: "short",
          timeStyle: "short",
        })}

        {/* Witness names, if any */}
      </p>
      {issue.witnessNames && issue.witnessNames.length > 0 && (
        <p>
          <strong>Witnesses:</strong> {issue.witnessNames.join(", ")}
        </p>
      )}

      {/* Assigned to staff memeber */}
      <strong>Assigned to:</strong>{" "}
      {issue.assignedToName || "Unassigned"}

      <br /><br />
      {/* Images, if any */}
      {issue.imageURLs?.length > 0 ? (
        <div style={{ marginTop: "10px" }}>
          {issue.imageURLs.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Issue ${index + 1}`}
              onClick={() => setSelectedImage(url)}
              style={{
                width: "200px",
                marginRight: "10px",
                marginBottom: "10px",
                cursor: "pointer",
                borderRadius: "6px",
              }}
            />
          ))}
        </div>
      ) : (
        <p>No images attached.</p>
      )}

      {/* Navigation buttons */}
      <button onClick={() => navigate(`/editIssue/${issueId}`)}>Edit Issue</button>
      <button onClick={() => navigate("/myissues")}>Back to my issues</button>
      <button onClick={() => navigate("/userdashboard")}>Back to Dashboard</button>
      <br /><br />
      <button onClick={logout}>Logout</button>

      {/*This section handles the display of a selected image in an overlay when a user clicks on an image thumbnail. It also provides a close button to exit the overlay. */}
      {/**Display the selected image in an overlay */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          {/* Close button properties for the image*/}
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              fontSize: "32px",
              background: "transparent",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>

          {/** Display the selected image with these properties */}
          <img
            src={selectedImage}
            alt="Image of the selected issue"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "8px",
            }}
          />
        </div>
      )}

    </div>
  );
}