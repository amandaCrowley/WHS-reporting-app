/**
 * RegisterPage.jsx
 * 
 * This page allows new users to create an account by entering their details such as name, email, role and password.
 * Uses an external service (Firebase authentication) to create and store each user's email and password.
 * The remaining user data is stored in an externally hosted mongoDB database for later use (name, role, etc.)
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import './Register.css';     // ← CSS is now in separate file

export default function RegisterPage() {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("Student");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const auth = getAuth();

    const registerUser = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!firstName || !lastName || !email || !password) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        if (!validatePassword(password)) {
            setError("Password must be at least 6 characters long and contain an uppercase letter, a lowercase letter, number and special character.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (firstName.trim().length < 2 || lastName.trim().length < 2) {
            setError("First and last name must be at least 2 characters.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

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

            navigate("/login", { state: { message: "Account created successfully. Please log in." } });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    function validateEmail(email) {
        email = email.trim();

        if (!email.includes('@')) { //Check if contains @ symbol
            return false;
        }

        const parts = email.split('@'); //Split into 2

        if (parts.length != 2) {
            return false;
        }

        const initial = parts[0];
        const domain = parts[1];

        if (initial.length === 0 || domain.length === 0) { //Check if either part is empty
            return false;
        }

        if (!domain.includes('.')) { //Check if domain contains a dot
            return false;
        }

        if (email.includes(' ')) { //Check if email contains spaces
            return false;
        }

        return true;
    }

    function validatePassword(password) {
        if (password.length < 6) { //Check if password is at least 6 characters long
            return false;
        }

        let hasUpper = false;
        let hasLower = false;
        let hasNumber = false;
        let hasSpecial = false;

        for (let char of password) { //check if has upper, lower and number 
            if (char >= 'A' && char <= 'Z') {
                hasUpper = true;
            } else if (char >= 'a' && char <= 'z') {
                hasLower = true;
            } else if (char >= '0' && char <= '9') {
                hasNumber = true;
            } else if (!(char >= 'A' && char <= 'Z') && !(char >= 'a' && char <= 'z') && !(char >= '0' && char <= '9')) {
                hasSpecial = true;
            }
        }
        return hasUpper && hasLower && hasNumber && hasSpecial;
    }

    return (
        <div className="register-page">
            <div className="register-container">
                <h1>Create WHS Account</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={registerUser}>
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            placeholder="Enter first name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            placeholder="Enter last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Create password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="Student">Student</option>
                            <option value="Staff">Staff</option>
                            <option value="Visitor">Visitor</option>
                            <option value="Contractor">Contractor</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Create Account"}
                    </button>
                </form>

                <p className="login-link">
                    Already have an account?{" "}
                    <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}
