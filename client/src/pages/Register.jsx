/**
 * RegisterPage.jsx
 * 
 * This component represents the user registration page.
 * It allows new users to create an account by entering their details such as name, email, and password.
 * Uses firebase to create users with email and password authentication.
 * Store remaining user data into hosted mongoDB database for later use (name, role, etc.)
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"; //Import firebase functions to allow us to create new users using firebase authentication

/*
* This function displays the registration form.
* It also handles the registration logic when the user clicks the create account button.
* It uses state varaibles to manage the state of the email, password, confirm password, and error message inputs. 
*/
export default function RegisterPage() {

    //State variables
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("Student");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate(); //useNavigate is a hook from react-router-dom that allows us to programmatically navigate to different pages in the app (e.g. after successful login, we can navigate to the user's dashboard)
    const auth = getAuth(); //returns the firebase authentication object

    //This function is called when the user clicks the create account button. 
    // async function createAccount() {
    //     if (password !== confirmPassword) {
    //         setError('Passwords do not match'); //If the password and confirm password fields do not match, set the error state variable to display an error message to the user
    //         return;
    //     }

    //     try {
    //         await createUserWithEmailAndPassword(getAuth(), email, password); //Use firebase authentication to create a new user with the email and password entered into the form
    //         navigate('/login'); //If account creation is successful, navigate to the login page 
    //     } catch (e) {
    //         setError(e.message); //If there is an error during registration (e.g. incorrect email or password), set the error state variable to display an error message to the user
    //     }
    // }

    //This function is called when the user clicks the create account button. 
    const registerUser = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Basic frontend validation to check if all required fields are filled in
        if (!firstName || !lastName || !email || !password) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        //If the password and confirm password fields do not match, set the error state variable to display an error message to the user
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Send user data to backend to save in MongoDB
            const response = await fetch("http://localhost:8000/api/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firebaseUid: uid,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    role,
                    isAdmin: false,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create user in database");
            }

            //Success. Redirect to login
            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    //Adjust the syles for this form later, this is just to make it look less horrible for now
    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: "#f4f6f8"
        }}>
            <div style={{
                width: "400px",
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
                <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
                    Create Account
                </h1>

                {/* Error message */}
                {error && (
                    <div style={{
                        color: "red",
                        backgroundColor: "#ffe6e6",
                        padding: "10px",
                        borderRadius: "5px",
                        marginBottom: "15px",
                        textAlign: "center"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={registerUser}>
                    {/* First Name */}
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={inputStyle}
                        required
                    />

                    {/* Last Name */}
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={inputStyle}
                        required
                    />

                    {/* Email */}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                        required
                    />

                    {/* Password */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={inputStyle}
                        required
                    />

                    {/* Confirm Password */}
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={inputStyle}
                        required
                    />

                    {/* Role */}
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="Student">Student</option>
                        <option value="Staff">Staff</option>
                        <option value="Visitor">Visitor</option>
                        <option value="Contractor">Contractor</option>
                    </select>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            marginTop: "10px"
                        }}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "15px" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "#007bff" }}>
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px"
};
