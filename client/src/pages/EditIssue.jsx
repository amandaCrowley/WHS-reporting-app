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

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import { CircleAlert, CloudUpload, FilePlus2, LayoutDashboard, LogOut, UserRound, Users, Wrench } from "lucide-react";
import UONLogo from "../images/UONLogo White.png";
import "../pages/UserDashboard.css";
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
        dateTimeIssueOccurred: "",
        comments: [],
        imageURLs: [],
        witnessNames: []
    });

    const [updateError, setUpdateError] = useState("");
    const [witnessInput, setWitnessInput] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);
    const logout = userLogout();

    // handling strange timezone issues
    const formatLocalDateTimeForInput = (value) => {
        if (!value) return "";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 16);
    };

    const displayName = userData?.firstName || userData?.name || "User";
    const initials = `${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase();

    
    // Fetch issue details
     
    useEffect(() => {
        const fetchIssue = async () => {
            try {
                // fetch issue by ID
                const query = userData?.firebaseUid
                    ? `?firebaseUid=${encodeURIComponent(userData.firebaseUid)}`
                    : "";
                const res = await fetch(`http://localhost:8000/api/issues/${issueId}${query}`);
                if (!res.ok) throw new Error("Failed to fetch issue");
                const data = await res.json();

                setIssue(data);   // Store fetched issue 
                setFormData({
                    ...data,
                    title: data.title || "",
                    issueDescription: data.issueDescription || "",
                    location: data.location || "",
                    campus: data.campus || "",
                    priority: data.priority || "Medium",
                    dateTimeIssueOccurred: formatLocalDateTimeForInput(data.dateTimeIssueOccurred),
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

        fetchIssue(); //Call method to fetch the issue by ID 
    }, [issueId, userData?.firebaseUid]);

    //update the form data state
    const handleUpdateClick = (e) => {
        const { name, value } = e.target;

        setUpdateError("");
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Update issue in backend/server
    const updateIssue = async () => {
        setUpdateError("");

        const title = (formData.title || "").trim();
        const description = (formData.issueDescription || "").trim();
        const issueLocation = (formData.location || "").trim();
        const validCampuses = [
            "Callaghan",
            "Ourimbah",
            "Newcastle City",
            "Gosford Hospital",
            "Gosford Mann Street",
            "Sydney",
            "Port Macquarie",
        ];

        // validation logic
        if (!title) {
            setUpdateError("Please enter an issue title.");
            return;
        }

        if (!description) {
            setUpdateError("Please enter an issue description.");
            return;
        }

        if (!issueLocation) {
            setUpdateError("Please enter a location.");
            return;
        }

        if (!formData.campus) {
            setUpdateError("Please select a campus.");
            return;
        }

        if (title.length < 5 || title.length > 50) {
            setUpdateError("Issue title must be between 5 and 50 characters.");
            return;
        }

        if (issueLocation.length < 3 || issueLocation.length > 100) {
            setUpdateError("Location must be between 3 and 100 characters.");
            return;
        }

        if (description.length < 10 || description.length > 300) {
            setUpdateError("Issue description must be between 10 and 300 characters.");
            return;
        }

        if (!validCampuses.includes(formData.campus)) {
            setUpdateError("Please select a valid campus.");
            return;
        }

        if ((formData.imageURLs?.length || 0) + images.length > 5) {
            setUpdateError("Maximum 5 images allowed.");
            return;
        }

        try {
            if (formData.dateTimeIssueOccurred && new Date(formData.dateTimeIssueOccurred).getTime() > Date.now()) {
                throw new Error("Incident date and time cannot be in the future.");
            }

            const body = new FormData();
            body.append("title", title);
            body.append("issueDescription", description);
            body.append("location", issueLocation);
            body.append("campus", formData.campus || "");
            body.append("dateTimeIssueOccurred", formData.dateTimeIssueOccurred || "");
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

            navigate(`/myissues`); //Navigate back to the user's issues page 
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

    // display info to the user about what the page is doing
    if (loading) return <p>Loading issue data...</p>;    // this will display whilst the data is being fetched 
    if (error) return <p>{error}</p>; // display error msg
    if (!issue) return <p>No issue found.</p>;

    return (
        <div className="user-dashboard edit-issue-shell">
            <aside className="user-dashboard-sidebar">
                <div className="user-dashboard-logo">
                    <img src={UONLogo} alt="The University of Newcastle Australia" />
                </div>

                <nav className="user-dashboard-nav">
                    {!userData?.isAdmin ? (
                        <>
                            <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/userdashboard")}>
                                <LayoutDashboard />
                                <span>Dashboard</span>
                            </button>
                            <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/reportissue")}>
                                <FilePlus2 />
                                <span>Report Issues</span>
                            </button>
                            <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/myissues")}>
                                <CircleAlert />
                                <span>My Issues</span>
                            </button>
                            <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/profile")}>
                                <UserRound />
                                <span>Profile</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/dashboard")}>
                                <LayoutDashboard />
                                <span>Dashboard</span>
                            </button>
                            <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/manageissues")}>
                                <Wrench />
                                <span>Manage Issues</span>
                            </button>
                            <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/usermanagement")}>
                                <Users />
                                <span>User Management</span>
                            </button>
                        </>
                    )}
                </nav>

                <div className="user-dashboard-logout-section">
                    <button type="button" className="user-dashboard-logout" onClick={logout}>
                        <LogOut />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="user-dashboard-main">
                <header className="user-dashboard-header">
                    <h1>Edit issue</h1>
                    <div className="user-dashboard-header-user">
                        <span>Welcome, {displayName}</span>
                        <div className="profile-avatar">
                            <span>{initials}</span>
                        </div>
                    </div>
                </header>

                <section className="edit-issue-content">
                    <div className="edit-issue-card">


                        {/* Display error message */}
                        {updateError && <p className="error-text">{updateError}</p>}

                        <form className="edit-form" noValidate onSubmit={(e) => {
                            e.preventDefault();
                            updateIssue();
                        }}>
                            <div className="edit-left-column">
                              <div className="form-section edit-details-section">
                                <div className="edit-section-title">Issue Details</div>
                                 <label htmlFor="issue-title">
                                    Title{" "}
                                    <span>
                                        *
                                    </span>
                                </label>
                                <input id="issue-title" name="title" value={formData?.title || ""} onChange={handleUpdateClick} minLength={5} maxLength={50} />

                                <label htmlFor="issue-description">
                                    Description{" "}
                                    <span>
                                        *
                                    </span>
                                </label>
                                <textarea
                                    id="issue-description"
                                    name="issueDescription"
                                    value={formData?.issueDescription || ""}
                                    onChange={handleUpdateClick}
                                    minLength={10}
                                    maxLength={300}
                                />
                                                            </div>

                                                            <div className="form-section edit-location-section">
                                <div className="edit-section-title">Location</div>
                                <label htmlFor="campus">
                                    Campus{" "}
                                    <span>
                                        *
                                    </span>
                                </label>
                                <select id="campus" name="campus" value={formData?.campus || ""} onChange={handleUpdateClick}>
                                    <option value="Callaghan">Callaghan</option>
                                    <option value="Ourimbah">Ourimbah</option>
                                    <option value="Newcastle City">Newcastle City</option>
                                    <option value="Gosford Hospital">Gosford Hospital</option>
                                    <option value="Gosford Mann Street">Gosford Mann Street</option>
                                    <option value="Sydney">Sydney</option>
                                    <option value="Port Macquarie">Port Macquarie</option>
                                </select>

                                <label htmlFor="location">
                                    Specific location{" "}
                                    <span>
                                        *
                                    </span>
                                </label>
                                <input id="location" name="location" value={formData?.location || ""} onChange={handleUpdateClick} minLength={3} maxLength={100} />

                                <label htmlFor="dateTimeIssueOccurred">
                                    Date and time incident occurred{" "}
                                    <span>
                                        *
                                    </span>
                                </label>
                                <input
                                    id="dateTimeIssueOccurred"
                                    name="dateTimeIssueOccurred"
                                    type="datetime-local"
                                    value={formData?.dateTimeIssueOccurred || ""}
                                    onChange={handleUpdateClick}
                                />
                              </div>

                              {userData?.isAdmin && (
                                  <div className="form-section edit-priority-section">
                                    <div className="edit-section-title">Priority</div>
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
                                                        </div>

                                                        <div className="edit-right-column">
                                                            <div className="form-section edit-witness-section">
                                <div className="edit-section-title">Witnesses</div>

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
                                                                            <div className="form-section edit-comments-section">
                                        <div className="edit-section-title">Progress or resolution comments</div>
                                        {issue.issueComments?.length > 0 && (
                                            <div className="issue-comments-list">
                                                {issue.issueComments.map((issueComment) => (
                                                    <div className="issue-comment" key={issueComment._id}>
                                                        <span>{issueComment.comment}</span>
                                                        <small>
                                                            {issueComment.commentedByName} · {new Date(issueComment.dateTimeCommented).toLocaleString("en-AU")}
                                                        </small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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


                                                            <div className="form-section edit-images-section">
                                <div className="edit-section-title">Issue images</div>

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
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    multiple
                                    className="edit-hidden-file"
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
                                        e.target.value = "";
                                    }}
                                />

                                <div
                                    className="edit-upload-zone"
                                    onClick={() => fileInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            fileInputRef.current?.click();
                                        }
                                    }}
                                >
                                    <CloudUpload className="edit-upload-icon" />
                                    <h3>Click to upload</h3>
                                    <p>Upload up to 5 images (JPG, PNG, GIF, WEBP)</p>
                                    <button
                                        type="button"
                                        className="edit-upload-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        Upload Image
                                    </button>
                                </div>
                                                            </div>
                                                        </div>

                            <div className="edit-actions-panel">
                                <button type="submit" className="btn primary-btn">
                                    Update Issue
                                </button>
                                <button
                                    type="button"
                                    className="btn secondary-btn"
                                    onClick={() => navigate(`/issue/${issueId}`)}
                                >
                                    Back to Issue Details
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}