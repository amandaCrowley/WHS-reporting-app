/**
 * App.jsx
 * 
 * This is the main entry component for the React frontend application.
 * It is responsible for configuring and providing client-side routing
 * using the react-router-dom.
 * 
 * The application defines routes for:
 * - Home page (/)
 * - Login page (/login)
 * - Registration page (/register)
 * 
 * An ErrorPage component is used to handle invalid routes and display
 * a fallback UI when a user navigates to a non-existent path.
 * 
 * The RouterProvider wraps the application and enables navigation between pages without reloading the browser.
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import{ createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'

import './App.css'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Register from './pages/Register'
import ErrorPage from './pages/ErrorPage.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import IssueDetails from './pages/issueDetails.jsx'
import UserProfile from './pages/UserProfile.jsx'
import UserMyIssues from './pages/UserMyIssues.jsx'
import ReportIssue from './pages/ReportIssue.jsx'

//Adds routes to the app, so that when the user goes to a specific URL, it will load the corresponding page (e.g. /login will load the LoginPage.jsx component page)
const routes = [{
    path: '/',
    errorElement: <ErrorPage />, //Displays this page if the user tries to access a page that doesn't exist (e.g. /asdf)
    children: [{
      path: '/',
      element: <HomePage /> 
    },{
      path: '/login',
      element: <LoginPage />
    }, {
      path: '/register',
      element: <Register />
    }, {
      path: '/register',
      element: <Register />
    }, {
      path: '/userdashboard',
      element: <UserDashboard />
    },{
      path: '/issueDetails',
      element: <IssueDetails />
    },{
      path: '/profile',
      element: <UserProfile />
    },{
      path: '/myissues',
      element: <UserMyIssues />
    },,{
      path: '/reportissue',
      element: <ReportIssue />
    }]
}]
const router = createBrowserRouter(routes);

//This is the main App component that is loaded in main.jsx. 
// It uses the RouterProvider to load the routes we defined above 
function App() {
  return (
   <RouterProvider router={router} />
  )
}
export default App
