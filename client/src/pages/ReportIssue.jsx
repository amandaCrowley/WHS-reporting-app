/**
 * ReportIssue.jsx
 *
 * This page is used to submit a user's issues/hazards they have encountered
 * on UoN campuses.
 *
 * Existing validation, API submission, drafts, witnesses and image upload
 * behaviour remain unchanged.
 *
 * Author/s:Grish Gautam
 * Date: 01/09/26
 */

import "./UserDashboard.css";
import "./ReportIssue.css";

import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";

import UONLogo from "../images/UONLogo White.png";

import {
  LayoutDashboard,
  FilePlus2,
  CircleAlert,
  UserRound,
  LogOut,
  ChevronDown,
  CloudUpload,
  X,
  FileText,
} from "lucide-react";

export default function ReportIssue() {
  const navigate = useNavigate();
  const logout = userLogout();
  const { userData } = getUserData();
  const fileInputRef = useRef(null);

  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [issueTitle, setIssueTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [location, setLocation] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState(null);
  const [incidentDateTime, setIncidentDateTime] = useState("");

  const [witnessInput, setWitnessInput] = useState("");
  const [witnessList, setWitnessList] = useState([]);

  const [images, setImages] = useState([]);

  const [drafts, setDrafts] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [editingDraftId, setEditingDraftId] = useState(null);

  const displayName =
    userData?.firstName ||
    userData?.name ||
    "User";

  const draftStorageKey = `reportIssueDrafts_${userData?.firebaseUid || "guest"
    }`;

  useEffect(() => {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(draftStorageKey),
        ) || [];

      setDrafts(saved);
    } catch {
      setDrafts([]);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  const submitIssue = async (e) => {
    e.preventDefault();

    setFormError("");
    setFormLoading(true);

    if (
      !issueTitle.trim() ||
      !location.trim() ||
      !issueDescription.trim() ||
      !incidentDateTime
    ) {
      setFormError(
        "Please fill in all required fields.",
      );
      setFormLoading(false);
      return;
    }

    if (new Date(incidentDateTime).getTime() > Date.now()) {
      setFormError(
        "Incident date and time cannot be in the future.",
      );
      setFormLoading(false);
      return;
    }

    if (
      campus === "default" ||
      campus === ""
    ) {
      setFormError(
        "Please select a campus.",
      );
      setFormLoading(false);
      return;
    }

    if (!userData?.firebaseUid) {
      setFormError(
        "User not loaded. Please try again.",
      );
      setFormLoading(false);
      return;
    }

    if (issueTitle.trim().length < 5) {
      setFormError(
        "Issue title must be at least 5 characters.",
      );
      setFormLoading(false);
      return;
    }

    if (issueTitle.trim().length > 50) {
      setFormError(
        "Issue title must be no more than 50 characters.",
      );
      setFormLoading(false);
      return;
    }

    if (location.trim().length < 3) {
      setFormError(
        "Location must be at least 3 characters.",
      );
      setFormLoading(false);
      return;
    }

    if (location.trim().length > 100) {
      setFormError(
        "Location must be no more than 100 characters.",
      );
      setFormLoading(false);
      return;
    }

    if (
      issueDescription.trim().length < 10
    ) {
      setFormError(
        "Issue description must be at least 10 characters.",
      );
      setFormLoading(false);
      return;
    }

    if (
      issueDescription.trim().length > 300
    ) {
      setFormError(
        "Issue description must be under 300 characters.",
      );
      setFormLoading(false);
      return;
    }

    try {
      let imageURLs = [];

      if (images.length > 0) {
        const imageFormData =
          new FormData();

        images.forEach((image) => {
          imageFormData.append(
            "images",
            image.file,
          );
        });

        const uploadResponse =
          await fetch(
            "http://localhost:8000/api/upload",
            {
              method: "POST",
              body: imageFormData,
            },
          );

        const uploadData =
          await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.error ||
            "Image upload failed.",
          );
        }

        imageURLs =
          uploadData.imageURLs;
      }

      const response = await fetch(
        `http://localhost:8000/api/issue/${userData.firebaseUid}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: issueTitle.trim(),
            campus,
            location: location.trim(),
            issueDescription:
              issueDescription.trim(),
            witnessNames: witnessList,
            dateTimeIssueOccurred:
              incidentDateTime,
            imageURLs,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Failed to submit issue.",
        );
      }

      if (editingDraftId) {
        setDrafts((prev) => {
          const updated = prev.filter(
            (d) => d.id !== editingDraftId,
          );

          localStorage.setItem(
            draftStorageKey,
            JSON.stringify(updated),
          );

          return updated;
        });

        setEditingDraftId(null);
      }

      navigate("/myissues");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const saveDraft = () => {
    setFormError("");

    if (
      !issueTitle.trim() &&
      !location.trim() &&
      !issueDescription.trim()
    ) {
      setFormError(
        "Nothing to save — fill in at least one field first.",
      );
      return;
    }

    const draftData = {
      id:
        editingDraftId ||
        Date.now(),
      issueTitle,
      campus,
      location,
      issueDescription,
      incidentDateTime,
      witnessList,
      savedAt:
        new Date().toISOString(),
    };

    setDrafts((prev) => {
      const withoutOld =
        prev.filter(
          (d) =>
            d.id !==
            draftData.id,
        );

      const updated = [
        draftData,
        ...withoutOld,
      ];

      localStorage.setItem(
        draftStorageKey,
        JSON.stringify(updated),
      );

      return updated;
    });

    setEditingDraftId(
      draftData.id,
    );

    setDraftMessage(
      "Draft saved.",
    );

    setTimeout(() => {
      setDraftMessage("");
    }, 2500);
  };

  const loadDraft = (draft) => {
    setIssueTitle(
      draft.issueTitle || "",
    );

    setCampus(
      draft.campus || "",
    );

    setLocation(
      draft.location || "",
    );

    setIssueDescription(
      draft.issueDescription || "",
    );

    setIncidentDateTime(
      draft.incidentDateTime || "",
    );

    setWitnessList(
      draft.witnessList || [],
    );

    setEditingDraftId(
      draft.id,
    );

    setFormError("");

    setDraftMessage(
      "Draft loaded — continue editing above.",
    );

    setTimeout(() => {
      setDraftMessage("");
    }, 2500);
  };

  const deleteDraft = (id) => {
    const draft = drafts.find(
      (item) => item.id === id,
    );

    if (!draft) {
      return;
    }

    setPendingDeleteDraft(draft);
  };

  const confirmDeleteDraft = () => {
    if (!pendingDeleteDraft) {
      return;
    }

    const id = pendingDeleteDraft.id;

    setDrafts((prev) => {
      const updated =
        prev.filter(
          (d) => d.id !== id,
        );

      localStorage.setItem(
        draftStorageKey,
        JSON.stringify(updated),
      );

      return updated;
    });

    if (
      editingDraftId === id
    ) {
      setEditingDraftId(null);
    }

    setPendingDeleteDraft(null);
  };

  const addWitness = () => {
    const witnessName =
      witnessInput.trim();

    if (!witnessName) {
      return;
    }

    if (
      witnessName.length < 2
    ) {
      setFormError(
        "Witness name must be at least 2 characters.",
      );
      return;
    }

    if (
      witnessName.length > 50
    ) {
      setFormError(
        "Witness name must be no more than 50 characters.",
      );
      return;
    }

    if (
      witnessList.includes(
        witnessName,
      )
    ) {
      setFormError(
        "This witness has already been added.",
      );
      return;
    }

    if (
      witnessList.length >= 10
    ) {
      setFormError(
        "You can add a maximum of 10 witnesses.",
      );
      return;
    }

    setFormError("");

    setWitnessList([
      ...witnessList,
      witnessName,
    ]);

    setWitnessInput("");
  };

  const removeWitness = (
    index,
  ) => {
    const updated =
      witnessList.filter(
        (_, i) => i !== index,
      );

    setWitnessList(updated);
  };

  const handleImageChange = (
    e,
  ) => {
    const selectedFiles =
      Array.from(
        e.target.files || [],
      );

    if (
      selectedFiles.length === 0
    ) {
      return;
    }

    const MAX_SIZE =
      5 * 1024 * 1024;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (
      images.length +
      selectedFiles.length >
      5
    ) {
      setFormError(
        "Maximum 5 images allowed.",
      );
      return;
    }

    for (const file of selectedFiles) {
      if (
        file.size > MAX_SIZE
      ) {
        setFormError(
          `${file.name} exceeds 5MB.`,
        );
        return;
      }

      if (
        !validTypes.includes(
          file.type,
        )
      ) {
        setFormError(
          "Only JPG, PNG, GIF and WEBP images are allowed.",
        );
        return;
      }

      const duplicate =
        images.some(
          (img) =>
            img.file.name ===
            file.name &&
            img.file.size ===
            file.size,
        );

      if (duplicate) {
        setFormError(
          `${file.name} has already been added.`,
        );
        return;
      }
    }

    const newImages =
      selectedFiles.map(
        (file) => ({
          file,
          preview:
            URL.createObjectURL(
              file,
            ),
        }),
      );

    setImages((prev) => [
      ...prev,
      ...newImages,
    ]);

    setFormError("");

    e.target.value = "";
  };

  const removeImage = (
    index,
  ) => {
    setImages((prev) => {
      const updated = [
        ...prev,
      ];

      URL.revokeObjectURL(
        updated[index].preview,
      );

      updated.splice(
        index,
        1,
      );

      return updated;
    });
  };

  const handleUploadClick =
    () => {
      fileInputRef.current?.click();
    };

  // Build initials for avatar
  const initials = `${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="report-issue-page">
      {/* =========================
          SHARED STUDENT SIDEBAR
      ========================== */}

      <aside className="user-dashboard-sidebar">
        <div className="user-dashboard-logo">
          <img
            src={UONLogo}
            alt="The University of Newcastle Australia"
          />
        </div>

        <nav className="user-dashboard-nav">
          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() =>
              navigate(
                "/userdashboard",
              )
            }
          >
            <LayoutDashboard />
            <span>
              Dashboard
            </span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item active"
          >
            <FilePlus2 />
            <span>
              Report Issues
            </span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() =>
              navigate(
                "/myissues",
              )
            }
          >
            <CircleAlert />
            <span>
              My Issues
            </span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() =>
              navigate(
                "/profile",
              )
            }
          >
            <UserRound />
            <span>
              Profile
            </span>
          </button>
        </nav>

        <div className="user-dashboard-logout-section">
          <button
            type="button"
            className="user-dashboard-logout"
            onClick={logout}
          >
            <LogOut />
            <span>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN
      ========================== */}

      <main className="report-issue-main">
        <header className="report-issue-topbar">
          <h1>
            Report an issue
          </h1>

          <div className="report-issue-user">
            <span>
              Welcome {" "}
              {displayName}
            </span>

            <div className="profile-avatar">
              <span>{initials}</span>
            </div>
          </div>
        </header>

        <section className="report-issue-content">
          <form
            className="report-issue-form"
            onSubmit={
              submitIssue
            }
          >
            <div className="report-issue-grid">
              {/* =========================
                  LEFT COLUMN
              ========================== */}

              <div className="report-issue-left">
                {/* ISSUE DETAILS */}

                <section className="report-section-card">
                  <div className="report-section-title">
                    Issue Details
                  </div>

                  <div className="report-section-body">
                    <div className="report-field">
                      <label htmlFor="issue-title">
                        Issue Title{" "}
                        <span>
                          *
                        </span>
                      </label>

                      <input
                        id="issue-title"
                        type="text"
                          minLength={5}
                          maxLength={50}
                          required
                        placeholder="Enter a short description of the issue"
                        value={
                          issueTitle
                        }
                        onChange={(
                          e,
                        ) =>
                          setIssueTitle(
                            e
                              .target
                              .value,
                          )
                        }
                      />
                    </div>

                    <div className="report-field">
                      <label htmlFor="issue-description">
                        Description{" "}
                        <span>
                          *
                        </span>
                      </label>

                      <div className="report-textarea-wrap">
                        <textarea
                          id="issue-description"
                          minLength={10}
                          maxLength={300}
                          required
                          placeholder="Describe the issue in detail (minimum 10 characters)"
                          value={
                            issueDescription
                          }
                          onChange={(
                            e,
                          ) =>
                            setIssueDescription(
                              e
                                .target
                                .value,
                            )
                          }
                        />

                        <span className="report-char-count">
                          {
                            issueDescription.length
                          }
                          /300
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* LOCATION */}

                <section className="report-section-card">
                  <div className="report-section-title">
                    Location
                  </div>

                  <div className="report-section-body">
                    <div className="report-field">
                      <label htmlFor="campus">
                        Campus{" "}
                        <span>
                          *
                        </span>
                      </label>

                      <div className="report-select-wrap">
                        <select
                          id="campus"
                          required
                          value={
                            campus
                          }
                          onChange={(
                            e,
                          ) =>
                            setCampus(
                              e
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            Select
                            campus
                          </option>

                          <option value="Callaghan">
                            Callaghan
                          </option>

                          <option value="Newcastle City">
                            Newcastle
                            City
                          </option>

                          <option value="Ourimbah">
                            Ourimbah
                          </option>

                          <option value="Gosford Hospital">
                            Gosford
                            Hospital
                          </option>

                          <option value="Gosford Mann Street">
                            Gosford
                            Mann
                            Street
                          </option>

                          <option value="Sydney">
                            Sydney
                          </option>

                          <option value="Port Macquarie">
                            Port
                            Macquarie
                          </option>
                        </select>

                        <ChevronDown />
                      </div>
                    </div>

                    <div className="report-field">
                      <label htmlFor="specific-location">
                        Specific
                        Location{" "}
                        <span>
                          *
                        </span>
                      </label>

                      <input
                        id="specific-location"
                        type="text"
                        minLength={3}
                        maxLength={100}
                        required
                        placeholder="Enter location (e.g. Building A, Room 101)"
                        value={
                          location
                        }
                        onChange={(
                          e,
                        ) =>
                          setLocation(
                            e
                              .target
                              .value,
                          )
                        }
                      />
                    </div>

                    <div className="report-field">
                      <label htmlFor="incident-date-time">
                        Date and time incident occurred{" "}
                        <span>
                          *
                        </span>
                      </label>

                      <input
                        id="incident-date-time"
                        type="datetime-local"
                        value={incidentDateTime}
                        onChange={(e) => setIncidentDateTime(e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* =========================
                  RIGHT COLUMN
              ========================== */}

              <div className="report-issue-right">
                {/* UPLOAD */}

                <section className="report-section-card">
                  <div className="report-section-title">
                    Upload Evidence
                  </div>

                  <div className="report-section-body report-upload-body">
                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={
                        handleImageChange
                      }
                      className="report-hidden-file"
                    />

                    <div
                      className="report-upload-zone"
                      onClick={
                        handleUploadClick
                      }
                    >
                      <CloudUpload className="report-upload-icon" />

                      <h3>
                        Click to
                        upload
                      </h3>

                      <p>
                        Upload up to
                        5 images
                        (JPG, PNG,
                        GIF, WEBP)
                      </p>

                      <button
                        type="button"
                        className="report-upload-button"
                        onClick={(
                          e,
                        ) => {
                          e.stopPropagation();
                          handleUploadClick();
                        }}
                      >
                        Upload
                        Image
                      </button>
                    </div>

                    {images.length >
                      0 && (
                        <div className="report-image-grid">
                          {images.map(
                            (
                              image,
                              index,
                            ) => (
                              <div
                                className="report-image-preview"
                                key={
                                  index
                                }
                              >
                                <img
                                  src={
                                    image.preview
                                  }
                                  alt={`Evidence ${index +
                                    1
                                    }`}
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeImage(
                                      index,
                                    )
                                  }
                                  aria-label="Remove image"
                                >
                                  <X />
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                </section>

                {/* WITNESSES */}

                <section className="report-section-card report-witness-card">
                  <div className="report-section-title">
                    Witnesses
                  </div>

                  <div className="report-section-body">
                    <label className="report-witness-label">
                      Add Witness
                      Name
                    </label>

                    <div className="report-witness-row">
                      <input
                        type="text"
                        placeholder="Add witness names (Press Enter to add)"
                        value={
                          witnessInput
                        }
                        onChange={(
                          e,
                        ) =>
                          setWitnessInput(
                            e
                              .target
                              .value,
                          )
                        }
                        onKeyDown={(
                          e,
                        ) => {
                          if (
                            e.key ===
                            "Enter"
                          ) {
                            e.preventDefault();
                            addWitness();
                          }
                        }}
                      />

                      <button
                        type="button"
                        className="report-add-witness"
                        onClick={
                          addWitness
                        }
                      >
                        Add
                      </button>
                    </div>

                    {witnessList.length >
                      0 && (
                        <div className="report-witness-pills">
                          {witnessList.map(
                            (
                              name,
                              index,
                            ) => (
                              <div
                                className="report-witness-pill"
                                key={
                                  index
                                }
                              >
                                <span>
                                  {
                                    name
                                  }
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeWitness(
                                      index,
                                    )
                                  }
                                  aria-label={`Remove ${name}`}
                                >
                                  <X />
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                </section>

                {/* SAVED DRAFTS */}

                {drafts.length >
                  0 && (
                    <section className="report-section-card report-drafts-card">
                      <div className="report-section-title">
                        Saved Drafts (
                        {
                          drafts.length
                        }
                        )
                      </div>

                      <div className="report-draft-list">
                        {drafts.map(
                          (
                            draft,
                          ) => (
                            <div
                              className="report-draft-item"
                              key={
                                draft.id
                              }
                            >
                              <div className="report-draft-icon">
                                <FileText />
                              </div>

                              <div className="report-draft-info">
                                <strong>
                                  {draft.issueTitle?.trim() ||
                                    "(No title)"}
                                </strong>

                                <span>
                                  {draft.campus ||
                                    "No campus"}{" "}
                                  ·{" "}
                                  {new Date(
                                    draft.savedAt,
                                  ).toLocaleString()}
                                </span>
                              </div>

                              <div className="report-draft-actions">
                                <button
                                  type="button"
                                  className="report-continue-button"
                                  onClick={() =>
                                    loadDraft(
                                      draft,
                                    )
                                  }
                                >
                                  Continue
                                  Editing
                                </button>

                                <button
                                  type="button"
                                  className="report-delete-button"
                                  onClick={() =>
                                    deleteDraft(
                                      draft.id,
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  )}
              </div>
            </div>

            {/* =========================
                FEEDBACK
            ========================== */}

            {formError && (
              <div className="report-error">
                {
                  formError
                }
              </div>
            )}

            {draftMessage && (
              <div className="report-success">
                {
                  draftMessage
                }
              </div>
            )}

            {/* =========================
                ACTION BUTTONS
            ========================== */}

            <div className="report-actions-panel">
              <button
                type="submit"
                className="report-submit-button"
                disabled={
                  formLoading
                }
              >
                {formLoading
                  ? "Submitting..."
                  : "Submit Issue"}
              </button>

              <button
                type="button"
                className="report-save-button"
                onClick={
                  saveDraft
                }
              >
                Save as
                Draft
              </button>
            </div>
          </form>
        </section>
      </main>
      {pendingDeleteDraft && (
        <div
          className="admin-confirmation-backdrop"
          role="presentation"
        >
          <div
            className="admin-confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-draft-title"
          >
            <p className="admin-confirmation-eyebrow">
              Confirm draft deletion
            </p>

            <h2 id="delete-draft-title">
              Delete this draft?
            </h2>

            <p>
              You are about to permanently delete this
              saved draft. This change cannot be undone.
            </p>

            <div className="admin-confirmation-actions">
              <button
                type="button"
                onClick={() =>
                  setPendingDeleteDraft(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-confirmation-confirm"
                onClick={confirmDeleteDraft}
              >
                Delete draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}