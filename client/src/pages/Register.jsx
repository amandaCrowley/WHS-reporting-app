/**
 * RegisterPage.jsx
 * 
 * This component represents the user registration page.
 * It allows new users to create an account by entering their details such as name, email, and password.
 * 
 * The form will later be connected to the backend API to store user data in the database and handle validation.
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Register attempt:', formData);

    // Later: send to backend API
  };

  return (
    <div>
      <h1>Register Page</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label><br />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Email:</label><br />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password:</label><br />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <br />
        <button type="submit">Register</button>
      </form>

      <p>Already have an account?</p>
      <Link to="/login">Login here</Link>
    </div>
  );
}