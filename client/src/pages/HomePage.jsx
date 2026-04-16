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
import './HomePage.css';   // ← Added this line

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to the WHS Reporting System</h1>
        <p>Report issues and stay safe on campus.</p>
      </div>

      <div className="actions">
        <Link to="/login" className="btn btn-primary">Login</Link>
        <Link to="/register" className="btn btn-secondary">Register</Link>
      </div>
    </div>
  );
}