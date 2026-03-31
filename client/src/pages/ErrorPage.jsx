/**
 * NotFoundPage.jsx
 * 
 * This component is displayed when a user navigates to a route that does not exist within the application.
 * 
 * It contains a simple error message indicating that the requested page could not be found
 * 
 * This component is used as the errorElement in the router configuration (in App.jsx).
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <>
      <h1>404 - Page Not Found</h1>
      <p>The link you followed may be broken or the page may have been removed.</p>

      <Link to="/">Go back to Home</Link>
    </>
  );
}