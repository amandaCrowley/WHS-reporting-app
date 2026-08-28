/**
 * App.jsx
 * 
 * This is the main entry component for the React frontend application.
 * It is responsible for configuring and providing client-side routing.
 * 
 * An ErrorPage component is used to handle invalid routes and display an error message when users try to navigate to a non-existent page.
 * 
 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import { useEffect, useState } from 'react'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

import './App.css'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Register from './pages/Register'
import ErrorPage from './pages/ErrorPage.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import IssueDetails from './pages/IssueDetails.jsx'
import UserProfile from './pages/UserProfile.jsx'
import UserMyIssues from './pages/UserMyIssues.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import EditIssue from './pages/EditIssue.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'
import ManageIssues from './admin/ManageIssues.jsx'
import UserManagement from './admin/UserManagement.jsx'

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser)
      setCheckingAuth(false)
    })
  }, [])

  if (checkingAuth) return <p>Checking authentication...</p>
  if (!user) return <Navigate to="/login" replace />

  return children
}

const protectedElement = (element) => (
  <ProtectedRoute>{element}</ProtectedRoute>
)

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
      path: '/userdashboard',
      element: protectedElement(<UserDashboard />)
    },{
      path: '/issue/:issueId',
      element: protectedElement(<IssueDetails />)
    },{
      path: '/profile',
      element: protectedElement(<UserProfile />)
    },{
      path: '/myissues',
      element: protectedElement(<UserMyIssues />)
    },{
      path: '/editIssue/:issueId',
      element: protectedElement(<EditIssue />)
    },{
      path: '/reportissue',
      element: protectedElement(<ReportIssue />)
    },{
      path: '/admin/manageissues',
      element: protectedElement(<ManageIssues />)
    },{
      path: '/admin/usermanagement',
      element: protectedElement(<UserManagement />)
    },{
      path: '/admin/dashboard',
      element: protectedElement(<AdminDashboard />)
    }]
  }]
const router = createBrowserRouter(routes);

//This is the main App component that is loaded in main.jsx. 
// It uses the RouterProvider to load the routes we have defined above. 
function App() {
  return (
   <RouterProvider router={router} />
  )
}
export default App
