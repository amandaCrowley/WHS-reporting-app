/**
 * IssueDetails.jsx
 *
 * This page displays all of the details of a single issue, including:
 *  - Description, status, location, campus, reported data and time, witnesses, staff assignment and any images attached to the issue
 * Admin users can also assign the issue to themselves, unassign the issue, and update the status of the issue.
 *
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  CircleAlert,
  UserRound,
  LogOut,
  Wrench,
  Users,
  Copy,
  Check,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";
import NotificationBell from "../components/NotificationBell";
import UONLogo from "../images/UONLogo White.png";
import "../pages/UserDashboard.css";
import "../styles/IssueDetails.css";

function Sidebar({ userData, navigate, logout }) {
  return (
    <aside className="user-dashboard-sidebar">
      <div className="user-dashboard-logo">
        <img
          src={UONLogo}
          alt="The University of Newcastle Australia"
        />
      </div>

      <nav className="user-dashboard-nav">
        {!userData?.isAdmin && (
          <>
            <button
              type="button"
              className="user-dashboard-nav-item"
              onClick={() => navigate("/userdashboard")}
            >
              <LayoutDashboard />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className="user-dashboard-nav-item"
              onClick={() => navigate("/reportissue")}
            >
              <FilePlus2 />
              <span>Report Issues</span>
            </button>
            <button
              type="button"
              className="user-dashboard-nav-item"
              onClick={() => navigate("/myissues")}
            >
              <CircleAlert />
              <span>My Issues</span>
            </button>
            <button
              type="button"
              className="user-dashboard-nav-item"
              onClick={() => navigate("/profile")}
            >
              <UserRound />
              <span>Profile</span>
            </button>
          </>
        )}

        {userData?.isAdmin && (
          <>
            <button
              type="button"
              className="user-dashboard-nav-item"
              onClick={() => navigate("/admin/dashboard")}
            >
              <LayoutDashboard />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className="user-dashboard-nav-item"
              onClick={() => navigate("/admin/manageissues")}
            >
              <Wrench />
              <span>Manage Issues</span>
            </button>

            <button
              type="button"
              className="user-dashboard-nav-item"
              onClick={() => navigate("/admin/usermanagement")}
            >
              <Users />
              <span>User Management</span>
            </button>
          </>
        )}
      </nav>

      <div className="user-dashboard-logout-section">
        <button
          type="button"
          className="user-dashboard-logout"
          onClick={logout}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function PageLayout({
  children,
  userData,
  navigate,
  logout,
  displayName,
}) {
  return (
    <div className="user-dashboard">
      <Sidebar
        userData={userData}
        navigate={navigate}
        logout={logout}
      />

      <div className="user-dashboard-main">
        <header className="user-dashboard-header">
          <h1>Issue details</h1>

          <div className="user-dashboard-header-user">
            <span>Welcome {displayName}</span>
            <NotificationBell firebaseUid={userData?.firebaseUid} />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

export default function IssueDetails() {
  const { issueId } = useParams(); // Get the issue ID from the URL
  const navigate = useNavigate();
  const logout = userLogout(); //Handle logout using logout hook
  const { userData } = getUserData();

  //Local state variables
  const [issue, setIssue] = useState(null); // Stores the fetched issue details
  const [loading, setLoading] = useState(true); // True while fetching the issue
  const [error, setError] = useState(""); // Stores any error messages
  const [assigningIssue, setAssigningIssue] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [statusError, setStatusError] = useState("");
  const assignmentDropdownRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // State variables for admin assignment dropdown
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Update the issue while preserving messages and admin comments if they
  // are not included in a backend response.
  const updateIssueState = (updatedIssue) => {
    setIssue((previousIssue) => ({
      ...updatedIssue,
      issueMessages:
        updatedIssue.issueMessages ??
        previousIssue?.issueMessages ??
        [],
      issueComments:
        updatedIssue.issueComments ??
        previousIssue?.issueComments ??
        [],
    }));
  };

  // Fetch the issue details from the server/backend when this page/component loads or if the issueId changes
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        // Call backend API to fetch issue by ID
        const query = userData?.firebaseUid
          ? `?firebaseUid=${encodeURIComponent(userData.firebaseUid)}`
          : "";

        const res = await fetch(
          `http://localhost:8000/api/issues/${issueId}${query}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch issue");
        }

        const data = await res.json();

        if (userData?.firebaseUid) {
          const messagesResponse = await fetch(
            `http://localhost:8000/api/issues/${issueId}/messages?firebaseUid=${encodeURIComponent(
              userData.firebaseUid
            )}`
          );

          if (messagesResponse.ok) {
            data.issueMessages = await messagesResponse.json();
          }
        }

        setIssue(data); // Store fetched issue in state
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false); // Stop loading regardless of success/failure
      }
    };

    fetchIssue();
  }, [issueId, userData?.firebaseUid]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const messageText = newMessage.trim();

    if (!messageText || !userData?.firebaseUid) {
      return;
    }

    try {
      setSendingMessage(true);
      setMessageError("");

      const response = await fetch(
        `http://localhost:8000/api/issues/${issueId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: userData.firebaseUid,
            messageText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setIssue((previousIssue) => ({
        ...previousIssue,
        issueMessages: [
          ...(previousIssue.issueMessages || []),
          data,
        ],
      }));

      setNewMessage("");
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        assignmentDropdownRef.current &&
        !assignmentDropdownRef.current.contains(event.target)
      ) {
        setAdminDropdownOpen(false);
      }
    };

    if (adminDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [adminDropdownOpen]);

  const addComment = async (event) => {
    event.preventDefault();

    const comment = newComment.trim();

    if (!comment || !userData?.firebaseUid) {
      return;
    }

    if (commentAttachments.length > 5) {
      setCommentError("You can attach a maximum of 5 files.");
      return;
    }

    try {
      setAddingComment(true);
      setCommentError("");

      const formData = new FormData();

      formData.append("firebaseUid", userData.firebaseUid);
      formData.append("comment", comment);

      commentAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch(
        `http://localhost:8000/api/issues/${issueId}/comments`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add comment"
        );
      }

      setIssue((previousIssue) => ({
        ...previousIssue,
        issueComments: [
          ...(previousIssue.issueComments || []),
          data,
        ],
      }));

      setNewComment("");
      setCommentAttachments([]);
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setAddingComment(false);
    }
  };

  const handleCommentAttachments = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFile) {
      setCommentError(
        "Only JPEG, PNG, GIF, WebP images and PDF files can be attached."
      );
      event.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedFile) {
      setCommentError(
        `"${oversizedFile.name}" exceeds the 5 MB file size limit.`
      );
      event.target.value = "";
      return;
    }

    if (commentAttachments.length + selectedFiles.length > 5) {
      setCommentError(
        "You can attach a maximum of 5 files to each comment."
      );
      event.target.value = "";
      return;
    }

    setCommentAttachments((previousFiles) => [
      ...previousFiles,
      ...selectedFiles,
    ]);

    setCommentError("");
    event.target.value = "";
  };

  const removeCommentAttachment = (indexToRemove) => {
    setCommentAttachments((previousFiles) =>
      previousFiles.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

  //Helper method to assign the issue to the current user/admin. This will update the assignedTo field in the mongoDB database for that issue to the current user's id.
  const assignIssueToMe = async () => {
    if (!userData?.firebaseUid || !issue?._id) {
      return;
    }

    try {
      setAssigningIssue(true);

      const response = await fetch(
        `http://localhost:8000/api/issues/${issue._id}/assign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: userData.firebaseUid,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error || "Failed to assign issue"
        );
      }

      const updatedIssue = await response.json();
      updateIssueState(updatedIssue);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not assign issue");
    } finally {
      setAssigningIssue(false);
    }
  };

  // Assign the issue to the administrator selected from the assignment dropdown.
  const assignIssueToAdmin = async (adminId) => {
    if (!userData?.firebaseUid || !issue?._id || !adminId) {
      return;
    }

    try {
      setAssigningIssue(true);

      const response = await fetch(
        `http://localhost:8000/api/issues/${issue._id}/assign-to`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: userData.firebaseUid,
            assignedTo: adminId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to assign issue"
        );
      }

      updateIssueState(data);
      setAdminDropdownOpen(false);
      setAdminSearch("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not assign issue");
    } finally {
      setAssigningIssue(false);
    }
  };

  // Helper method to unassign the issue from the current user/admin. This will update the assignedTo field in the mongoDB database for that issue to null.
  const unassignIssue = async () => {
    if (!issue?._id) {
      return;
    }

    try {
      setAssigningIssue(true);

      const response = await fetch(
        `http://localhost:8000/api/issues/${issue._id}/unassign`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error || "Failed to unassign issue"
        );
      }

      const updatedIssue = await response.json();
      updateIssueState(updatedIssue);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not unassign issue");
    } finally {
      setAssigningIssue(false);
    }
  };

  // Fetch administrators for the assignment dropdown.
  // The optional search term is used to find administrators by name or email.
  const fetchAdmins = async (searchTerm = "") => {
    if (!userData?.firebaseUid) {
      return;
    }

    try {
      setLoadingAdmins(true);

      const response = await fetch(
        `http://localhost:8000/api/admin/users?firebaseUid=${encodeURIComponent(
          userData.firebaseUid
        )}&search=${encodeURIComponent(searchTerm)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load administrators"
        );
      }

      setAdmins(data);
    } catch (err) {
      console.error(
        "Failed to load administrators:",
        err
      );
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Filter the administrator list based on the text entered into the search box.
  const filteredAdmins = admins.filter((admin) => {
    const adminName =
      `${admin.firstName || ""} ${admin.lastName || ""
        }`.toLowerCase();

    const adminEmail = (
      admin.email || ""
    ).toLowerCase();

    const searchTerm = adminSearch
      .toLowerCase()
      .trim();

    return (
      adminName.includes(searchTerm) ||
      adminEmail.includes(searchTerm)
    );
  });

  //Helper method to update the status of the issue. This will update the status field in the mongoDB database for that issue to the nextStatus value.
  const updateIssueStatus = async (nextStatus) => {
    if (!issue?._id) {
      return;
    }

    if (
      nextStatus === "Closed" &&
      !issue.issueComments?.some(
        (issueComment) =>
          issueComment.comment?.trim()
      )
    ) {
      setStatusError(
        "Add at least one resolution comment stating how the issue was resolved before closing this issue."
      );
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");

      const response = await fetch(
        `http://localhost:8000/api/issues/${issue._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
            firebaseUid: userData?.firebaseUid,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error ||
          "Failed to update issue status"
        );
      }

      const updatedIssue = await response.json();
      updateIssueState(updatedIssue);
    } catch (err) {
      console.error(err);
      alert(
        err.message || "Could not update issue status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const displayName =
    userData?.firstName ||
    userData?.name ||
    "User";

  const initials =
    `${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase();

  const layoutProps = {
    userData,
    navigate,
    logout,
    displayName,
    initials,
  };

  // Copies the complete issue ID to the user's clipboard.
  const copyIssueId = async () => {
    if (!issue?._id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(issue._id);
      setCopiedId(true);

      // Return the icon to its normal state after a short delay.
      setTimeout(() => {
        setCopiedId(false);
      }, 1500);
    } catch (err) {
      console.error(
        "Failed to copy issue ID:",
        err
      );
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/issues/${issue._id}/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: userData?.firebaseUid,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to remove message"
        );
      }

      // Update the message locally so the removed message is displayed
      // without requiring the issue page to be refreshed.
      setIssue((currentIssue) => ({
        ...currentIssue,
        issueMessages: (
          currentIssue.issueMessages || []
        ).map((message) =>
          message._id === messageId
            ? {
              ...message,
              isDeleted: true,
            }
            : message
        ),
      }));
    } catch (err) {
      console.error(
        "Failed to remove message:",
        err
      );

      setMessageError(
        err.message ||
        "Failed to remove message."
      );
    }
  };

  const downloadCommentAttachment = async (attachment) => {
    try {
      const response = await fetch(attachment.url);

      if (!response.ok) {
        throw new Error("Failed to download attachment.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download attachment:", err);
    }
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop =
        chatMessagesRef.current.scrollHeight;
    }
  }, [issue?.issueMessages]);

  //Display info to the user about what the page is doing
  if (loading) {
    return (
      <PageLayout {...layoutProps}>
        <div className="issues-details-container">
          <div className="issue-details-status">
            Loading issue data...
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout {...layoutProps}>
        <div className="issues-details-container">
          <div className="issue-details-status issue-details-status-error">
            {error}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!issue) {
    return (
      <PageLayout {...layoutProps}>
        <div className="issues-details-container">
          <div className="issue-details-status">
            No issue found.
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout {...layoutProps}>
      <div className="issues-details-container">
        <div className="issue-details-summary">
          <div className="issue-summary-item">
            <span className="issue-summary-label">
              Incident Date
            </span>

            <span>
              {issue.dateTimeIssueOccurred
                ? new Date(
                  issue.dateTimeIssueOccurred
                ).toLocaleString("en-AU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "Not recorded"}
            </span>
          </div>

          <div className="issue-summary-item">
            <span className="issue-summary-label">
              Location
            </span>

            <span>
              {issue.location ||
                "Unknown location"}
            </span>
          </div>

          <div className="issue-summary-item">
            <span className="issue-summary-label">
              Campus
            </span>

            <span>
              {issue.campus ||
                "Unknown campus"}
            </span>
          </div>
        </div>

        <div className="issue-details-main-layout">
          <div className="issue-details-main-column">
            <section className="issue-details-card">
              <div className="issue-details-card-header">
                Title
              </div>

              <div className="issue-details-card-body">
                <p style={{ textAlign: "center" }}>
                  {issue.title ||
                    "No title provided."}
                </p>
              </div>
            </section>

            <section className="issue-details-card issue-description-card">
              <div className="issue-details-card-header">
                Description
              </div>

              <div className="issue-details-card-body">
                <p>
                  {issue.issueDescription ||
                    "No description provided."}
                </p>
              </div>
            </section>

            {issue.additionalDetails && (
              <section className="issue-details-card">
                <div className="issue-details-card-header">
                  Additional details
                </div>

                <div className="issue-details-card-body">
                  <p>
                    {issue.additionalDetails}
                  </p>
                </div>
              </section>
            )}

            {issue.imageURLs &&
              issue.imageURLs.length > 0 && (
                <section className="issue-details-card">
                  <div className="issue-details-card-header">
                    Evidence
                  </div>

                  <div className="issue-details-card-body">
                    <div className="issue-details-image-row">
                      {issue.imageURLs.map(
                        (url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Issue evidence"
                            className="issue-details-image"
                          />
                        )
                      )}
                    </div>
                  </div>
                </section>
              )}

            <section className="issue-details-card">
              <div className="issue-details-card-header">
                Messages
              </div>

              <div className="issue-details-card-body">
                {issue.issueMessages?.length ? (
                  <div className="issue-chat" ref={chatMessagesRef}>
                    {issue.issueMessages.map((message) => {
                      const isAdminMessage =
                        message.senderRole === "Admin" ||
                        message.senderRole === "Administrator";

                      if (message.isDeleted) {
                        return (
                          <div
                            className="issue-chat-message issue-chat-message-deleted"
                            key={message._id}
                          >
                            <div className="issue-chat-deleted-bubble">
                              <p>
                                This message was removed by an administrator.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          className={`issue-chat-message ${isAdminMessage
                            ? "issue-chat-message-right"
                            : "issue-chat-message-left"
                            }`}
                          key={message._id}
                        >
                          <div className="issue-chat-sender">
                            {message.senderName}
                          </div>

                          <div className="issue-chat-bubble">
                            <p>{message.messageText}</p>

                            {userData?.isAdmin && (
                              <button
                                type="button"
                                className="issue-comment-delete-button"
                                onClick={() =>
                                  handleDeleteMessage(message._id)
                                }
                                title="Remove message"
                                aria-label="Remove message"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>

                          <small className="issue-chat-timestamp">
                            {new Date(message.createdAt).toLocaleString("en-AU")}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="issue-details-empty-text">
                    No messages yet.
                  </p>
                )}

                <form
                  className="issue-comment-form"
                  onSubmit={sendMessage}
                >
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    maxLength={1000}
                    placeholder={
                      userData?.isAdmin
                        ? "Send a message to provide an update, request information, or discuss this issue with the issue reporter."
                        : "Send a message to ask a question, provide an update, or share additional information about your issue."
                    }
                    aria-label="New issue message"
                  />

                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    {sendingMessage ? "Sending..." : "Send message"}
                  </button>

                  {messageError && (
                    <p className="issue-comment-error">
                      {messageError}
                    </p>
                  )}
                </form>
              </div>
            </section>

            {/* Admin comments are only visible to admin users */}
            {userData?.isAdmin && (
              <section className="issue-details-card">
                <div className="issue-details-card-header">
                  Admin Progress Comments
                </div>

                <div className="issue-details-card-body">
                  {/* Existing comments */}
                  {issue.issueComments?.length ? (
                    <div className="issue-comments-list">
                      {issue.issueComments.map(
                        (issueComment) => (
                          <div
                            className="issue-comment"
                            key={issueComment._id}
                          >
                            <p>
                              {issueComment.comment}
                            </p>

                            {/* Comment attachments */}
                            {issueComment.attachments?.length > 0 && (
                              <div className="issue-comment-attachments">
                                {issueComment.attachments.map(
                                  (attachment, index) => {
                                    const isPdf =
                                      attachment.fileType ===
                                      "application/pdf";

                                    return isPdf ? (
                                      <button
                                        key={index}
                                        type="button"
                                        className="issue-comment-pdf"
                                        onClick={() => downloadCommentAttachment(attachment)}
                                      >
                                        <span>
                                          PDF
                                        </span>

                                        <span>
                                          {attachment.fileName}
                                        </span>
                                      </button>
                                    ) : (
                                      <a
                                        key={index}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="issue-comment-image-link"
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={
                                            attachment.fileName ||
                                            "Comment attachment"
                                          }
                                          className="issue-comment-image"
                                        />
                                      </a>
                                    );
                                  }
                                )}
                              </div>
                            )}

                            <small>
                              {issueComment.commentedByName}{" "}
                              ·{" "}
                              {new Date(
                                issueComment.dateTimeCommented
                              ).toLocaleString("en-AU")}
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="issue-details-empty-text">
                      No comments recorded.
                    </p>
                  )}

                  {/* Add a new comment */}
                  <form
                    className="issue-comment-form"
                    onSubmit={addComment}
                  >
                    <textarea
                      value={newComment}
                      onChange={(event) =>
                        setNewComment(event.target.value)
                      }
                      maxLength={300}
                      placeholder="Add a progress or resolution comment"
                      aria-label="New admin comment"
                    />

                    {/* Selected attachments */}
                    {commentAttachments.length > 0 && (
                      <div className="issue-comment-selected-files">
                        {commentAttachments.map(
                          (file, index) => (
                            <div
                              className="issue-comment-selected-file"
                              key={`${file.name}-${index}`}
                            >
                              <span>
                                {file.type === "application/pdf"
                                  ? "PDF"
                                  : "Image"}{" "}
                                · {file.name}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  removeCommentAttachment(index)
                                }
                                disabled={addingComment}
                                aria-label={`Remove ${file.name}`}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Comment actions */}
                    <div className="issue-comment-actions">
                      {/* Add comment */}
                      <button
                        type="submit"
                        disabled={
                          addingComment ||
                          !newComment.trim()
                        }
                        title={
                          addingComment
                            ? "Adding comment..."
                            : !newComment.trim()
                              ? "Enter a comment first"
                              : "Add this progress comment"
                        }
                      >
                        {addingComment
                          ? "Adding..."
                          : "Add comment"}
                      </button>

                      {/* Add attachments */}
                      <div className="issue-comment-upload">
                        <label
                          htmlFor="comment-attachments"
                          className="issue-comment-upload-label"
                        >
                          Add attachments
                        </label>

                        <input
                          id="comment-attachments"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          multiple
                          onChange={handleCommentAttachments}
                          disabled={
                            addingComment ||
                            commentAttachments.length >= 5
                          }
                        />
                      </div>



                    </div>
                    <small className="issue-comment-upload-help">
                      Up to 5 files per comment, maximum 5 MB each. Images and PDF files are accepted.
                    </small>

                    {commentError && (
                      <p className="issue-comment-error">
                        {commentError}
                      </p>
                    )}
                  </form>
                </div>
              </section>
            )}
          </div>

          {/* Side column for witness information */}
          <aside className="issue-details-side-column">
            <section className="issue-details-card">
              <div className="issue-details-card-header">
                Witnesses
              </div>

              <div className="issue-details-card-body">
                {issue.witnessNames &&
                  issue.witnessNames.length > 0 ? (
                  <div className="witness-pill-container">
                    {issue.witnessNames.map(
                      (name, i) => (
                        <span
                          className="witness-pill"
                          key={i}
                        >
                          {name}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="issue-details-empty-text">
                    No witnesses recorded.
                  </p>
                )}
              </div>
            </section>

            {/* Side column for additional relevant information */}
            <section className="issue-details-card issue-snapshot-card">
              <div className="issue-details-card-header">
                Issue snapshot
              </div>

              <div className="issue-details-card-body issue-details-meta-list">
                <div className="issue-meta-row">
                  <span>Issue ID:</span>

                  <div className="issue-id-display">
                    <strong
                      title={
                        issue._id || "Unknown"
                      }
                    >
                      {issue._id
                        ? `${issue._id.slice(
                          0,
                          6
                        )}...${issue._id.slice(
                          -4
                        )}`
                        : "Unknown"}
                    </strong>

                    {issue._id && (
                      <button
                        type="button"
                        className="copy-issue-id-button"
                        onClick={copyIssueId}
                        title={
                          copiedId
                            ? "Copied!"
                            : "Copy full issue ID"
                        }
                        aria-label={
                          copiedId
                            ? "Issue ID copied"
                            : "Copy full issue ID"
                        }
                      >
                        {copiedId ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="issue-meta-row">
                  <span>Status:</span>

                  {userData?.isAdmin ? (
                    <select
                      value={
                        issue.status || "Open"
                      }
                      onChange={(event) =>
                        updateIssueStatus(
                          event.target.value
                        )
                      }
                      disabled={updatingStatus}
                      title="Change the issue status"
                    >
                      <option value="Open">
                        Open
                      </option>

                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Closed">
                        Closed
                      </option>
                    </select>
                  ) : (
                    <strong>
                      {issue.status}
                    </strong>
                  )}
                </div>

                <div className="issue-meta-row">
                  <span>Priority:</span>

                  <strong>
                    {issue.priority || "Not set"}
                  </strong>
                </div>

                <div className="issue-meta-row">
                  <span>Reported date:</span>

                  <strong>
                    {new Date(
                      issue.dateTimeReported
                    ).toLocaleString("en-AU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </strong>
                </div>

                <div className="issue-meta-row">
                  <span>Reported by:</span>

                  <strong>
                    {issue.reportedByName ||
                      "Unknown"}
                  </strong>
                </div>

                <div className="issue-meta-row">
                  <span>Assigned to:</span>

                  <strong>
                    {issue.assignedToName ||
                      "Unassigned"}
                  </strong>
                </div>

                {issue.dateTimeIssueClosed !=
                  null && (
                    <div className="issue-meta-row">
                      <span>
                        Issue closed date:
                      </span>

                      <strong>
                        {new Date(
                          issue.dateTimeIssueClosed
                        ).toLocaleString(
                          "en-AU",
                          {
                            dateStyle: "short",
                            timeStyle: "short",
                          }
                        )}
                      </strong>
                    </div>
                  )}
              </div>
            </section>

            {/* Admin assignment controls */}
            {userData?.isAdmin && (
              <section className="issue-details-card issue-assignment-card">
                <div className="issue-details-card-header">
                  Issue Assignment
                </div>

                <div className="issue-details-card-body">
                  <div className="issue-assignment-actions">

                    {/* Assign to Me */}
                    <button
                      className="admin-action-button admin-action-primary"
                      type="button"
                      onClick={assignIssueToMe}
                      disabled={
                        assigningIssue ||
                        issue.status === "Closed"
                      }
                      title={
                        issue.status === "Closed"
                          ? "Closed issues cannot be reassigned"
                          : "Assign this issue to yourself"
                      }
                    >
                      {assigningIssue
                        ? "Assigning..."
                        : "Assign to Me"}
                    </button>

                    {/* Assign to Admin */}
                    <div
                      className="issue-assignment-dropdown-container"
                      ref={assignmentDropdownRef}>
                      <button
                        className="issue-assignment-dropdown-button"
                        type="button"
                        onClick={() => {
                          if (
                            !adminDropdownOpen &&
                            admins.length === 0
                          ) {
                            fetchAdmins();
                          }

                          setAdminDropdownOpen(
                            (previous) => !previous
                          );
                        }}
                        disabled={
                          assigningIssue ||
                          issue.status === "Closed"
                        }
                        title={
                          issue.status === "Closed"
                            ? "Closed issues cannot be reassigned"
                            : "Assign this issue to another administrator"
                        }
                      >
                        <span>Change assignee</span>

                        <ChevronDown
                          size={16}
                          className={
                            adminDropdownOpen
                              ? "assignment-chevron-open"
                              : ""
                          }
                        />
                      </button>

                      {adminDropdownOpen && (
                        <div className="issue-assignment-dropdown">

                          <div className="issue-assignment-search">
                            <Search size={16} />

                            <input
                              type="text"
                              value={adminSearch}
                              onChange={(event) =>
                                setAdminSearch(
                                  event.target.value
                                )
                              }
                              placeholder="Search administrators..."
                              autoFocus
                              aria-label="Search administrators"
                            />

                            {adminSearch && (
                              <button
                                type="button"
                                onClick={() =>
                                  setAdminSearch("")
                                }
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <div className="issue-assignment-options">
                            {loadingAdmins ? (
                              <div className="issue-assignment-loading">
                                Loading administrators...
                              </div>
                            ) : filteredAdmins.length > 0 ? (
                              filteredAdmins.map((admin) => {
                                const adminName =
                                  `${admin.firstName || ""} ${admin.lastName || ""
                                    }`.trim() ||
                                  admin.email;

                                const isCurrentAssignee =
                                  issue.assignedTo?.toString() ===
                                  admin._id?.toString();

                                return (
                                  <button
                                    key={admin._id}
                                    type="button"
                                    className={`issue-assignment-option ${isCurrentAssignee
                                      ? "issue-assignment-option-current"
                                      : ""
                                      }`}
                                    onClick={() =>
                                      assignIssueToAdmin(
                                        admin._id
                                      )
                                    }
                                    disabled={
                                      assigningIssue ||
                                      isCurrentAssignee
                                    }
                                  >
                                    <span>
                                      {adminName}
                                    </span>

                                    {isCurrentAssignee ? (
                                      <Check size={16} />
                                    ) : (
                                      <small>
                                        {admin.email}
                                      </small>
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="issue-assignment-empty">
                                No administrators found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Unassign */}
                    <button
                      className="admin-action-button admin-action-danger"
                      type="button"
                      onClick={unassignIssue}
                      disabled={
                        assigningIssue ||
                        !issue.assignedTo ||
                        issue.status === "Closed"
                      }
                      title={
                        !issue.assignedTo
                          ? "This issue is not currently assigned"
                          : "Remove the current administrator assignment"
                      }
                    >
                      Unassign Issue
                    </button>

                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* Issue management actions */}
        <div className="issue-details-actions">

          {/* Edit Issue */}
          <button
            className="btn primary-btn"
            type="button"
            onClick={() =>
              navigate(`/editIssue/${issueId}`)
            }
            disabled={issue.status === "Closed"}
            title={
              issue.status === "Closed"
                ? "Closed issues cannot be edited"
                : "Edit this issue"
            }
          >
            Edit Issue
          </button>

          {/* Admin navigation */}
          {userData?.isAdmin && (
            <button
              className="btn secondary-btn"
              type="button"
              onClick={() =>
                navigate("/admin/manageissues")
              }
            >
              Back to Manage Issues
            </button>
          )}
        </div>
      </div >
    </PageLayout >
  );
}
