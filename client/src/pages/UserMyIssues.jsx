/**
 * UserMyIssues.jsx
 * 
 * This page lists all issues submitted by the currently logged in user
 * 
 * Users can search for a specific issue by description location or campus
 * They can also filter their issues by status
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

//Full list of user’s submitted issues (Search, filter, clickon issue leads to issue details page)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { userLogout } from "../hooks/userLogout"


export default function UserMyIssues() {
  const navigate = useNavigate();
  const logout = userLogout();

  //State variables
  const [issues, setIssues] = useState([]);                           // Stores all issues fetched from backend
  const [filteredIssues, setFilteredIssues] = useState([]);           // Stores issues filtered by search/status
  const [loading, setLoading] = useState(true);                       // True while issues are being fetched

  const [search, setSearch] = useState("");                           // Stores the current search query
  const [statusFilter, setStatusFilter] = useState("All");            // Stores selected status filter

  /**
   * Fetches all issues submitted by the current user from the backend server
   */
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        //Get the currently logged in user with Firebase getAuth() method
        const auth = getAuth(); 
        const user = auth.currentUser;

        if (!user) return; //User is empty, return

        const res = await fetch(
          `http://localhost:8000/api/issues/user/${user.uid}` //get all issues with this user ID
        );
        const data = await res.json(); 

        setIssues(data); // Save the returned issue data in the state variable
        setFilteredIssues(data);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
      } finally {
        setLoading(false); // Stop loading regardless of success/failure
      }
    };

    fetchIssues(); //Call the fetch issues method to retireve the user's issues
  }, []);

   /**
   * Filter or search for issues whenever the search input, status filter, or original issues change
   * 
   * Allows searching by description, campus, and location
   * Allows filtering by status
   */
  useEffect(() => {
    let temp = issues;

    // Filter by status if not set to retrieve "All" issues
    if (statusFilter !== "All") {
      temp = temp.filter(issue => issue.status === statusFilter);
    }

    // Filter by search query if something is typed into the search bar
    if (search.trim()) {
      const searchLower = search.toLowerCase();

      temp = temp.filter(issue =>
        issue.issueDescription?.toLowerCase().includes(searchLower) ||  //search by description
        issue.campus?.toLowerCase().includes(searchLower) ||            //search by campus
        issue.location?.toLowerCase().includes(searchLower)             //search by location
      );
    }

    setFilteredIssues(temp); // Update the filtered issues state
  }, [search, statusFilter, issues]);

  // Display loading message while fetching issues
  if (loading) return <p>Loading your issues...</p>;

  return (
    <div>
      <h1>My Issues</h1>

      {/* Search bar - can search by issue descriptions + campus + location*/}
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
            <strong>{issue.issueDescription}</strong>

            {/* Status badge */}
            <p>
              Status: {issue.status}
            </p>
            <p>
              <em>{issue.location} | {issue.campus} </em>
            </p>
            <p>
              Date reported: {new Date(issue.dateTimeReported).toLocaleString("en-AU", {
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
      <br />
      <button onClick={logout}>Logout</button>
    </div>
    
  );
}