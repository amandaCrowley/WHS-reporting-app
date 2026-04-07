/**
 * HomePage.jsx
 * 
 * This page represents the main landing page of the application. (It is the root page at the URL "/")
 * 
 * Contains a basic welcome message and some links to navigate to other parts of the app.
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