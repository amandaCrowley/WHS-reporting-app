/**
 * RegisterPage.jsx
 * 
 * This component represents the user registration page.
 * It allows new users to create an account by entering their details such as name, email, and password.
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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(''); //Store any error messages that occur during registration

    const navigate = useNavigate(); //useNavigate is a hook from react-router-dom that allows us to programmatically navigate to different pages in the app (e.g. after successful login, we can navigate to the user's dashboard)


    //This function is called when the user clicks the create account button. 
    async function createAccount() {
        if (password !== confirmPassword) {
            setError('Passwords do not match'); //If the password and confirm password fields do not match, set the error state variable to display an error message to the user
            return;
        }

        try {
            await createUserWithEmailAndPassword(getAuth(), email, password); //Use firebase authentication to create a new user with the email and password entered into the form
            navigate('/login'); //If account creation is successful, navigate to the login page 
        } catch (e) {
            setError(e.message); //If there is an error during registration (e.g. incorrect email or password), set the error state variable to display an error message to the user
        }
    }

    return (
        <>
            <h1>Create an account</h1>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={(e) => { e.preventDefault(); createAccount(); }}>
                <div>
                    <br /><label>Email:</label><br />
                    <input
                        placeholder='Enter email'
                        type="email"
                        value={email} //Set to the email input value to the email state variable
                        onChange={(e) => setEmail(e.target.value)} //When the user types in the email input field, it updates the email state variable with the current value
                        required
                    />
                </div>

                <div>
                    <br /><br /><label>Password:</label><br />
                    <input
                        placeholder='Enter password'
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                    />
                </div>
                <div>
                    <br /><br /><label>Confirm Password:</label><br />
                    <input
                        placeholder='Confirm password'
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required
                    />
                </div>

                <br />
                <button type="submit">Create account</button>
            </form>

            <br /><br />
            <p>Already have an account? <Link to="/login">Login here</Link>.</p>
        </>
    );
}