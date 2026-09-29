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
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Register.css';
import UONLogo from '../images/UONLogo.png'; // import the logo

export default function RegisterPage() {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState("Student");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

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

        if (!privacyConsent) {
            setError("You must provide consent before creating an account.");
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        function validateName(name) {
            return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(name.trim());
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

        if (!validateName(firstName) || !validateName(lastName)) {
            setError("First and last name can only contain letters, spaces, hyphens and apostrophes.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

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
                    privacyConsent: true,
                    privacyConsentDate: new Date(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to create user in database"
                );
            }

            navigate("/login", {
                state: {
                    message: "Account created successfully. Please log in."
                }
            });

        } catch (err) {
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError(
                        'This email is already registered. Please log in or use a different email.'
                    );
                    break;

                case 'auth/weak-password':
                    setError(
                        'Password is too weak. Please use at least 6 characters.'
                    );
                    break;

                case 'auth/invalid-email':
                    setError(
                        'Please enter a valid email address.'
                    );
                    break;

                case 'auth/network-request-failed':
                    setError(
                        'Network error. Please check your internet connection and try again.'
                    );
                    break;

                default:
                    setError(
                        'Unable to create your account. Please try again later.'
                    );
            }
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
                <header className="app-header">
                    <img src={UONLogo} alt="University of Newcastle logo" className="logo" />
                </header>
                <h1>Create WHS Account</h1> <br />

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
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="eye-toggle"
                                onClick={() => setShowPassword(prev => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="eye-toggle"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
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
                    <div className="privacy-consent">
                        <input
                            type="checkbox"
                            id="privacyConsent"
                            checked={privacyConsent}
                            onChange={(e) => setPrivacyConsent(e.target.checked)}
                        />

                        <div className="privacy-consent-content">
                            <label htmlFor="privacyConsent">
                                I consent to the collection and use of my personal information
                                for WHS reporting and incident management purposes.
                            </label>

                            <button
                                type="button"
                                className="privacy-info-button"
                                onClick={() => setShowPrivacyInfo(true)}
                            >
                                More information about privacy
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Create Account"}
                    </button>
                </form>

                {showPrivacyInfo && (
                    <div
                        className="privacy-modal-overlay"
                        onClick={() => setShowPrivacyInfo(false)}
                    >
                        <div
                            className="privacy-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="privacy-modal-title"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="privacy-modal-header">
                                <h2 id="privacy-modal-title">
                                    Privacy Information
                                </h2>

                                <button
                                    type="button"
                                    className="privacy-modal-close"
                                    onClick={() => setShowPrivacyInfo(false)}
                                    aria-label="Close privacy information"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Privacy information content opens in modal box */}
                            <div className="privacy-modal-content">
                                <p>
                                    The WHS reporting application collects personal
                                    information to support the reporting and management
                                    of workplace health and safety issues.
                                </p>

                                <h3>What information is collected?</h3>
                                <p>
                                    When you register, the application collects information
                                    such as your name, email address and user role. WHS
                                    reports may also contain information such as issue
                                    descriptions, campus locations, dates and times,
                                    witness names and uploaded images.
                                </p>

                                <h3>Why is this information collected?</h3>
                                <p>
                                    Information is collected to allow WHS issues to be
                                    reported, managed and followed up by authorised WHS
                                    administrators.
                                </p>

                                <h3>Who can access my information?</h3>
                                <p>
                                    Personal information and submitted reports are restricted
                                    to authorised users who require access for WHS reporting
                                    and incident management purposes.
                                </p>

                                <h3>How is my information protected?</h3>
                                <p>
                                    Appropriate security measures are used to help protect personal information from unauthorised access, use, alteration or disclosure.
                                    Access to WHS reports is restricted to authorised users, and secure communication protocols are used where applicable.
                                </p>

                                <h3>Managing your information</h3>
                                <p>
                                    You may request to opt out of using the system and have your personal
                                    information de-identified where applicable. Requests can be made through
                                    the Privacy & Data section of your Profile page.
                                </p>

                                <p className="privacy-modal-note">
                                    By selecting the consent checkbox, you acknowledge that
                                    you have read this information and consent to the
                                    collection and use of your personal information for WHS
                                    reporting and incident management purposes.
                                </p>
                            </div>

                            <div className="privacy-modal-footer">
                                <button
                                    type="button"
                                    className="privacy-modal-ok"
                                    onClick={() => setShowPrivacyInfo(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <p className="login-link">
                    Already have an account?{" "}
                    <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}
