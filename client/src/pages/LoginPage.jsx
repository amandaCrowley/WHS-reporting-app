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
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"; //Import firebase authentication functions to allow us to authenticate users using firebase
import './LoginPage.css';
import { Eye, EyeOff } from 'lucide-react';

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

    const navigate = useNavigate(); //useNavigate is a hook from react-router-dom that allows us to programmatically navigate to different pages in the app (e.g. after successful login, we can navigate to the user's dashboard)


    //This function is called when the user clicks the login button. 
    async function login() {
        setError(''); //clear prior error messages

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            await signInWithEmailAndPassword(getAuth(), email, password); //Use firebase authentication to sign in with the email and password entered by the user
            navigate('/userdashboard'); //If login is successful, navigate to the user dashboard page
        } catch (e) {
            setError(e.message); //If there is an error during login (e.g. incorrect email or password), set the error state variable to display an error message to the user
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
                <h1>Login Page</h1>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={(e) => { e.preventDefault(); login(); }}> {/*When the user hits the submit button the login function is called */}
                    <div className="form-group">
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
                    <button type="submit" className="login-button">Login</button>
                </form>

                <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>
        </div>
    );
}