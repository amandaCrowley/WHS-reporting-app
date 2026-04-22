/**
 * ReportIssue.jsx
 * 
 * This page is used to submit a user's issues/hazards they have encountered on UoN campuses
 * It contains a form to submit new issues (description, location, images etc)
 * 
 * Author/s: Amanda Foxley / Grish Gautam
 * Date: 8/4/26
 */

import "./ReportIssue.css";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
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

  const displayName = userData?.firstName || userData?.name || "User";

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

    if (!userData?._id) {
      setFormError("User not loaded. Please try again.");
      setFormLoading(false);
      return;
    }

    if (issueTitle.trim().length < 3) {
      setFormError("Issue title must be at least 3 characters.");
      setFormLoading(false);
      return;
    }

    if (location.trim().length < 3) {
      setFormError("Location must be at least 3 characters.");
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

    try {
      const response = await fetch(`http://localhost:8000/api/issue/${userData._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueTitle: issueTitle.trim(),
          campus,
          location: location.trim(),
          issueDescription: issueDescription.trim(),
          witnessNames: witnessList,
          imageNames: images.map((image) => image.file.name),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit issue.");
      }

      navigate("/myissues");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const addWitness = () => {
    const witnessName = witnessInput.trim();

    if (!witnessName) return;

    if (witnessList.includes(witnessName)) {
      setFormError("This witness has already been added.");
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

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

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
          <button type="button" className="sidebar-item" onClick={() => navigate("/userdashboard")}>
            <span className="sidebar-icon">🏠</span>
            <span>Home</span>
          </button>

          <button type="button" className="sidebar-item active">
            <span className="sidebar-icon">📄</span>
            <span>Report Issues</span>
          </button>

          <button type="button" className="sidebar-item" onClick={() => navigate("/myissues")}>
            <span className="sidebar-icon">‼️</span>
            <span>My Issues</span>
          </button>

          <button type="button" className="sidebar-item" onClick={() => navigate("/profile")}>
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
                    placeholder="Enter issue title..."
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                  />

                  <label className="field-label">Description</label>
                  <textarea
                    placeholder="Describe the issue..."
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
                    <option value="">Select campus...</option>
                    <option value="Callaghan">Callaghan</option>
                    <option value="Newcastle City">Newcastle City</option>
                    <option value="Ourimbah">Ourimbah</option>
                    <option value="Gosford Hospital">Gosford Hospital</option>
                    <option value="Gosford Mann Street">Gosford Mann Street</option>
                    <option value="Sydney">Sydney</option>
                    <option value="Port Macquarie">Port Macquarie</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Enter the location..."
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
                      placeholder="Add witness name..."
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
                          <img src={image.preview} alt={`Evidence ${index + 1}`} />
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

          <div className="report-actions">
            <button type="submit" className="primary-btn" disabled={formLoading}>
              {formLoading ? "Submitting..." : "Submit Issue"}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/userdashboard")}
            >
              Cancel
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => console.log("Save as draft clicked")}
            >
              Save as Draft
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
