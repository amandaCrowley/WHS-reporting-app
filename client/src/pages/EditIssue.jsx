/**
EditIssue.jsx
 * 
 * This page allows users to edit the details of a single issue, including:
 *  - Description, location, campus, witnesses and any images attached to the issue
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import '../styles/EditIssue.css';

export default function EditIssue() {
    const { issueId } = useParams(); // Get the issue ID from the URL
    const navigate = useNavigate();
    const logout = userLogout(); //Handle logout using logout hook

    //Local state variables
    const [issue, setIssue] = useState(null);       // Stores the fetched issue details
    const [loading, setLoading] = useState(true);   // True while fetching the issue
    const [error, setError] = useState("");         // Stores any error messages
    const [formData, setFormData] = useState({      // Stores the form data for editing the issue
        issueDescription: "",
        location: "",
        campus: "",
        witnessNames: []
    });

    const [updateError, setUpdateError] = useState("");
    const [witnessInput, setWitnessInput] = useState("");

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
                setFormData({
                    ...data,
                    witnessNames: data.witnessNames || []
                });

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false); // Stop loading regardless of success/failure
            }
        };

        fetchIssue(); //Call method to fetch the issue by ID from the backend
    }, [issueId]);

    //update the form data state
    const handleUpdateClick = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /**
    * Update issue in backend/server
    */
    const updateIssue = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/issues/${issueId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const updated = await res.json();
            setIssue(updated);

            navigate(`/myissues`); //Navigate back to the user's issues page after successful update
        } catch (err) {
            setUpdateError(err.message);
        }
    };

    const addWitness = () => {
        const name = witnessInput.trim();
        if (!name) return;

        setFormData(prev => ({
            ...prev,
            witnessNames: [...(prev.witnessNames || []), name]
        }));

        setWitnessInput("");
    };

    const removeWitness = (index) => {
        setFormData(prev => ({
            ...prev,
            witnessNames: (prev.witnessNames || []).filter((_, i) => i !== index)
        }));
    };

    //Display info to the user about what the page is doing
    if (loading) return <p>Loading issue data...</p>;    //This will display whilst the data is being fetched from the database
    if (error) return <p>{error}</p>; //If there is an error, display the error message
    if (!issue) return <p>No issue found.</p>;

    return (
        <div className="edit-issue-page">
            <div className="edit-issue-card">
                <h1>Edit Issue</h1>

                {/* Display error message */}
                {updateError && <p className="error-text">{updateError}</p>}

                <form className="edit-form" onSubmit={(e) => {
                    e.preventDefault();
                    updateIssue();
                }}>

                    <div className="form-section">
                        <label>Description</label>
                        <input name="issueDescription" value={formData?.issueDescription || ""} onChange={handleUpdateClick} />
                    </div>

                    <div className="form-section">
                        <label>Location</label>
                        <input name="location" value={formData?.location || ""} onChange={handleUpdateClick} />
                    </div>

                    <div className="form-section">
                        <label>Campus</label>
                        <select name="campus" value={formData?.campus || ""} onChange={handleUpdateClick}>
                            <option value="Callaghan">Callaghan</option>
                            <option value="Ourimbah">Ourimbah</option>
                            <option value="Newcastle City">Newcastle City</option>
                            <option value="Sydney">Sydney</option>
                            <option value="Port Macquarie">Port Macquarie</option>
                        </select>
                    </div>
                    <div className="form-section">
                        <hr />

                        <p>Witnesses</p>

                        {/* witness list */}
                        {formData?.witnessNames?.map((name, index) => (
                            <li key={index} className="witness-item" >
                                <span>{name}</span>
                                <button
                                    type="button"
                                    className="btn add-btn"
                                    onClick={() => removeWitness(index)}
                                >
                                    x
                                </button>
                            </li>
                        ))}

                        {/* add witness popup*/}
                        <div className="witness-item">
                            <input
                                type="text"
                                placeholder="Add witness name"
                                value={witnessInput}
                                onChange={(e) => setWitnessInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addWitness();
                                    }
                                }}
                            />

                            <button
                                type="button"
                                className="btn add-btn"
                                onClick={addWitness}
                                aria-label="Add witness"
                            >
                                +
                            </button>
                        </div>
                    </div>


                    <div className="update-section">
                        <button type="submit" className="btn primary-btn">
                            Update Issue
                        </button>
                    </div>
                    <button className="btn secondary-btn" onClick={() => navigate("/myissues")}>
                        Back to my issues
                    </button>
                </form>
            </div>
        </div>
    );
}