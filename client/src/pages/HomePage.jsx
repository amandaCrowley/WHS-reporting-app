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
import '../styles/HomePage.css';   
import UONLogo from '../images/UONLogo.png'; // import the logo

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="app-header">
        <img src={UONLogo} alt="University of Newcastle logo" className="logo" />
      </header>

      <div className="hero-section">
        <h1>Welcome to the WHS Reporting System</h1>
        <br/>
        <p>Report hazards, incidents, or safety concerns here</p>
      </div>

      <div className="actions">
        <Link to="/login" className="btn btn-primary">Login</Link>
        <Link to="/register" className="btn btn-secondary">Register</Link>
      </div>
    </div>
  );
}