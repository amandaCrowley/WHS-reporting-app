/**
 * LoginPage.jsx
 * 
 * This component represents the login page of the application.
 * It allows users to enter their credentials (e.g. email and password) to authenticate and access their account.
 * 
 * The page will later be connected to the backend API to verify user credentials and handle authentication.
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"; //Import firebase authentication functions to allow us to authenticate users using firebase

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

    const navigate = useNavigate(); //useNavigate is a hook from react-router-dom that allows us to programmatically navigate to different pages in the app (e.g. after successful login, we can navigate to the user's dashboard)


    //This function is called when the user clicks the login button. 
    async function login() {
        try {
            await signInWithEmailAndPassword(getAuth(), email, password); //Use firebase authentication to sign in with the email and password entered by the user
            navigate('/userdashboard'); //If login is successful, navigate to the user dashboard page
        } catch (e) {
            setError(e.message); //If there is an error during login (e.g. incorrect email or password), set the error state variable to display an error message to the user
        }
    }

    return (
        <>
            <h1>Login Page</h1>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={(e) => { e.preventDefault(); login(); }}> {/*When the user hits the submit button the login function is called */}
            <div>
                <label>Email:</label><br />
                <input
                    placeholder='Enter email'
                    type="email"
                    value={email} //Set to the email input value to the email state variable
                    onChange={(e) => setEmail(e.target.value)} //When the user types in the email input field, it updates the email state variable with the current value
                    required
                />
            </div>

            <div>
                <label>Password:</label><br />
                <input
                    placeholder='Enter password'
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} //When the user types in the password input field, it updates the password state variable with the current value of the input
                    required
                />
            </div>

            <br />
            <button type="submit">Login</button>
            </form>

            <p>Don't have an account? Create one here.</p>
            <Link to="/register">Register here</Link>
        </>
    );
}