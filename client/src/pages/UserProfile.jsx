/**
 * UserProfile.jsx
 * 
 * This page will alow users to change their profile information. 
 * At this stage this just includes the user's last name and password.
 * i.e. A user can't change their first name, role or email
 * Perhaps email can be changed on the admin side of the app later on? 
 * 
 * Author/s: Amanda Foxley
 * Date: 2/4/26
 */

import { useEffect, useState } from "react";
import { getUserData } from "../hooks/getUserData";
import { usePasswordReset } from "../hooks/usePasswordReset";
import { useNavigate } from "react-router-dom";
import { userLogout } from "../hooks/userLogout"

export default function UserProfile() {
  const navigate = useNavigate();

  //State variables
  const { userData, loading, error } = getUserData(); //get user data from the custom react hook (getUserData.js)
  const { updateUserPassword, loading: pwLoading, error: pwError } = usePasswordReset(); //custom hook that handles a password update via Firebase (usePasswordReset.js)

  //Local password state variables
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  //Load last name from userData
  const [lastName, setLastName] = useState(userData?.lastName || "");
  const logout = userLogout();

  useEffect(() => {
    if (userData?.lastName) {
      setLastName(userData.lastName); // keep local state/variables in sync with updated backend data 
    }
  }, [userData]);

  //Display info to the user about what the page is doing
  if (loading) return <p>Loading user data...</p>;    //This will display whilst the data is being fetched from the database
  if (error) return <p>{error} Redirecting to login...</p>; //If there is an error, display and redirect
  if (!userData) return <p>No user data found.</p>;

  // function to handle updating last name
  const handleUpdateLastName = async () => {

    //-----------------Validation checks-------------------
    //Check that the name isnt empty
    if (lastName.trim() === "") {
      setMessage("Please enter a last name.");
      return;
    }

    //Check not the same as current last name
    if (lastName === userData.lastName) {
      setMessage("New last name must be different from the current one.");
      return;
    }

    //Min length of at lesat 2 characters
    if (lastName.trim().length < 2) {
      setMessage("Last name must be at least 2 characters.");
      return;
    }

    try {
      await updateUser({ lastName });  //Calls the getUserData custom hook to update the last name in the MongoDB database
      setMessage("Last name updated successfully!");
    } catch (err) {
      setMessage("Failed to update last name.");
    }
  };

  // function to handle updating password
  const handleUpdatePassword = async () => {

    // --------password validation checks-------------------
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) { //Use regex to check for 1 uppercase and 1 number
      setMessage("Password must include at least one uppercase letter and one number.");
      return;
    }

    try {
      await updateUserPassword(currentPassword, newPassword); //Calls the usePasswordReset custom hook to update Firebase with the new password
      setMessage("Password updated successfully!");

      // Clear password fields after successful update
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {

      // If Firebase requires re-login, log the user out
      if (err.message.includes("log in again")) {
        logout(); // redirect to login page using the getUserData custom hook
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

      {/* Last Name Update Section */}
      <h2>Update Last Name</h2>
      <input
        type="text"
        placeholder="New last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <button onClick={handleUpdateLastName}>Update Last Name</button>
      <hr />

      {/* Password Change Section */}
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
      {/* Feedback message */}
      {message && <p>{message}</p>}

      <hr />

      {/* Buttons */}
      <button onClick={logout}>Logout</button>
      <br />
      <br />
      <button onClick={() => navigate("/userdashboard")}>Back to Dashboard</button>
    </div>
  );
}