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


    return (
        <>
            <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
                <h1>Create an account</h1>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <form onSubmit={registerUser}>
                    <div>
                        <label>First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Email:</label>
                        <input
                            placeholder='Enter email'
                            type="email"
                            value={email} //Set to the email input value to the email state variable
                            onChange={(e) => setEmail(e.target.value)} //When the user types in the email input field, it updates the email state variable with the current value
                            required
                        />
                    </div>

                    <div>
                        <label>Password:</label>
                        <input
                            placeholder='Enter password'
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Confirm Password:</label>
                        <input
                            placeholder='Confirm password'
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="Student">Student</option>
                            <option value="Staff">Staff</option>
                            <option value="Visitor">Visitor</option>
                            <option value="Contractor">Contractor</option>
                        </select>
                    </div>

                    <br />
                    <button type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>


                <br /><br />
                <p>Already have an account? <Link to="/login">Login here</Link>.</p>
            </div>
        </>
    );
}