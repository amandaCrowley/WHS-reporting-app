/**
EditIssue.jsx
 * 
 * This page allows users to edit the details of a single issue, including:
 *  - Title, Description, location, campus, witnesses and any images attached to the issue
 *  - Admins can also add progress comments to the issue
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserData } from "../hooks/getUserData";
import '../styles/EditIssue.css';

export default function EditIssue() {
    const { issueId } = useParams(); // Get the issue ID from the URL
    const navigate = useNavigate();
    const { userData } = getUserData();

    //Local state variables
    const [issue, setIssue] = useState(null);       // Stores the fetched issue details
    const [loading, setLoading] = useState(true);   // True while fetching the issue
    const [error, setError] = useState("");         // Stores any error messages
    const [formData, setFormData] = useState({      // Stores the form data for editing the issue
        title: "",
        issueDescription: "",
        location: "",
        campus: "",
        priority: "Medium",
        comments: [],
        imageURLs: [],
        witnessNames: []
    });

    const [updateError, setUpdateError] = useState("");
    const [witnessInput, setWitnessInput] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [images, setImages] = useState([]);

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
                    title: data.title || "",
                    issueDescription: data.issueDescription || "",
                    location: data.location || "",
                    campus: data.campus || "",
                    priority: data.priority || "Medium",
                    comments: [],
                    imageURLs: data.imageURLs || [],
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
            const body = new FormData();
            body.append("title", formData.title || "");
            body.append("issueDescription", formData.issueDescription || "");
            body.append("location", formData.location || "");
            body.append("campus", formData.campus || "");
            if (userData?.isAdmin) {
                body.append("priority", formData.priority || "Medium");
            }
            body.append("witnessNames", JSON.stringify(formData.witnessNames || []));
            body.append("imageURLs", JSON.stringify(formData.imageURLs || []));
            images.forEach(image => body.append("images", image.file));

            const res = await fetch(`http://localhost:8000/api/issues/${issueId}`, {
                method: "PUT",
                body
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update issue");
            }

            const updated = data;
            setIssue(updated);

            if (userData?.isAdmin && formData.comments.length > 0) {
                await Promise.all(formData.comments.map(async (comment) => {
                    const commentResponse = await fetch(`http://localhost:8000/api/issues/${issueId}/comments`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ firebaseUid: userData.firebaseUid, comment }),
                    });
                    const commentData = await commentResponse.json();
                    if (!commentResponse.ok) {
                        throw new Error(commentData.error || "Failed to add comment");
                    }
                }));
            }

            if (userData?.isAdmin) {
                navigate("/admin/manageissues");
                return;
            }

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

    const addComment = () => {
        const comment = commentInput.trim();
        if (!comment) return;

        setFormData(prev => ({
            ...prev,
            comments: [...(prev.comments || []), comment]
        }));
        setCommentInput("");
    };

    const removeComment = (index) => {
        setFormData(prev => ({
            ...prev,
            comments: (prev.comments || []).filter((_, commentIndex) => commentIndex !== index)
        }));
    };

    const removeExistingImage = (url) => {
        setFormData(prev => ({
            ...prev,
            imageURLs: (prev.imageURLs || []).filter(imageUrl => imageUrl !== url)
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
                        <label>Title</label>
                        <input name="title" value={formData?.title || ""} onChange={handleUpdateClick} />
                    </div>
                    <div className="form-section">
                        <label>Description</label>
                        <textarea
                            name="issueDescription"
                            value={formData?.issueDescription || ""}
                            onChange={handleUpdateClick}
                            minLength={10}
                            maxLength={300}
                            style={{
                                width: "100%",
                                height: "100px",
                                resize: "vertical",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                padding: "10px",
                                boxSizing: "border-box"
                            }} />
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
                    {userData?.isAdmin && (
                        <div className="form-section">
                            <label htmlFor="priority">Priority</label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData?.priority || "Medium"}
                                onChange={handleUpdateClick}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    )}
                    <div className="form-section">
                        <hr />

                        <p>Witnesses</p>

                        {/* witness list */}
                        {formData?.witnessNames?.map((name, index) => (
                            <li key={index} className="multiple-item" >
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
                        <div className="multiple-item">
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

                    {userData?.isAdmin && (
                    <>
                        <div className="form-section">
                            <label>Progress or resolution comments</label>
                            {formData.comments?.map((comment, index) => (
                                <div className="multiple-item" key={`${comment}-${index}`}>
                                    <span>{comment}</span>
                                    <button
                                        type="button"
                                        className="btn add-btn"
                                        onClick={() => removeComment(index)}
                                        aria-label={`Remove comment ${index + 1}`}
                                    >
                                        x
                                    </button>
                                </div>
                            ))}
                            <div className="multiple-item">
                                <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                maxLength={300}
                                placeholder="Add comment"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        addComment();
                                    }
                                }}
                                />
                                <button
                                    type="button"
                                    className="btn add-btn"
                                    onClick={addComment}
                                    aria-label="Add comment"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </>
                    )}


                    <div className="form-section">
                        <hr />

                        <p>Issue image/s</p>

                        {/* Existing images */}
                        {formData?.imageURLs?.length > 0 && (
                            <div className="edit-image-grid">
                                {formData.imageURLs.map((url, index) => (
                                    <div
                                        className="edit-image-card"
                                        key={url}
                                    >
                                        <img
                                            src={url}
                                            alt={`Evidence ${index + 1}`}
                                        />

                                        <button
                                            type="button"
                                            className="image-remove-btn"
                                            onClick={() => removeExistingImage(url)}
                                            aria-label={`Remove existing image ${index + 1}`}
                                            title="Remove image"
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Newly selected images */}
                        {images.length > 0 && (
                            <div className="edit-image-grid">
                                {images.map((image, index) => (
                                    <div className="edit-image-card" key={image.preview}>
                                        <img
                                            src={image.preview}
                                            alt={`New issue image ${index + 1}`}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover"
                                            }}
                                        />

                                        <button
                                            type="button"
                                            className="image-remove-btn"
                                            onClick={() => {
                                                URL.revokeObjectURL(image.preview);

                                                setImages(prev =>
                                                    prev.filter((_, i) => i !== index)
                                                );
                                            }}
                                            aria-label={`Remove new image ${index + 1}`}
                                            title="Remove image"
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            multiple
                            onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                const existingCount = formData?.imageURLs?.length || 0;

                                if (selectedFiles.length === 0) return;

                                const validTypes = [
                                    "image/jpeg",
                                    "image/png",
                                    "image/gif",
                                    "image/webp"
                                ];

                                if (existingCount + images.length + selectedFiles.length > 5) {
                                    setUpdateError("Maximum 5 images allowed.");
                                    return;
                                }

                                const MAX_SIZE = 5 * 1024 * 1024;

                                for (const file of selectedFiles) {
                                    if (!validTypes.includes(file.type)) {
                                        setUpdateError(`${file.name} is not a supported image type.`);
                                        return;
                                    }

                                    if (file.size > MAX_SIZE) {
                                        setUpdateError(`${file.name} exceeds 5MB.`);
                                        return;
                                    }
                                }

                                const newImages = selectedFiles.map(file => ({
                                    file,
                                    preview: URL.createObjectURL(file)
                                }));

                                setImages(prev => [...prev, ...newImages]);
                                setUpdateError("");

                                // Allows selecting the same file again later
                                e.target.value = "";
                            }}
                        />
                    </div>

                    <div className="update-section">
                        <button type="submit" className="btn primary-btn">
                            Update Issue
                        </button>
                    </div>
                    <button
                        type="button"
                        className="btn secondary-btn"
                        onClick={() => navigate(`/issue/${issueId}`)}
                    >
                        Back to Issue Details
                    </button>

                    <button
                        type="button"
                        className="btn secondary-btn"

                        // If the user is an admin, navigate back to the admin manage issues page, otherwise navigate back to the user's my issues page
                        onClick={() => navigate(userData?.isAdmin ? "/admin/manageissues" : "/myissues")}
                    >
                        {/* If the user is an admin, show "Back to Manage Issues", otherwise show "Back to my issues" */}
                        {userData?.isAdmin ? "Back to Manage Issues" : "Back to my issues"}
                    </button>
                </form>
            </div>
        </div>
    );
}