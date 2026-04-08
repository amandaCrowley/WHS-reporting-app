/**
 * UserProfile.jsx
 * 
 * This page will alow users to change their profile information. i.e. 
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { getUserData } from "../hooks/getUserData";
import { usePasswordReset } from "../hooks/usePasswordReset";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const navigate = useNavigate();

  //State variables
  const { userData, loading, error, logout, updateUser } = getUserData();
  const { updateUserPassword, loading: pwLoading, error: pwError } = usePasswordReset();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  //Load last name from userData
  const [lastName, setLastName] = useState(userData?.lastName || "");

  useEffect(() => {
    if (userData?.lastName) {
      setLastName(userData.lastName); // keep local state in sync with backend
    }
  }, [userData]);

  //Display info to the user about what the page is doing
  if (loading) return <p>Loading user data...</p>;    //This will display whilst the data is being fetched from the database
  if (error) return <p>{error} Redirecting to login...</p>; //If there is an error, display and redirect
  if (!userData) return <p>No user data found.</p>;

  // Handle updating last name
  const handleUpdateLastName = async () => {
    if (lastName.trim() === "") {
      setMessage("Please enter a last name.");
      return;
    }

    if (lastName === userData.lastName) {
      setMessage("New last name must be different from the current one.");
      return;
    }

    try {
      await updateUser({ lastName }); // call your hook
      setMessage("Last name updated successfully!");
    } catch (err) {
      setMessage("Failed to update last name.");
    }
  };

  // Handle updating password
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await updateUserPassword(currentPassword, newPassword);
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      
      // If re-login required, log out user
      if (err.message.includes("log in again")) {
        logout(); // redirect to login page
        return;
      }
      setMessage(`Failed to update password: ${err.message}`);
    }
  };

  return (
    <div>
      <h1>User Profile</h1>
      <p>Welcome, {userData.firstName} {userData.lastName}!</p>
      <p>Email: {userData.email}</p>

      <hr />

      <h2>Update Last Name</h2>
      <input
        type="text"
        placeholder="New last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <button onClick={handleUpdateLastName}>Update Last Name</button>
      <hr />

      <h2>Change Password</h2>
      <input
        type="password"
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <br />
      <button onClick={handleUpdatePassword}>Update Password</button>

      <br />
      <br />
      {message && <p>{message}</p>}

      <hr />

      <button onClick={logout}>Logout</button>
      <br />
      <br />
      <button onClick={() => navigate("/userdashboard")}>Back to Dashboard</button>
    </div>
  );
}