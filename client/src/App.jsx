/**
 * App.jsx
 * 
 * This is the main entry component for the React frontend application.
 * It is responsible for configuring and providing client-side routing.
 * 
 * An ErrorPage component is used to handle invalid routes and display an error message when users try to navigate to a non-existent page.
 * 
 * Author/s: Amanda Foxley & Dinh Dinh
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
import AdminUserDetails from './admin/AdminUserDetails.jsx'
import AdminAssignedIssues from './admin/AdminAssignedIssues.jsx'
import AdminEditUser from './admin/AdminEditUser.jsx'

// This component is used to protect routes that require authentication. It checks if the user is logged in and redirects them to the login page if they are not. 
// If the route requires admin privileges, it also checks if the user is an admin and redirects them to the user dashboard if they are not.
function ProtectedRoute({ children, requireAdmin = false }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(getAuth(), async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setUserData(null)
        setCheckingAuth(false)
        return
      }

      setUser(currentUser)

      try {
        const response = await fetch(`http://localhost:8000/api/user/${currentUser.uid}`)
        const data = await response.json()

        if (!response.ok) {
          setUserData(null)
          setCheckingAuth(false)
          return
        }

        setUserData(data)
      } catch (error) {
        console.error('Failed to fetch user data for auth check:', error)
        setUserData(null)
      } finally {
        setCheckingAuth(false)
      }
    })
  }, [])

  if (checkingAuth) return <p>Checking authentication...</p>
  if (!user) return <Navigate to="/login" replace />

  // If the route requires admin privileges and the user is not an admin, redirect to the user dashboard
  if (requireAdmin && !userData?.isAdmin) return <Navigate to="/userdashboard" replace />

  return children
}

//The protectedElement function is used to wrap the components that require authentication for user access. It checks if the user is logged in and redirects them to the login page if they are not.
const protectedElement = (element) => (
  <ProtectedRoute>{element}</ProtectedRoute>
)

//The adminElement function is used to wrap the components that require admin privileges. It checks if the user is an admin and redirects them to the user dashboard if they are not.
const adminElement = (element) => (
  <ProtectedRoute requireAdmin>{element}</ProtectedRoute>
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
      element: adminElement(<ManageIssues />)
    },{
      path: '/admin/usermanagement',
      element: adminElement(<UserManagement />)
    },{
      path: '/admin/users/:userId',
      element: adminElement(<AdminUserDetails />)
    },{
      path: '/admin/users/:userId/assigned-issues',
      element: adminElement(<AdminAssignedIssues />)
    },{
      path: '/admin/users/:userId/edit',
      element: adminElement(<AdminEditUser />)
    },{
      path: '/admin/dashboard',
      element: adminElement(<AdminDashboard />)
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
