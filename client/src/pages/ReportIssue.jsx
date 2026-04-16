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
import { useState } from 'react';
import { userLogout } from "../hooks/userLogout"
import { getUserData } from "../hooks/getUserData"


export default function ReportIssue() {
  const navigate = useNavigate(); //Used to navigate to myIssues page
  const logout = userLogout();  //Function from userLogout hook to logout the current user
  const { userData, loading, error } = getUserData();

  //Local states to be used for report form
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [campus, setCampus] = useState("");
  const [location, setLocation] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [hasWitnesses, setHasWitnesses] = useState("no"); //yes/no witness radio button
  const [witnessInput, setWitnessInput] = useState("");   //Add each name individually to the list
  const [witnessList, setWitnessList] = useState([]);     //Witness names list

  const submitIssue = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    // Basic validation to check if all required fields are filled in
    if (!location.trim() || !issueDescription.trim()) {
      setFormError("All fields are required.");
      setFormLoading(false);
      return;
    }

    //Check the user has selected a campus
    if (campus === "default" || campus === "") {
      setFormError("Please select a campus");
      setFormLoading(false);
      return;
    }

    //If the user selected they had a witness but didn't add a name
    if (hasWitnesses === "yes" && witnessList.length === 0) {
      setFormError("Please add at least one witness or select 'No'.");
      setFormLoading(false);
      return;
    }

    // User data empty, return an error
    if (!userData?._id) {
      setFormError("User not loaded. Please try again.");
      setFormLoading(false);
      return;
    }

    //Check the issue description is at least 10 characters
    if (issueDescription.trim().length < 10) {
      setFormError("Issue description must be at least 10 characters.");
      setFormLoading(false);
      return;
    }

    //Check the issue description is under 300 characters    
    if (issueDescription.trim().length > 300) {
      setFormError("Issue description must be under 300 characters.");
      setFormLoading(false);
      return;
    }
    
    //Check the location is at least 3 characters
     if (location.trim().length < 3) {
      setFormError("Location must be at least 3 characters.");
      setFormLoading(false);
      return;
    }

    try {
      // Send issue data to backend to save in MongoDB - send the user's MongoDB user id to be saved with the issue
      const response = await fetch(`http://localhost:8000/api/issue/${userData._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus,
          location: location.trim(),
          issueDescription: issueDescription.trim(),
          witnessNames: hasWitnesses === "yes" ? witnessList : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user in database");
      }

      //Success. Redirect to user's myissues page
      navigate("/myissues");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  //Function to add a witness name to the issue
  const addWitness = () => {
    const witnessName = witnessInput.trim();

    if (!witnessName) return;

    //Check for duplicate witnesses already in the list
    if (witnessList.includes(witnessName)) {
      setFormError("This witness has already been added.");
      return;
    }
    setWitnessList([...witnessList, witnessName]); //Add the witness name to the list
    setWitnessInput(""); // clear input
  };

  //Function to remove a witness from the list (using the index)
  const removeWitness = (index) => {
    const updated = witnessList.filter((_, i) => i !== index);
    setWitnessList(updated);
  };

  return (
    <div>
      <h1>Report Issue</h1>
      <p>Submit a new issue here</p>
      <br />

      {/* Campus */}
      <select
        value={campus}
        onChange={(e) => setCampus(e.target.value)}
      >
        <option value="default">Select Campus</option>
        <option value="Callaghan">Callaghan</option>
        <option value="Newcastle City">Newcastle City</option>
        <option value="Ourimbah">Ourimbah</option>
        <option value="Gosford Hospital">Gosford Hospital</option>
        <option value="Gosford Mann Street">Gosford Mann Street</option>
        <option value="Sydney">Sydney</option>
        <option value="Port Macquarie">Port Macquarie</option>

      </select>
      <br /><br />
      {/* Location */}
      <input
        type="text"
        placeholder="Location on campus"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />
      <br /><br />
      {/* Issue description */}
      <textarea
        placeholder="Issue description"
        value={issueDescription}
        onChange={(e) => setIssueDescription(e.target.value)}
        required
      />
      <hr />
      <p>Were there any witnesses?</p>
      <label>
        <input
          type="radio"
          value="yes"
          checked={hasWitnesses === "yes"}
          onChange={(e) => setHasWitnesses(e.target.value)}
        />
        Yes
      </label>

      <label>
        <input
          type="radio"
          value="no"
          checked={hasWitnesses === "no"}
          onChange={(e) => {
            if (e.target.value === "no" && witnessList.length > 0) {
              setFormError("Remove all witnesses before selecting 'No'.");
              return;
            }
            setHasWitnesses(e.target.value);
          }}
        />
        No
      </label>
      <br />
      {/* Display the witness section if there were witnesses */}
      {hasWitnesses === "yes" && (
        <>
          <input
            type="text"
            placeholder="Enter witness name"
            value={witnessInput}
            onChange={(e) => setWitnessInput(e.target.value)}
          />
          <button type="button" onClick={addWitness}>
            Add
          </button>


          {/* Display witness list */}
          {witnessList.length > 0 && (
            <ul>
              {witnessList.map((name, index) => (
                <li key={index} style={{ listStyleType: "none" }}>
                  {name}
                  <button onClick={() => removeWitness(index)}> {/* Remove the witness using the index*/}
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Displays error message here */}
      {formError && (
        <div style={{
          color: "red",
          backgroundColor: "#ffe6e6",
          padding: "10px",
          borderRadius: "5px",
          marginBottom: "15px",
          textAlign: "center"
        }}>
          {formError}
        </div>
      )}

      <hr />
      <br />
      <button onClick={submitIssue} disabled={formLoading}>
        {formLoading ? "Submitting..." : "Submit Issue"}
      </button>
      <br />
      <button onClick={() => navigate("/userdashboard")}>Back to Dashboard</button>
      <br />
      <button onClick={logout}>Logout</button>

    </div>
  );
}