/**
 * ErrorPage.jsx
 * 
 * This page is displayed when a user navigates to a page that does not exist.
 * It contains a simple error message and a link to go back to the home page.
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