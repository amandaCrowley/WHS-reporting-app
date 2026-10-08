/**
 * LoginPage.jsx
 * 
 * This page allows users to enter their credentials (e.g. email and password) to authenticate and access their WHS reporting app account.
 * 
 * This page is connected to Firebase auth which is a 3rd party service (Google) that provides authentication and user management for web applications.
 * All user credentaials are stored securely in firebase.
 * 
 * Uses firebase auth functions to validate users. 
 * 
 * If a user is an admin, they will be redirected to the admin dashboard page, otherwise they will be redirected to the user dashboard page.
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"; //Import firebase authentication functions to allow us to authenticate users using firebase
import { signOut } from "firebase/auth"; //Import firebase signOut function to allow us to sign out users
import '../styles/LoginPage.css';
import { Eye, EyeOff } from 'lucide-react';
import UONLogo from '../images/UONLogo.png'; // import the logo

/*
* This function displays the login inputs for the login page and also handles the login logic when the user clicks the login button.
* It uses state varaibles to manage the state of the email, password, and error message inputs.
* Upon successful login the user is redirected to the user dashboard page (This will need to change later to accomodate admin users as well)
* Uses firebase authentication to sign in with the provided email and password
*/
export default function LoginPage() {

    //State variables
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); //Store any error messages that occur during login
    const [showPassword, setShowPassword] = useState(false); //manage wether password shown or not

    // Password recovery state
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);

    const navigate = useNavigate(); //useNavigate is a hook from react-router-dom that allows us to programmatically navigate to different pages in the app (e.g. after successful login, we can navigate to the user's dashboard)


    // Countdown used to prevent repeated password reset email requests.
    useEffect(() => {
        if (resendCountdown <= 0) {
            return;
        }

        const timer = setTimeout(() => {
            setResendCountdown((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [resendCountdown]);


    // Sends a password reset email to the address entered on the login page.
    async function forgotPassword() {
        setError('');
        setResetMessage('');

        if (!validateEmail(email)) {
            setError("Please enter a valid email address before resetting your password.");
            return;
        }

        // Prevent another request while the resend cooldown is active.
        if (resendCountdown > 0) {
            return;
        }

        try {
            await sendPasswordResetEmail(getAuth(), email.trim());

            setResetEmailSent(true);
            setResetMessage("Reset link sent to your email address. Please check your email.");
            setResendCountdown(60);
        } catch (e) {
            switch (e.code) {
                case "auth/too-many-requests":
                    setError("Too many password reset requests. Please try again later.");
                    break;

                case "auth/network-request-failed":
                    setError("Network error. Please check your internet connection and try again.");
                    break;

                default:
                    setError("Unable to send password reset email. Please try again.");
            }
        }
    }


    //This function is called when the user clicks the login button. 
    async function login() {
        setError(''); //clear prior error messages

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(
                getAuth(),
                email,
                password
            );

            const uid = userCredential.user.uid;

            const response = await fetch(
                `http://localhost:8000/api/user/${uid}`
            );

            const userData = await response.json();

            if (!response.ok) {
                await signOut(getAuth());

                if (response.status === 403) {
                    const error = new Error(
                        "This account has been deactivated. Please register a new account to continue using the app."
                    );

                    error.code = "account-deactivated";
                    throw error;
                }

                throw new Error(
                    userData.error || "Failed to load user profile."
                );
            }

            // Defence-in-depth check for deactivated accounts
            if (userData.accountStatus === "Deactivated") {
                await signOut(getAuth());

                const error = new Error(
                    "This account has been deactivated. Please register a new account to continue using the app."
                );

                error.code = "account-deactivated";
                throw error;
            }

            navigate(
                userData.isAdmin
                    ? "/admin/dashboard"
                    : "/userdashboard"
            );

        } catch (e) {
            if (e.code === "account-deactivated") {
                setError(e.message);
                return;
            }

            switch (e.code) {
                case "auth/invalid-credential":
                case "auth/invalid-password":
                case "auth/user-not-found":
                    setError(
                        "Unable to sign in. If your previous account was deactivated, please register a new account."
                    );
                    break;

                case "auth/too-many-requests":
                    setError(
                        "Too many failed login attempts. Please try again later."
                    );
                    break;

                case "auth/network-request-failed":
                    setError(
                        "Network error. Please check your internet connection and try again."
                    );
                    break;

                default:
                    setError(
                        "Unable to login. Please try again later."
                    );
            }
        }
    }

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

    return (

        <div className="login-page">
            <div className="login-container">
                <header className="app-header">
                    <img src={UONLogo} alt="University of Newcastle logo" className="logo" />
                </header>
                <h1>WHS Login Page</h1>

                <br />
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={(e) => { e.preventDefault(); login(); }}> {/*When the user hits the submit button the login function is called */}
                    <div className="form-group">
                        <br />
                        <label>Email:</label>
                        <input
                            placeholder='Enter email'
                            type="email"
                            value={email}   //Set to the email input value to the email state variable
                            onChange={(e) => setEmail(e.target.value)} //When the user types in the email input field, it updates the email state variable with the current value
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password:</label>
                        <div className="password-wrapper">
                            <input
                                placeholder='Enter password'
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="eye-toggle"
                                onClick={() => setShowPassword(prev => !prev)}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="forgot-password-button"
                        onClick={forgotPassword}
                    >
                        Forgot password?
                    </button>

                    <button type="submit" className="login-button">Login</button>
                </form>

                <p>Don't have an account? <Link to="/register">Register here</Link></p>

                {resetEmailSent && (
                    <div className="password-reset-overlay">
                        <div className="password-reset-popup">
                            <h2>Reset link sent</h2>

                            <p>{resetMessage}</p>

                            {resendCountdown > 0 ? (
                                <p className="resend-countdown">
                                    Resend available in {resendCountdown} seconds
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    className="resend-reset-button"
                                    onClick={forgotPassword}
                                >
                                    Resend reset email
                                </button>
                            )}

                            <button
                                type="button"
                                className="close-reset-popup"
                                onClick={() => setResetEmailSent(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}