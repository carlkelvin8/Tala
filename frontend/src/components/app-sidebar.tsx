import { useState } from "react" // Import useState for managing the sign-out confirm dialog state
import * as React from "react" // Import all of React for useEffect and ComponentProps
import { LogOut, ChevronRight, Shield } from "lucide-react" // Import icons: LogOut for sign out, ChevronRight for the profile card arrow, Shield for the role badge
import {
  Sidebar, // Root sidebar container component
  SidebarContent, // Scrollable content area of the sidebar
  SidebarFooter, // Footer section at the bottom of the sidebar
  SidebarGroup, // Logical grouping of sidebar items
  SidebarGroupContent, // Content wrapper inside a sidebar group
  SidebarGroupLabel, // Label/heading for a sidebar group
  SidebarHeader, // Header section at the top of the sidebar
  SidebarMenu, // Menu list container
  SidebarMenuItem, // Individual menu item container
} from "../components/ui/sidebar" // Import all sidebar primitive components
import { ConfirmDialog } from "../components/ui/confirm-dialog" // Import the confirmation dialog for sign-out
import { NavLink, useNavigate } from "react-router-dom" // Import NavLink for active-aware navigation links and useNavigate for programmatic navigation
import { navItems } from "../lib/navigation" // Import the master navigation items list
import { getStoredUser, clearAuthSession, getUserDisplayName, getUserInitials } from "../lib/auth" // Import auth utilities
import { cn } from "../lib/utils" // Import the cn utility for conditional class merging
import { LayoutDashboard, Users, FileText, BookOpen, CalendarCheck, ClipboardList, GraduationCap, Medal, UserCog, User2, Plane, BarChart3, Grid } from "lucide-react" // Import all navigation icons

// Map of URL paths to their corresponding icon components
const iconMap = {
  "/dashboard": LayoutDashboard, // Dashboard icon
  "/enrollment": ClipboardList, // Enrollment icon
  "/students": Users, // Students icon
  "/sections": Grid, // Sections icon (grid layout)
  "/flights": Plane, // Flights icon
  "/materials": BookOpen, // Materials icon
  "/attendance": CalendarCheck, // Attendance icon
  "/grades": GraduationCap, // Grades icon
  "/merits": Medal, // Merits icon
  "/exams": FileText, // Exams icon
  "/reports": BarChart3, // Reports icon
  "/users": UserCog, // User management icon
  "/profile": User2, // Profile icon
} as const // Mark as const to preserve literal types

// Map of role keys to human-readable role labels
const roleLabels: Record<string, string> = {
  ADMIN: "Administrator", // Admin display label
  IMPLEMENTOR: "Implementor", // Implementor display label
  CADET_OFFICER: "Cadet Officer", // Cadet Officer display label
  STUDENT: "Student", // Student display label
}

// Map of role keys to Tailwind color classes for the role badge
const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700", // Violet badge for admins
  IMPLEMENTOR: "bg-sky-100 text-sky-700", // Sky blue badge for implementors
  CADET_OFFICER: "bg-amber-100 text-amber-700", // Amber badge for cadet officers
  STUDENT: "bg-emerald-100 text-emerald-700", // Emerald badge for students
}

// The main application sidebar component used in the AppLayout
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = getStoredUser() // Read the current authenticated user from localStorage
  const navigate = useNavigate() // Hook for programmatic navigation
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false) // State to control the sign-out confirmation dialog
  const [currentUser, setCurrentUser] = useState(user) // State for the current user, updated when localStorage changes
  const items = navItems.filter((item) => (currentUser ? item.roles.includes(currentUser.role) : false)) // Filter nav items to only those the current user's role is allowed to see

  // Update user data when localStorage changes
  React.useEffect(() => { // Effect to sync user state with localStorage changes
    const handleStorageChange = () => { // Handler for the storage event (fired when another tab changes localStorage)
      setCurrentUser(getStoredUser()) // Re-read the user from localStorage
    }
    
    window.addEventListener('storage', handleStorageChange) // Listen for cross-tab localStorage changes
    
    // Also check periodically for updates
    const interval = setInterval(() => { // Poll localStorage every second for same-tab updates
      setCurrentUser(getStoredUser()) // Re-read the user from localStorage
    }, 1000)
    
    return () => { // Cleanup function
      window.removeEventListener('storage', handleStorageChange) // Remove the storage event listener
      clearInterval(interval) // Clear the polling interval
    }
  }, []) // Empty dependency array: only runs on mount/unmount

  // Group items by category
  const mainItems = items.filter((item) => // Filter items for the "Main" navigation group
    ["/dashboard", "/enrollment", "/students", "/sections", "/flights"].includes(item.path)
  )
  
  // Debug: Log to verify sections is included
  console.log("Main items:", mainItems.map(i => i.path)) // Debug log to verify sections appears in main items
  console.log("Icon for /sections:", iconMap["/sections"]) // Debug log to verify the sections icon is mapped
  const academicItems = items.filter((item) => // Filter items for the "Academic" navigation group
    ["/materials", "/attendance", "/grades", "/merits", "/exams"].includes(item.path)
  )
  const systemItems = items.filter((item) => // Filter items for the "System" navigation group
    ["/reports", "/users"].includes(item.path)
  )

  const handleSignOut = () => { // Handler called when the user confirms sign-out
    clearAuthSession() // Remove all auth data from localStorage
    navigate("/login") // Redirect to the login page
  }

  const displayName = currentUser ? getUserDisplayName(currentUser) : "Guest" // Get the user's display name or "Guest"
  const userInitials = currentUser ? getUserInitials(currentUser) : "G" // Get the user's initials or "G" for guest
  const roleLabel = currentUser ? roleLabels[currentUser.role] || currentUser.role : "Guest" // Get the human-readable role label
  const roleColor = currentUser ? roleColors[currentUser.role] || roleColors.STUDENT : roleColors.STUDENT // Get the role badge color classes

  return (
    <>
      <Sidebar {...props} className="border-r border-slate-200 bg-gradient-to-b from-white to-slate-50"> {/* Sidebar with right border and subtle gradient background */}
        {/* Header */}
        <SidebarHeader className="px-6 py-5 border-b border-slate-200 bg-white"> {/* Header with padding, bottom border, and white background */}
          <a href="/dashboard" className="flex items-center gap-3 group"> {/* Logo link to dashboard, group for hover effects */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 shadow-md group-hover:shadow-lg transition-all duration-200"> {/* Dark gradient logo container with hover shadow */}
              <span className="text-lg font-bold text-white">KT</span> {/* "KT" initials for Kalasag-Tala */}
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" /> {/* Subtle white overlay on hover */}
            </div>
            <div className="flex flex-col"> {/* Text block next to the logo */}
              <span className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors">Kalasag-Tala</span> {/* App name that lightens on hover */}
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NSTP Command</span> {/* Subtitle in small uppercase */}
            </div>
          </a>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-3 py-4 overflow-y-auto"> {/* Scrollable navigation content area */}
          {/* Main Navigation */}
          {mainItems.length > 0 && ( // Only render the Main group if there are items to show
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2"> {/* "Main" group label in small uppercase */}
                Main
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1"> {/* Menu list with small vertical spacing */}
                  {mainItems.map((item) => { // Iterate over main navigation items
                    const Icon = iconMap[item.path as keyof typeof iconMap] // Look up the icon for this path
                    return (
                      <SidebarMenuItem key={item.path}> {/* Menu item with path as key */}
                        <NavLink
                          to={item.path} // Navigate to this path
                          className={({ isActive }) => // Dynamic className based on active state
                            cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden", // Base styles
                              isActive 
                                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20" // Active: dark gradient with shadow
                                : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm" // Inactive: hover to white background
                            )
                          }
                        >
                          {({ isActive }) => ( // Render function receives isActive
                            <>
                              {isActive && ( // Only show the gradient overlay on active items
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" /> // Subtle white gradient overlay
                              )}
                              <div className={cn(
                                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all", // Icon container
                                isActive ? "bg-white/15 shadow-inner" : "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-105" // Active: semi-transparent; inactive: light gray with scale on hover
                              )}>
                                {Icon ? <Icon className="h-5 w-5" /> : <div className="h-5 w-5 bg-slate-300 rounded" />} {/* Render icon or fallback placeholder */}
                              </div>
                              <span className="flex-1 relative">{item.label}</span> {/* Nav item label */}
                              {isActive && ( // Only show the active indicator dot on active items
                                <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" /> // Pulsing white dot
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Academic Navigation */}
          {academicItems.length > 0 && ( // Only render the Academic group if there are items to show
            <SidebarGroup className="mt-6"> {/* Group with top margin for separation */}
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Academic
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {academicItems.map((item) => { // Iterate over academic navigation items
                    const Icon = iconMap[item.path as keyof typeof iconMap] // Look up the icon
                    return (
                      <SidebarMenuItem key={item.path}>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden",
                              isActive 
                                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20"
                                : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />}
                              <div className={cn("relative flex h-9 w-9 items-center justify-center rounded-lg transition-all", isActive ? "bg-white/15 shadow-inner" : "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-105")}>
                                {Icon && <Icon className="h-5 w-5" />} {/* Render icon if available */}
                              </div>
                              <span className="flex-1 relative">{item.label}</span>
                              {isActive && <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* System Navigation */}
          {systemItems.length > 0 && ( // Only render the System group if there are items to show
            <SidebarGroup className="mt-6"> {/* Group with top margin */}
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {systemItems.map((item) => { // Iterate over system navigation items
                    const Icon = iconMap[item.path as keyof typeof iconMap] // Look up the icon
                    return (
                      <SidebarMenuItem key={item.path}>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden",
                              isActive 
                                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20"
                                : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />}
                              <div className={cn("relative flex h-9 w-9 items-center justify-center rounded-lg transition-all", isActive ? "bg-white/15 shadow-inner" : "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-105")}>
                                {Icon && <Icon className="h-5 w-5" />} {/* Render icon if available */}
                              </div>
                              <span className="flex-1 relative">{item.label}</span>
                              {isActive && <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 border-t border-slate-200 bg-white"> {/* Footer with padding, top border, and white background */}
          <div className="space-y-2"> {/* Vertical stack for the profile card and sign-out button */}
            {/* User Profile Card */}
            <button 
              onClick={() => navigate("/profile")} // Navigate to the profile page on click
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left group border border-transparent hover:border-slate-200 hover:shadow-sm" // Full-width button with hover effects
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow overflow-hidden"> {/* Avatar container with dark gradient */}
                {currentUser?.avatarUrl ? ( // Show the uploaded avatar if available
                  <img 
                    src={currentUser.avatarUrl} // Avatar URL
                    alt={displayName} // Alt text using the display name
                    className="h-full w-full object-cover" // Fill the circle
                  />
                ) : (
                  <span className="text-sm font-bold">{userInitials}</span> // Show initials if no avatar
                )}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" /> {/* Subtle white overlay on hover */}
              </div>
              <div className="flex-1 min-w-0"> {/* Text block that shrinks to prevent overflow */}
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p> {/* User's display name, truncated */}
                <div className="flex items-center gap-1.5 mt-1"> {/* Role badge row */}
                  <Shield className="h-3 w-3 text-slate-400" /> {/* Small shield icon */}
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", roleColor)}> {/* Role badge with role-specific colors */}
                    {roleLabel} {/* Human-readable role label */}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 flex-shrink-0 transition-all" /> {/* Right arrow that shifts on hover */}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={() => setShowSignOutConfirm(true)} // Open the sign-out confirmation dialog
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200 hover:border-red-200 hover:shadow-sm" // Full-width button that turns red on hover
            >
              <LogOut className="h-4 w-4" /> {/* Logout icon */}
              Sign Out
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <ConfirmDialog // Sign-out confirmation dialog
        open={showSignOutConfirm} // Controlled by state
        onOpenChange={setShowSignOutConfirm} // Update state when dialog open/close changes
        title="Sign Out" // Dialog title
        description="Are you sure you want to sign out? You'll need to sign in again to access your account." // Dialog description
        confirmLabel="Sign Out" // Confirm button label
        cancelLabel="Cancel" // Cancel button label
        destructive // Style the confirm button as destructive (red)
        onConfirm={handleSignOut} // Call the sign-out handler when confirmed
      />
    </>
  )
}
