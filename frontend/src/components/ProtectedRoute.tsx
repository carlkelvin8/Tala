import { Navigate } from "react-router-dom" // Import Navigate to perform declarative redirects within JSX
import { getStoredUser } from "../lib/auth" // Import the function that reads the current user from localStorage
import { RoleType } from "../types" // Import the RoleType union for typing the optional roles prop

// Props type for the ProtectedRoute component
type Props = {
  roles?: RoleType[] // Optional array of roles that are allowed to access this route; if omitted, any authenticated user is allowed
  children: React.ReactNode // The child components/pages to render when access is granted
}

// Route guard component that checks authentication and optional role-based access control
export function ProtectedRoute({ roles, children }: Props) {
  const user = getStoredUser() // Read the currently authenticated user from localStorage
  if (!user) { // If no user is found in storage, the user is not logged in
    return <Navigate to="/login" replace /> // Redirect to the login page, replacing the current history entry so back-button doesn't return here
  }
  if (roles && !roles.includes(user.role)) { // If specific roles are required and the user's role is not in the allowed list
    return <Navigate to="/dashboard" replace /> // Redirect to the dashboard instead of showing an error, replacing history entry
  }
  return <>{children}</> // Access granted: render the protected children inside a React Fragment
}
