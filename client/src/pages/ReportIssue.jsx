/**
 * ReportIssue.jsx
 *
 * This page is used to submit a user's issues/hazards they have encountered on UoN campuses
 * It contains a form to submit new issues (description, location, images etc)
 *
 * Author/s: Amanda Foxley / Grish Gautam
 * Date: 8/4/26
 */

import "../styles/ReportIssue.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";

export default function ReportIssue() {
  const navigate = useNavigate();
  const logout = userLogout();
  const { userData } = getUserData();
  const fileInputRef = useRef(null);

  // Local states to be used for report form
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [issueTitle, setIssueTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [location, setLocation] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const [witnessInput, setWitnessInput] = useState("");
  const [witnessList, setWitnessList] = useState([]);

  const [images, setImages] = useState([]);

  // Drafts saved locally so the user can come back and finish the report later
  const [drafts, setDrafts] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [editingDraftId, setEditingDraftId] = useState(null);

  const displayName = userData?.firstName || userData?.name || "User";

  // Each user gets their own draft list in localStorage
  const draftStorageKey = `reportIssueDrafts_${userData?.firebaseUid || "guest"}`;

  // Load any previously saved drafts for this user when the page loads
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftStorageKey)) || [];
      setDrafts(saved);
    } catch {
      setDrafts([]);
    }
  }, [draftStorageKey]);

  // Small method to remove object URLs created for image previews when the component is unloaded or when the image's state changes, preventing memory leaks
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  // Method to handle form submission, including validation and sending data to the backend server
  const submitIssue = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    if (!issueTitle.trim() || !location.trim() || !issueDescription.trim()) {
      setFormError("Please fill in all required fields.");
      setFormLoading(false);
      return;
    }

    if (campus === "default" || campus === "") {
      setFormError("Please select a campus.");
      setFormLoading(false);
      return;
    }

    if (!userData?.firebaseUid) {
      setFormError("User not loaded. Please try again.");
      setFormLoading(false);
      return;
    }

    if (issueTitle.trim().length < 5) {
      setFormError("Issue title must be at least 5 characters.");
      setFormLoading(false);
      return;
    }

    if (issueTitle.trim().length > 50) {
      setFormError("Issue title must be no more than 50 characters.");
      setFormLoading(false);
      return;
    }

    if (location.trim().length < 3) {
      setFormError("Location must be at least 3 characters.");
      setFormLoading(false);
      return;
    }

    if (location.trim().length > 100) {
      setFormError("Location must be no more than 100 characters.");
      setFormLoading(false);
      return;
    }

    if (issueDescription.trim().length < 10) {
      setFormError("Issue description must be at least 10 characters.");
      setFormLoading(false);
      return;
    }

    if (issueDescription.trim().length > 300) {
      setFormError("Issue description must be under 300 characters.");
      setFormLoading(false);
      return;
    }

    // If all validation passes, send the data to the backend
    try {
      let imageURLs = [];

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

        imageURLs = uploadData.imageURLs;
      }

      const response = await fetch(
        `http://localhost:8000/api/issue/${userData.firebaseUid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: issueTitle.trim(),
            campus,
            location: location.trim(),
            issueDescription: issueDescription.trim(),
            witnessNames: witnessList,
            dateTimeIssueOccurred: new Date().toISOString(),
            imageURLs,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit issue.");
      }

      if (editingDraftId) {
        deleteDraft(editingDraftId);
      }

      navigate("/myissues");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Save the current form values as a draft in localStorage (images are not saved,
  // since File objects can't be stored in localStorage — only the preview data would fit
  // and that's not worth persisting across reloads)
  const saveDraft = () => {
    setFormError("");

    if (!issueTitle.trim() && !location.trim() && !issueDescription.trim()) {
      setFormError("Nothing to save — fill in at least one field first.");
      return;
    }

    const draftData = {
      id: editingDraftId || Date.now(),
      issueTitle,
      campus,
      location,
      issueDescription,
      witnessList,
      savedAt: new Date().toISOString(),
    };

    setDrafts((prev) => {
      const withoutOld = prev.filter((d) => d.id !== draftData.id);
      const updated = [draftData, ...withoutOld];
      localStorage.setItem(draftStorageKey, JSON.stringify(updated));
      return updated;
    });

    setEditingDraftId(draftData.id);
    setDraftMessage("Draft saved.");
    setTimeout(() => setDraftMessage(""), 2500);
  };

  // Load a saved draft back into the form so the user can keep editing it
  const loadDraft = (draft) => {
    setIssueTitle(draft.issueTitle || "");
    setCampus(draft.campus || "");
    setLocation(draft.location || "");
    setIssueDescription(draft.issueDescription || "");
    setWitnessList(draft.witnessList || []);
    setEditingDraftId(draft.id);
    setFormError("");
    setDraftMessage("Draft loaded — continue editing below.");
    setTimeout(() => setDraftMessage(""), 2500);
  };

  // Remove a draft from localStorage and from the list on screen
  const deleteDraft = (id) => {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;

    setDrafts((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      localStorage.setItem(draftStorageKey, JSON.stringify(updated));
      return updated;
    });

    if (editingDraftId === id) {
      setEditingDraftId(null);
    }
  };

  const addWitness = () => {
    const witnessName = witnessInput.trim();

    if (!witnessName) return;

    if (witnessName.length < 2) {
      setFormError("Witness name must be at least 2 characters.");
      return;
    }

    if (witnessName.length > 50) {
      setFormError("Witness name must be no more than 50 characters.");
      return;
    }

    if (witnessList.includes(witnessName)) {
      setFormError("This witness has already been added.");
      return;
    }

    if (witnessList.length >= 10) {
      setFormError("You can add a maximum of 10 witnesses.");
      return;
    }

    setFormError("");
    setWitnessList([...witnessList, witnessName]);
    setWitnessInput("");
  };

  const removeWitness = (index) => {
    const updated = witnessList.filter((_, i) => i !== index);
    setWitnessList(updated);
  };

  //Method to handle image selection and previews before submission + validation
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    // Maximum 5 images
    if (images.length + selectedFiles.length > 5) {
      setFormError("Maximum 5 images allowed.");
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > MAX_SIZE) {
        setFormError(`${file.name} exceeds 5MB.`);
        return;
      }

      if (!validTypes.includes(file.type)) {
        setFormError("Only JPG, PNG, GIF and WEBP images are allowed.");
        return;
      }

      const duplicate = images.some(
        (img) => img.file.name === file.name && img.file.size === file.size,
      );

      if (duplicate) {
        setFormError(`${file.name} has already been added.`);
        return;
      }
    }

    const newImages = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    setFormError("");
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="report-layout">
      <aside className="report-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">📊</div>
          <h2>Dashboard</h2>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className="sidebar-item"
            onClick={() => navigate("/userdashboard")}
          >
            <span className="sidebar-icon">🏠</span>
            <span>Home</span>
          </button>

          <button type="button" className="sidebar-item active">
            <span className="sidebar-icon">📄</span>
            <span>Report Issues</span>
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={() => navigate("/myissues")}
          >
            <span className="sidebar-icon">‼️</span>
            <span>My Issues</span>
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={() => navigate("/profile")}
          >
            <span className="sidebar-icon">👤</span>
            <span>Profile</span>
          </button>

          <button type="button" className="sidebar-item" onClick={logout}>
            <span className="sidebar-icon">↪</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="report-main">
        <header className="report-header">
          <div>
            <h1>Report Issue</h1>
            <p>Submit details about a safety or maintenance issue.</p>
          </div>

          <div className="report-userbox">
            <span className="report-userbox-text">Welcome, {displayName}!</span>

            <div className="report-avatar-wrap">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4140/4140047.png"
                alt="User avatar"
                className="report-avatar"
              />
            </div>
          </div>
        </header>

        <form className="report-panel" onSubmit={submitIssue}>
          <div className="report-grid">
            <div className="report-left-column">
              <section className="report-card">
                <div className="report-card-header">Issue Details</div>
                <div className="report-card-body">
                  <label className="field-label">Issue Title</label>
                  <input
                    type="text"
                    placeholder="Enter a short description of the issue"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                  />

                  <br />
                  <br />
                  <label className="field-label">Description</label>
                  <textarea
                    placeholder="Describe the issue in detail"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                  />
                </div>
              </section>

              <section className="report-card">
                <div className="report-card-header">Location</div>
                <div className="report-card-body">
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                  >
                    <option value="">Select campus</option>
                    <option value="Callaghan">Callaghan</option>
                    <option value="Newcastle City">Newcastle City</option>
                    <option value="Ourimbah">Ourimbah</option>
                    <option value="Gosford Hospital">Gosford Hospital</option>
                    <option value="Gosford Mann Street">
                      Gosford Mann Street
                    </option>
                    <option value="Sydney">Sydney</option>
                    <option value="Port Macquarie">Port Macquarie</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Enter location (e.g. Building A, Room 101)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </section>

              <section className="report-card">
                <div className="report-card-header">Witnesses</div>
                <div className="report-card-body">
                  {witnessList.length > 0 && (
                    <div className="witness-pill-container">
                      {witnessList.map((name, index) => (
                        <div className="witness-pill" key={index}>
                          <span>{name}</span>
                          <button
                            type="button"
                            className="pill-remove"
                            onClick={() => removeWitness(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="witness-input-row">
                    <input
                      type="text"
                      placeholder="Add witness names (Press Enter to add)"
                      value={witnessInput}
                      onChange={(e) => setWitnessInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addWitness();
                        }
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="report-right-column">
              <section className="report-card report-upload-card">
                <div className="report-card-header">Upload Evidence</div>
                <div className="report-card-body">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden-file-input"
                  />

                  <div className="upload-dropzone" onClick={handleUploadClick}>
                    <div className="upload-icon">☁</div>
                    <p>Drag &amp; drop or tap to upload</p>
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadClick();
                      }}
                    >
                      Upload Image
                    </button>
                  </div>

                  {images.length > 0 && (
                    <div className="image-preview-row">
                      {images.map((image, index) => (
                        <div className="image-preview-card" key={index}>
                          <img
                            src={image.preview}
                            alt={`Evidence ${index + 1}`}
                          />
                          <button
                            type="button"
                            className="image-remove-btn"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {formError && <div className="form-error">{formError}</div>}
          {draftMessage && <div className="draft-message">{draftMessage}</div>}

          <div className="report-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={formLoading}
            >
              {formLoading ? "Submitting..." : "Submit Issue"}
            </button>

            <button type="button" className="secondary-btn" onClick={saveDraft}>
              Save as Draft
            </button>
          </div>

          {drafts.length > 0 && (
            <section className="report-card draft-list-card">
              <div className="report-card-header">
                Saved Drafts ({drafts.length})
              </div>
              <div className="report-card-body">
                <div className="draft-list">
                  {drafts.map((draft) => (
                    <div className="draft-item" key={draft.id}>
                      <div className="draft-item-info">
                        <span className="draft-item-title">
                          {draft.issueTitle?.trim() || "(No title)"}
                        </span>
                        <span className="draft-item-meta">
                          {draft.campus || "No campus"} ·{" "}
                          {new Date(draft.savedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="draft-item-actions">
                        <button
                          type="button"
                          className="secondary-btn draft-btn"
                          onClick={() => loadDraft(draft)}
                        >
                          Continue Editing
                        </button>
                        <button
                          type="button"
                          className="secondary-btn draft-btn"
                          onClick={() => deleteDraft(draft.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </form>
      </main>
    </div>
  );
}
