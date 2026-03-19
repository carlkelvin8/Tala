import { useState } from "react" // Import useState for managing the confirm dialog open/close state
import { clearAuthSession, getStoredUser, getUserDisplayName } from "../../lib/auth" // Import auth utilities: clear session on logout, get current user, get display name
import { ConfirmDialog } from "../ui/confirm-dialog" // Import the confirmation dialog component for the logout confirmation
import { useNavigate, useLocation } from "react-router-dom" // Import useNavigate for programmatic redirect and useLocation to read the current URL path
import { LogOut, Menu } from "lucide-react" // Import LogOut icon for the logout button and Menu icon for the mobile sidebar toggle
import { cn } from "../../lib/utils" // Import the cn utility for conditional class merging
import { AvatarWithRing } from "../ui/avatar-with-ring" // Import the avatar component with ring/frame support

// Map of URL paths to human-readable page labels for the topbar title
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard", // Dashboard page label
  "/enrollment": "Enrollment", // Enrollment page label
  "/students": "Students", // Students page label
  "/materials": "Materials", // Materials page label
  "/attendance": "Attendance", // Attendance page label
  "/grades": "Grades", // Grades page label
  "/merits": "Merits", // Merits page label
  "/exams": "Exams", // Exams page label
  "/reports": "Reports", // Reports page label
  "/users": "Users", // Users page label
  "/profile": "Profile", // Profile page label
}

// Map of role keys to human-readable role labels for the user badge
const roleLabels: Record<string, string> = {
  ADMIN: "Administrator", // Admin role display label
  IMPLEMENTOR: "Implementor", // Implementor role display label
  CADET_OFFICER: "Cadet Officer", // Cadet Officer role display label
  STUDENT: "Student", // Student role display label
}

// Map of role keys to Tailwind color classes for the role badge background and text
const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-600", // Violet badge for admins
  IMPLEMENTOR: "bg-sky-50 text-sky-600", // Sky blue badge for implementors
  CADET_OFFICER: "bg-amber-50 text-amber-600", // Amber badge for cadet officers
  STUDENT: "bg-emerald-50 text-emerald-600", // Emerald badge for students
}

// Props type for the Topbar component
type TopbarProps = {
  onOpenSidebar?: () => void // Optional callback to open the mobile sidebar drawer
}

// Top navigation bar component displayed at the top of every page in the AppLayout
export function Topbar({ onOpenSidebar }: TopbarProps) {
  const user = getStoredUser() // Read the current authenticated user from localStorage
  const navigate = useNavigate() // Hook for programmatic navigation after logout
  const location = useLocation() // Hook to read the current URL path for the page title
  const [confirmOpen, setConfirmOpen] = useState(false) // State to control the logout confirmation dialog visibility

  const displayName = user ? getUserDisplayName(user) : "Guest" // Get the user's display name or "Guest" if not logged in
  const pageLabel = routeLabels[location.pathname] ?? "Overview" // Look up the current page label by path, defaulting to "Overview"
  const roleLabel = user?.role ? roleLabels[user.role] ?? user.role : "Guest" // Get the human-readable role label or fall back to the raw role string
  const roleBadge = user?.role ? roleColors[user.role] ?? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600" // Get the role badge color classes or fall back to neutral slate

  const handleLogout = () => { // Handler called when the user confirms logout
    clearAuthSession() // Remove all auth data from localStorage
    navigate("/login") // Redirect to the login page
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6"> {/* Fixed-height header bar with flex layout, bottom border, white background, and responsive horizontal padding */}
        {/* Left — mobile menu + page title */}
        <div className="flex items-center gap-3"> {/* Left section: flex row with gap between menu button and title */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden" // Square button, hidden on large screens, visible on mobile
            onClick={onOpenSidebar} // Open the mobile sidebar when clicked
            aria-label="Open menu" // Accessible label for screen readers
          >
            <Menu className="h-4 w-4" /> {/* Hamburger menu icon */}
          </button>
          <h1 className="text-sm font-semibold text-slate-900">{pageLabel}</h1> {/* Current page title derived from the URL path */}
        </div>

        {/* Right — user info + logout */}
        <div className="flex items-center gap-3"> {/* Right section: flex row with gap between elements */}
          {/* Session indicator */}
          <div className="hidden items-center gap-1.5 sm:flex"> {/* Active session indicator, hidden on mobile */}
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {/* Small green dot indicating active session */}
            <span className="text-xs text-slate-400">Active</span> {/* "Active" label next to the dot */}
          </div>

          <div className="h-4 w-px bg-slate-100 hidden sm:block" /> {/* Vertical divider, hidden on mobile */}

          {/* User pill */}
          <div className="flex items-center gap-2.5"> {/* User info section: avatar + name + role badge */}
            <AvatarWithRing user={user} size="sm" showStatusDot={false} /> {/* Small avatar with the user's frame style, no status dot */}
            <div className="hidden leading-tight sm:block"> {/* User name and role badge, hidden on mobile */}
              <p className="text-xs font-semibold text-slate-800 leading-none">{displayName}</p> {/* User's display name */}
              <span className={cn("mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold", roleBadge)}> {/* Role badge with role-specific colors */}
                {roleLabel} {/* Human-readable role label */}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-100" /> {/* Vertical divider before the logout button */}

          {/* Logout */}
          <button
            onClick={() => setConfirmOpen(true)} // Open the logout confirmation dialog instead of logging out immediately
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500" // Square button that turns red on hover
            aria-label="Sign out" // Accessible label for screen readers
          >
            <LogOut className="h-4 w-4" /> {/* Logout icon */}
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen} // Control dialog visibility with state
        onOpenChange={setConfirmOpen} // Update state when dialog open/close changes
        title="Log out of your session?" // Dialog title
        description="You will be returned to the login screen." // Dialog description
        confirmLabel="Logout" // Label for the confirm button
        onConfirm={handleLogout} // Call the logout handler when confirmed
        destructive // Style the confirm button as destructive (red)
      />
    </>
  )
}
