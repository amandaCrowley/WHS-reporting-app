/**
 * HomePage.jsx
 * 
 * This component represents the main landing page of the application.
 * It is the default page displayed when users navigate to the root URL (/).
 * 
 * The page provides a basic welcome message and serves as the entry
 * point for users to navigate to other parts of the application.
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
        <h1>Welcome to the WHS Reporting System</h1>
        <p>Report issues and stay safe on campus.</p>

      <div>
        <Link to="/login">Login</Link>
        <br />
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}