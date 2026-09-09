/**
 * UserProfile.jsx
 * 
 * This page allows users to change their profile information.
 * Users can update their first name, last name and password.
 * Their email, role and administrator status are displayed but cannot be changed.
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { getUserData } from "../hooks/getUserData";
import { usePasswordReset } from "../hooks/usePasswordReset";
import { useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import {
  CircleAlert,
  Eye,
  EyeOff,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";
import UONLogo from "../images/UONLogo White.png";
import "../pages/UserDashboard.css";
import "../styles/UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();

  // State variables
  const { userData, loading, error, updateUser } = getUserData();
  const {
    updateUserPassword,
    loading: pwLoading,
    error: pwError,
  } = usePasswordReset();

  // Local profile state variables
  const [firstName, setFirstName] = useState(userData?.firstName || "");
  const [lastName, setLastName] = useState(userData?.lastName || "");

  // Local password state variables
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  const logout = userLogout();

  // Load user information from userData
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
    }
  }, [userData]);

  // Helper to show feedback
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  // Loading / error / no-data states
  if (loading) return <p className="profile-status">Loading user data...</p>;
  if (error) return <p className="profile-status">{error} Redirecting to login...</p>;
  if (!userData) return <p className="profile-status">No user data found.</p>;

  // Build initials for avatar
  const initials =
    `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase();

  const displayName = userData.firstName || "User";

  // Handle updating first and last name
  const handleUpdateName = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (trimmedFirstName === "") {
      showMessage("Please enter a first name.", "error");
      return;
    }

    if (trimmedFirstName.length < 2) {
      showMessage("First name must be at least 2 characters.", "error");
      return;
    }

    if (trimmedLastName === "") {
      showMessage("Please enter a last name.", "error");
      return;
    }

    if (trimmedLastName.length < 2) {
      showMessage("Last name must be at least 2 characters.", "error");
      return;
    }

    if (
      trimmedFirstName === userData.firstName &&
      trimmedLastName === userData.lastName
    ) {
      showMessage(
        "Please enter a different first name or last name.",
        "error"
      );
      return;
    }

    try {
      await updateUser({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });

      setFirstName(trimmedFirstName);
      setLastName(trimmedLastName);

      showMessage("Name updated successfully!", "success");
    } catch (err) {
      showMessage(err.message || "Failed to update name.", "error");
    }
  };

  // Handle updating password
  const handleUpdatePassword = async () => {
    if (currentPassword === "") {
      showMessage("Please enter your current password.", "error");
      return;
    }

    if (newPassword === "") {
      showMessage("Please enter a new password.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showMessage("Password must be at least 6 characters long.", "error");
      return;
    }

    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(newPassword)) {
      showMessage(
        "Password must include an uppercase letter, lowercase letter, number, and special character.",
        "error"
      );
      return;
    }

    try {
      await updateUserPassword(currentPassword, newPassword);

      showMessage("Password updated successfully!", "success");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.message.includes("log in again")) {
        logout();
        return;
      }

      showMessage(`Failed to update password: ${err.message}`, "error");
    }
  };

  return (
    <div className="user-dashboard">
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
            className="user-dashboard-nav-item active"
          >
            <UserRound />
            <span>Profile</span>
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

      <main className="user-dashboard-main">
        <header className="user-dashboard-header">
          <h1>Edit your information</h1>

          <div className="user-dashboard-header-user">
            <span>Welcome {displayName}</span>

            <div className="profile-avatar">
              <span>{initials}</span>
            </div>
          </div>
        </header>

        <section className="profile-content">

          {/* ── Account Information ── */}
          <div className="profile-section profile-account-section">
            <h2>Account Information</h2>

            <div className="profile-info-list">
              <div className="profile-info-row">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{userData.email}</span>
              </div>

              <div className="profile-info-row">
                <span className="profile-info-label">Role</span>
                <span className="profile-info-value">{userData.role}</span>
              </div>

              <div className="profile-info-row">
                <span className="profile-info-label">Account Type</span>
                <span className="profile-info-value">
                  {userData.isAdmin ? "Administrator" : "Standard User"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Personal Information ── */}
          <div className="profile-section profile-personal-section">
            <h2>Personal Information</h2>

            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                placeholder="Enter first name"
                value={firstName}
                minLength={2}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                placeholder="Enter last name"
                value={lastName}
                minLength={2}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <button className="btn-primary" onClick={handleUpdateName}>
              Update Name
            </button>
          </div>

          {/* ── Change Password ── */}
          <div className="profile-section profile-password-section">
            <h2>Change Password</h2>

            <div className="form-group">
              <label>Current Password</label>
              <div className="password-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  required
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {showCurrentPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  minLength={6}
                  required
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  minLength={6}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleUpdatePassword}
              disabled={pwLoading}
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </div>

          {/* ── Feedback message ── */}
          {message && (
            <div className="profile-feedback-section">
              <p className={`feedback-message ${messageType}`}>
                {message}
              </p>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}