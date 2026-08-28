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
        title: "",
        issueDescription: "",
        location: "",
        campus: "",
        witnessNames: []
    });

    const [updateError, setUpdateError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [witnessInput, setWitnessInput] = useState("");

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
                    witnessNames: data.witnessNames || [],
                    imageURLs: data.imageURLs || []
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

    const validateField = (name, value) => {
        switch (name) {
            case "title":
                if (!value?.trim()) return "Please enter an issue title.";
                if (value.trim().length < 5) return "Issue title must be at least 5 characters.";
                if (value.trim().length > 50) return "Issue title must be no more than 50 characters.";
                return "";

            case "issueDescription":
                if (!value?.trim()) return "Please enter a description.";
                if (value.trim().length < 10) return "Issue description must be at least 10 characters.";
                if (value.trim().length > 300) return "Issue description must be under 300 characters.";
                return "";

            case "location":
                if (!value?.trim()) return "Please enter a location.";
                if (value.trim().length < 3) return "Location must be at least 3 characters.";
                if (value.trim().length > 100) return "Location must be no more than 100 characters.";
                return "";

            case "campus":
                if (!value || value === "default") return "Please select a campus.";
                return "";

            default:
                return "";
        }
    };

    //update the form data state
    const handleUpdateClick = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        const error = validateField(name, value);
        setFieldErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const removeExistingImage = (imageURL) => {
        setFormData(prev => ({
            ...prev,
            imageURLs: (prev.imageURLs || []).filter(url => url !== imageURL)
        }));
    };

    /**
    * Update issue in backend/server
    */
    const updateIssue = async () => {
        try {
            setUpdateError("");

            if (!validateForm()) {
                return;
            }

            let finalImageURLs = [...(formData?.imageURLs || [])];

            if (images.length > 0) {
                const imageFormData = new FormData();

                images.forEach((image) => {
                    imageFormData.append("images", image.file);
                });

                const uploadResponse = await fetch("http://localhost:8000/api/upload", {
                    method: "POST",
                    body: imageFormData,
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadData.error || "Image upload failed.");
                }

                finalImageURLs = [...finalImageURLs, ...uploadData.imageURLs];
            }

            const res = await fetch(
                `http://localhost:8000/api/issues/${issueId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        issueDescription: formData.issueDescription,
                        location: formData.location,
                        campus: formData.campus,
                        witnessNames: formData.witnessNames,
                        imageURLs: finalImageURLs
                    })
                }
            );

            const updated = await res.json();

            if (!res.ok) {
                throw new Error(updated.error || "Failed to update issue.");
            }

            setIssue(updated);
            navigate("/myissues");

        } catch (err) {
            setUpdateError(err.message);
        }
    };

    const addWitness = () => {
        const name = witnessInput.trim();

        if (!name) return;

        if (name.length < 2) {
            setFieldErrors(prev => ({
                ...prev,
                witnessNames: "Witness name must be at least 2 characters."
            }));
            setUpdateError("Witness name must be at least 2 characters.");
            return;
        }

        if (name.length > 50) {
            setFieldErrors(prev => ({
                ...prev,
                witnessNames: "Witness name must be no more than 50 characters."
            }));
            setUpdateError("Witness name must be no more than 50 characters.");
            return;
        }

        if ((formData.witnessNames || []).includes(name)) {
            setFieldErrors(prev => ({
                ...prev,
                witnessNames: "This witness has already been added."
            }));
            setUpdateError("This witness has already been added.");
            return;
        }

        if ((formData.witnessNames || []).length >= 10) {
            setFieldErrors(prev => ({
                ...prev,
                witnessNames: "You can add a maximum of 10 witnesses."
            }));
            setUpdateError("You can add a maximum of 10 witnesses.");
            return;
        }

        setUpdateError("");
        setFieldErrors(prev => ({
            ...prev,
            witnessNames: ""
        }));
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
        setFieldErrors(prev => ({
            ...prev,
            witnessNames: ""
        }));
    };

    const validateForm = () => {
        const errors = {
            title: validateField("title", formData.title),
            issueDescription: validateField("issueDescription", formData.issueDescription),
            location: validateField("location", formData.location),
            campus: validateField("campus", formData.campus),
            witnessNames: (formData.witnessNames || []).length > 10 ? "You can add a maximum of 10 witnesses." : ""
        };

        setFieldErrors(errors);

        const hasErrors = Object.values(errors).some((message) => message);
        if (hasErrors) {
            setUpdateError("Please fix the highlighted fields.");
            return false;
        }

        setUpdateError("");
        return true;
    };

    //Display info to the user about what the page is doing
    if (loading) return <p>Loading issue data...</p>;    //This will display whilst the data is being fetched from the database
    if (error) return <p>{error}</p>; //If there is an error, display the error message
    if (!issue && !loading) return <p>No issue found.</p>;

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
                        <label>Issue Title</label>
                        <input
                            name="title"
                            type="text"
                            className={fieldErrors.title ? "field-error" : ""}
                            value={formData?.title || ""}
                            onChange={handleUpdateClick}
                            onBlur={(e) => setFieldErrors(prev => ({ ...prev, title: validateField("title", e.target.value) }))}
                            maxLength={50}
                            aria-invalid={Boolean(fieldErrors.title)}
                        />
                        {fieldErrors.title && <p className="error-text">{fieldErrors.title}</p>}
                    </div>

                    <div className="form-section">
                        <label>Description</label>
                        <input
                            name="issueDescription"
                            className={fieldErrors.issueDescription ? "field-error" : ""}
                            value={formData?.issueDescription || ""}
                            onChange={handleUpdateClick}
                            onBlur={(e) => setFieldErrors(prev => ({ ...prev, issueDescription: validateField("issueDescription", e.target.value) }))}
                            aria-invalid={Boolean(fieldErrors.issueDescription)}
                        />
                        {fieldErrors.issueDescription && <p className="error-text">{fieldErrors.issueDescription}</p>}
                    </div>

                    <div className="form-section">
                        <label>Location</label>
                        <input
                            name="location"
                            className={fieldErrors.location ? "field-error" : ""}
                            value={formData?.location || ""}
                            onChange={handleUpdateClick}
                            onBlur={(e) => setFieldErrors(prev => ({ ...prev, location: validateField("location", e.target.value) }))}
                            aria-invalid={Boolean(fieldErrors.location)}
                        />
                        {fieldErrors.location && <p className="error-text">{fieldErrors.location}</p>}
                    </div>

                    <div className="form-section">
                        <label>Campus</label>
                        <select
                            name="campus"
                            className={fieldErrors.campus ? "field-error" : ""}
                            value={formData?.campus || ""}
                            onChange={handleUpdateClick}
                            onBlur={(e) => setFieldErrors(prev => ({ ...prev, campus: validateField("campus", e.target.value) }))}
                            aria-invalid={Boolean(fieldErrors.campus)}
                        >
                            <option value="">Select a campus</option>
                            <option value="Callaghan">Callaghan</option>
                            <option value="Ourimbah">Ourimbah</option>
                            <option value="Newcastle City">Newcastle City</option>
                            <option value="Sydney">Sydney</option>
                            <option value="Port Macquarie">Port Macquarie</option>
                        </select>
                        {fieldErrors.campus && <p className="error-text">{fieldErrors.campus}</p>}
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
                                className={fieldErrors.witnessNames ? "field-error" : ""}
                                placeholder="Add witness name"
                                value={witnessInput}
                                onChange={(e) => {
                                    setWitnessInput(e.target.value);
                                    if (fieldErrors.witnessNames) {
                                        setFieldErrors(prev => ({ ...prev, witnessNames: "" }));
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addWitness();
                                    }
                                }}
                                aria-invalid={Boolean(fieldErrors.witnessNames)}
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
                        {fieldErrors.witnessNames && <p className="error-text">{fieldErrors.witnessNames}</p>}
                    </div>

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
                                        style={{
                                            position: "relative",
                                            display: "inline-block",
                                            margin: "5px"
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`Evidence ${index + 1}`}
                                            style={{
                                                width: "100px",
                                                height: "100px",
                                                objectFit: "cover"
                                            }}
                                        />

                                        <button
                                            type="button"
                                            className="image-remove-btn"
                                            onClick={() => removeExistingImage(url)}
                                        >
                                            ×
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
                                        >
                                            ×
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
                    <button type="button" className="btn secondary-btn" onClick={() => navigate("/myissues")}>
                        Back to my issues
                    </button>
                    <button type="button" className="btn secondary-btn" onClick={logout}>
                        Logout
                    </button>
                </form>
            </div>
        </div>
    );
}