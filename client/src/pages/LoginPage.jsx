/**
 * LoginPage.jsx
 * 
 * This component represents the login page of the application.
 * It allows users to enter their credentials (e.g. email and password) to authenticate and access protected features of the system.
 * 
 * The page will later be connected to the backend API to verify user credentials and handle authentication.
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Login attempt:', { email, password });

    // Later: send to backend API
  };

  return (
    <div>
      <h1>Login Page</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <br />
        <button type="submit">Login</button>
      </form>

      <p>Don't have an account?</p>
      <Link to="/register">Register here</Link>
    </div>
  );
}