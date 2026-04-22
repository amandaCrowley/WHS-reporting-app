/**
 * UserProfile.jsx
 * 
 * This page will allow users to change their profile information. 
 * At this stage this just includes the user's last name and password.
 * i.e. A user can't change their first name, role or email.
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { getUserData } from "../hooks/getUserData";
import { usePasswordReset } from "../hooks/usePasswordReset";
import { useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout";
import "../styles/UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();

  // State variables
  const { userData, loading, error } = getUserData();
  const { updateUserPassword, loading: pwLoading, error: pwError } = usePasswordReset();

  // Local password state variables
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  // Load last name from userData
  const [lastName, setLastName] = useState(userData?.lastName || "");
  const logout = userLogout();

  useEffect(() => {
    if (userData?.lastName) {
      setLastName(userData.lastName);
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

  // Handle updating last name
  const handleUpdateLastName = async () => {
    if (lastName.trim() === "") {
      showMessage("Please enter a last name.", "error");
      return;
    }
    if (lastName === userData.lastName) {
      showMessage("New last name must be different from the current one.", "error");
      return;
    }
    if (lastName.trim().length < 2) {
      showMessage("Last name must be at least 2 characters.", "error");
      return;
    }
    try {
      await updateUser({ lastName });
      showMessage("Last name updated successfully!", "success");
    } catch (err) {
      showMessage("Failed to update last name.", "error");
    }
  };

  // Handle updating password
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }
    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      showMessage(
        "Password must include at least one uppercase letter and one number.",
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
    <div className="profile-page">

      {/* ── Welcome card ── */}
      <div className="profile-header-card">
        <div className="profile-avatar">
          <span>{initials}</span>
        </div>
        <div className="profile-header-info">
          <h1>{userData.firstName} {userData.lastName}</h1>
          <p>{userData.email}</p>
        </div>
      </div>

      {/* ── Update Last Name ── */}
      <div className="profile-section">
        <h2>Update Last Name</h2>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            placeholder="Enter new last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={handleUpdateLastName}>
          Update Last Name
        </button>
      </div>

      {/* ── Change Password ── */}
      <div className="profile-section">
        <h2>Change Password</h2>
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
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
        <div className={`profile-section`} style={{ padding: "0", maxWidth: "520px", width: "100%" }}>
          <p className={`feedback-message ${messageType}`}>{message}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="profile-actions">
        <button className="btn-secondary" onClick={() => navigate("/userdashboard")}>
          ← Back to Dashboard
        </button>
        <button className="btn-danger" onClick={logout}>
          Logout
        </button>
      </div>

    </div>
  );
}