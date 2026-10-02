import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import MobilePageHeading from "../components/MobilePageHeading";
import useMobileNavigation from "../hooks/useMobileNavigation";
import { useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  BarChart3,
  User,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";
import UONLogo from "../images/UONLogo White.png";
import "../pages/UserDashboard.css";
import "../styles/AdminUserDetails.css";
import NotificationBell from "../components/NotificationBell";

export default function AdminUserDetails() {
  const mobileNavigation = useMobileNavigation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const logout = userLogout();
  const { userData } = getUserData();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reportedIssues, setReportedIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState("");

  // Privacy request states
  const [privacyRequest, setPrivacyRequest] = useState(null);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacyRequestLoading, setPrivacyRequestLoading] = useState(true);
  const [privacyError, setPrivacyError] = useState("");
  const [processPrivacyRequest, setProcessPrivacyRequest] = useState(false);

  /* Fetch user details */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/admin/users/${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load user details."
          );
        }

        setUser(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load user details.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  /* Fetch issues reported by the selected user */
  useEffect(() => {
    const fetchReportedIssues = async () => {
      setIssuesLoading(true);
      setIssuesError("");

      try {
        const response = await fetch(
          `http://localhost:8000/api/admin/users/${userId}/issues`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load reported issues."
          );
        }

        setReportedIssues(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(err);
        setIssuesError(
          err.message || "Could not load reported issues."
        );
      } finally {
        setIssuesLoading(false);
      }
    };

    if (userId) {
      fetchReportedIssues();
    }
  }, [userId]);

  /* Fetch the selected user's privacy request */
  useEffect(() => {
    const fetchPrivacyRequest = async () => {
      setPrivacyRequestLoading(true);
      setPrivacyError("");

      try {
        const response = await fetch(
          `http://localhost:8000/api/admin/users/${userId}/privacy-request`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load privacy request."
          );
        }

        setPrivacyRequest(data.privacyRequest || null);
      } catch (err) {
        console.error(err);
        setPrivacyError(
          err.message || "Could not load privacy request."
        );
      } finally {
        setPrivacyRequestLoading(false);
      }
    };

    if (userId) {
      fetchPrivacyRequest();
    }
  }, [userId]);

  /* Process a pending privacy request */
  const handleProcessPrivacyRequest = async (requestId) => {
    try {
      setPrivacyLoading(true);
      setPrivacyError("");

      const currentAdmin = getAuth().currentUser;

      if (!currentAdmin) {
        throw new Error("Your administrator session has expired.");
      }

      // Get a fresh Firebase ID token for the administrator
      const idToken = await currentAdmin.getIdToken(true);

      const response = await fetch(
        `http://localhost:8000/api/admin/privacy-request/${requestId}/process`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to process privacy request."
        );
      }

      /*
       * The user has now been successfully de-identified.
       */
      setProcessPrivacyRequest(false);

      /*
       * Update the user displayed on this page immediately.
       * No replacement Firebase UID is stored.
       */
      setUser((prevUser) => ({
        ...prevUser,
        firstName: "De-identified",
        lastName: "User",
        accountStatus: "Deactivated",
      }));

      /*
       * Reload the privacy request so the status and
       * processed timestamp come directly from the backend.
       */
      const privacyResponse = await fetch(
        `http://localhost:8000/api/admin/users/${userId}/privacy-request`
      );

      const privacyData = await privacyResponse.json();

      if (!privacyResponse.ok) {
        throw new Error(
          privacyData.error ||
            "Request processed, but the updated request could not be loaded."
        );
      }

      setPrivacyRequest(
        privacyData.privacyRequest || null
      );

      /*
       * Reload the historical issues using the MongoDB
       * userId rather than the deleted Firebase UID.
       */
      const issuesResponse = await fetch(
        `http://localhost:8000/api/admin/users/${userId}/issues`
      );

      const issuesData = await issuesResponse.json();

      if (!issuesResponse.ok) {
        throw new Error(
          issuesData.error ||
            "Request processed, but the user's issues could not be loaded."
        );
      }

      setReportedIssues(
        Array.isArray(issuesData) ? issuesData : []
      );

    } catch (err) {
      console.error(
        "Failed to process privacy request:",
        err
      );

      setPrivacyError(
        err.message || "Failed to process privacy request."
      );
    } finally {
      setPrivacyLoading(false);
    }
  };

  return (
    <div
      className={`user-dashboard admin-dashboard admin-user-details-shell ${mobileNavigation.layoutClassName}`}
      onKeyDown={mobileNavigation.onKeyDown}
    >
      <aside
        className="user-dashboard-sidebar"
        {...mobileNavigation.sidebarProps}
      >
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
            <ClipboardList />
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

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/admin/reporting")}
          >
            <BarChart3 />
            <span>Reporting & Analytics</span>
          </button>
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

      <div className="user-dashboard-main">
        <header className="user-dashboard-header">
          <MobilePageHeading
            title="User Details"
            {...mobileNavigation.headingProps}
          />

          <div className="user-dashboard-header-user">
            <span>
              Welcome {userData?.firstName || "Admin"}
            </span>

            <NotificationBell
              firebaseUid={userData?.firebaseUid}
            />
          </div>
        </header>

        <main className="user-dashboard-content">
          <div className="admin-user-details">

            {/* User Account Information */}
            <section>
              <h2>
                <User />
                User Account Information
              </h2>

              {loading && (
                <p>Loading user information...</p>
              )}

              {error && (
                <p role="alert">{error}</p>
              )}

              {user && (
                <div className="account-information">
                  <p>
                    <strong>Name:</strong>{" "}
                    {user.firstName || ""}{" "}
                    {user.lastName || ""}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {user.accountStatus === "Deactivated"
                      ? "De-identified"
                      : user.email || "Not provided"}
                  </p>

                  <p>
                    <strong>Role:</strong>{" "}
                    <span className="user-detail-badge user-role-badge">
                      {user.role || "Not provided"}
                    </span>
                  </p>

                  <p>
                    <strong>Account Type:</strong>{" "}
                    <span
                      className={`user-detail-badge ${
                        user.isAdmin
                          ? "admin-account-badge"
                          : "standard-account-badge"
                      }`}
                    >
                      {user.isAdmin
                        ? "Administrator"
                        : "Standard User"}
                    </span>
                  </p>

                  <p>
                    <strong>Account Status:</strong>{" "}
                    <span
                      className={`user-detail-badge ${
                        user.accountStatus === "Deactivated"
                          ? "deactivated-account-badge"
                          : "active-account-badge"
                      }`}
                    >
                      {user.accountStatus || "Active"}
                    </span>
                  </p>
                </div>
              )}

              <div className="edit-user-button-wrapper">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/users/${userId}/edit`)
                  }
                  disabled={
                    user?.accountStatus === "Deactivated"
                  }
                >
                  Edit User Details
                </button>

                {user?.accountStatus === "Deactivated" && (
                  <span className="edit-user-tooltip">
                    De-identified users cannot be edited.
                  </span>
                )}
              </div>
            </section>

            {/* Privacy & Data */}
            {!privacyRequestLoading && privacyRequest && (
              <section>
                <h2>
                  <ShieldCheck />
                  Privacy & Data
                </h2>

                {privacyError && (
                  <p role="alert">
                    {privacyError}
                  </p>
                )}

                <div className="privacy-request">
                  <div className="privacy-request-header">
                    <h3>
                      Data De-identification Request
                    </h3>
                  </div>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`privacy-status-badge privacy-status-${
                        privacyRequest.status?.toLowerCase() ||
                        "unknown"
                      }`}
                    >
                      {privacyRequest.status ||
                        "Not provided"}
                    </span>
                  </p>

                  <p>
                    <strong>Requested:</strong>{" "}
                    {privacyRequest.requestedAt
                      ? new Date(
                          privacyRequest.requestedAt
                        ).toLocaleString("en-AU", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Not provided"}
                  </p>

                  {privacyRequest.status === "Processed" &&
                    privacyRequest.processedAt && (
                      <p>
                        <strong>Processed:</strong>{" "}
                        {new Date(
                          privacyRequest.processedAt
                        ).toLocaleString("en-AU", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    )}

                  {privacyRequest.status === "Failed" &&
                    privacyRequest.failureReason && (
                      <p role="alert">
                        <strong>Failure:</strong>{" "}
                        {privacyRequest.failureReason}
                      </p>
                    )}

                  {(privacyRequest.status === "Pending" ||
                    privacyRequest.status === "Failed") && (
                    <button
                      type="button"
                      onClick={() =>
                        setProcessPrivacyRequest(true)
                      }
                      disabled={privacyLoading}
                    >
                      Process De-identification Request
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Issues Reported by User */}
            <section>
              <h2>
                <FileText />
                Issues Reported by{" "}
                {user?.accountStatus === "Deactivated"
                  ? "De-identified User"
                  : user
                    ? `${user.firstName || ""} ${
                        user.lastName || ""
                      }`.trim()
                    : "User"}
              </h2>

              {issuesLoading && (
                <p>Loading reported issues...</p>
              )}

              {issuesError && (
                <p role="alert">{issuesError}</p>
              )}

              {!issuesLoading &&
                !issuesError &&
                reportedIssues.length === 0 && (
                  <p>
                    This user has not reported any issues.
                  </p>
                )}

              {reportedIssues.length > 0 && (
                <ul className="reported-issues-list">
                  {reportedIssues.map((issue) => (
                    <li
                      key={issue._id}
                      className="reported-issue"
                    >
                      <h3>
                        {issue.title || "Untitled issue"}
                      </h3>

                      <p>
                        {issue.additionalDetails ||
                          issue.issueDescription ||
                          "No description provided."}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {issue.status || "Not provided"}
                      </p>

                      <p>
                        <strong>Priority:</strong>{" "}
                        {issue.priority || "Not set"}
                      </p>

                      <p>
                        <strong>Location:</strong>{" "}
                        {issue.location || "Not provided"}
                        {issue.campus
                          ? ` - ${issue.campus}`
                          : ""}
                      </p>

                      <p>
                        <strong>Date reported:</strong>{" "}
                        {issue.dateTimeReported
                          ? new Date(
                              issue.dateTimeReported
                            ).toLocaleString("en-AU", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Not provided"}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/issue/${issue._id}`)
                        }
                      >
                        View Issue
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Privacy Request Processing Modal */}
            {processPrivacyRequest && privacyRequest && (
              <div
                className="privacy-modal-overlay"
                onClick={() => {
                  if (!privacyLoading) {
                    setProcessPrivacyRequest(false);
                  }
                }}
              >
                <div
                  className="privacy-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="process-privacy-modal-title"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <h2 id="process-privacy-modal-title">
                    Process Data De-identification
                  </h2>

                  <p>
                    You are about to process this user's data
                    de-identification request.
                  </p>

                  <p>
                    The user's personal information will be
                    de-identified where applicable. Their WHS
                    reports may be retained in a de-identified
                    form. Their account will be deactivated and
                    their Firebase authentication account
                    permanently deleted.
                  </p>

                  <div className="privacy-modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        setProcessPrivacyRequest(false)
                      }
                      disabled={privacyLoading}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() =>
                        handleProcessPrivacyRequest(
                          privacyRequest._id
                        )
                      }
                      disabled={privacyLoading}
                    >
                      {privacyLoading
                        ? "Processing..."
                        : "Confirm & Process"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}