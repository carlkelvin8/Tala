import { LogOut, User2, Shield } from "lucide-react" // Import icons: LogOut for sign out button, User2 for profile nav item, Shield for users nav item
import {
  Sidebar, // The root sidebar container component
  SidebarContent, // The scrollable content area of the sidebar
  SidebarFooter, // The footer section at the bottom of the sidebar
  SidebarGroup, // A logical grouping of sidebar items
  SidebarGroupContent, // The content wrapper inside a sidebar group
  SidebarHeader, // The header section at the top of the sidebar
  SidebarMenu, // The menu list container
  SidebarMenuButton, // The clickable button wrapper for menu items
  SidebarMenuItem, // An individual menu item container
} from "../ui/sidebar" // Import all sidebar primitive components from the UI library
import { NavLink } from "react-router-dom" // Import NavLink for navigation links that automatically apply active styles
import { navItems } from "../../lib/navigation" // Import the master navigation items list
import { getStoredUser, clearAuthSession, getUserDisplayName } from "../../lib/auth" // Import auth utilities
import { cn } from "../../lib/utils" // Import the cn utility for conditional class merging
import { 
  LayoutDashboard, // Dashboard icon
  Users, // Students/users icon
  CalendarCheck, // Attendance icon
  GraduationCap, // Grades icon
  Award, // Merits icon
  FileBarChart, // Reports icon
  UserPlus, // Enrollment icon
  BookMarked, // Materials icon
  ClipboardCheck // Exams icon
} from "lucide-react" // Import navigation icons from lucide-react
import { AvatarWithRing } from "../ui/avatar-with-ring" // Import the avatar component with ring/frame support

// Map of URL paths to their corresponding icon components
const iconMap = {
  "/dashboard": LayoutDashboard, // Dashboard uses the LayoutDashboard icon
  "/enrollment": UserPlus, // Enrollment uses the UserPlus icon
  "/students": Users, // Students uses the Users icon
  "/materials": BookMarked, // Materials uses the BookMarked icon
  "/attendance": CalendarCheck, // Attendance uses the CalendarCheck icon
  "/grades": GraduationCap, // Grades uses the GraduationCap icon
  "/merits": Award, // Merits uses the Award icon
  "/exams": ClipboardCheck, // Exams uses the ClipboardCheck icon
  "/reports": FileBarChart, // Reports uses the FileBarChart icon
  "/users": Shield, // User management uses the Shield icon
  "/profile": User2, // Profile uses the User2 icon
} as const // Mark as const to preserve literal types

// Map of role keys to Tailwind text color classes for the role badge
const roleTextColors = {
  ADMIN: "text-violet-600", // Violet text for admin role
  IMPLEMENTOR: "text-sky-600", // Sky blue text for implementor role
  CADET_OFFICER: "text-amber-600", // Amber text for cadet officer role
  STUDENT: "text-emerald-600" // Emerald text for student role
} as const // Mark as const to preserve literal types

// Map of role keys to Tailwind background color classes for the role badge
const roleBgColors = {
  ADMIN: "bg-violet-50", // Light violet background for admin badge
  IMPLEMENTOR: "bg-sky-50", // Light sky background for implementor badge
  CADET_OFFICER: "bg-amber-50", // Light amber background for cadet officer badge
  STUDENT: "bg-emerald-50" // Light emerald background for student badge
} as const // Mark as const to preserve literal types

// Map of role keys to human-readable role labels
const roleLabels = {
  ADMIN: "Administrator", // Admin display label
  IMPLEMENTOR: "Implementor", // Implementor display label
  CADET_OFFICER: "Cadet Officer", // Cadet Officer display label
  STUDENT: "Student" // Student display label
} as const // Mark as const to preserve literal types

// The premium sidebar component used in the Dashboard page layout
export function PremiumAppSidebar({ onNavigate, ...props }: React.ComponentProps<typeof Sidebar> & { onNavigate?: () => void }) {
  const user = getStoredUser() // Read the current authenticated user from localStorage
  const items = navItems.filter((item: typeof navItems[0]) => (user ? item.roles.includes(user.role) : false)) // Filter nav items to only those the current user's role is allowed to see
  const displayName = user ? getUserDisplayName(user) : "Guest User" // Get the user's display name or "Guest User" fallback

  const handleLogout = () => { // Handler for the sign out button
    clearAuthSession() // Remove all auth data from localStorage
    window.location.href = '/login' // Hard redirect to the login page (full page reload to clear any in-memory state)
  }

  return (
    <Sidebar
      {...props} // Spread any additional props (e.g. variant="inset") passed from the parent
      className="border-r border-slate-200 bg-white" // Right border and white background for the sidebar
    >
      {/* Header */}
      <SidebarHeader className="px-4 pt-5 pb-4 border-b border-slate-200"> {/* Header section with padding and bottom border */}
        <div className="flex items-center gap-3"> {/* Flex row for logo icon and text */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900"> {/* Dark rounded square for the logo */}
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg"> {/* SVG shield logo icon */}
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" /> {/* Shield path: starts at top center, goes to corners, forms a shield shape */}
            </svg>
          </div>
          <div> {/* Text block next to the logo */}
            <p className="text-sm font-bold text-slate-900 leading-none">Kalasag-Tala</p> {/* App name in bold dark text */}
            <p className="text-[10px] text-slate-500 font-medium mt-1 tracking-wide uppercase">NSTP Command Center</p> {/* Subtitle in small uppercase muted text */}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4"> {/* Scrollable content area with padding */}
        {/* User Profile Card */}
        <SidebarGroup className="mb-4"> {/* Group for the user profile card with bottom margin */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-50 border border-slate-200"> {/* Profile card: flex row, padded, light background, border */}
            <AvatarWithRing user={user} size="md" showStatusDot={false} /> {/* Medium avatar with the user's frame style */}
            <div className="flex-1 min-w-0"> {/* Text block that shrinks to prevent overflow */}
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{displayName}</p> {/* User's display name, truncated if too long */}
              {user && ( // Only render the role badge if a user is logged in
                <span className={cn(
                  "inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide", // Small badge with padding and letter spacing
                  roleTextColors[user.role], // Role-specific text color
                  roleBgColors[user.role] // Role-specific background color
                )}>
                  {roleLabels[user.role]} {/* Human-readable role label */}
                </span>
              )}
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup> {/* Group for the navigation links */}
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Navigation</p> {/* Section label in small uppercase muted text */}
          <SidebarGroupContent> {/* Content wrapper for the navigation menu */}
            <SidebarMenu className="space-y-1"> {/* Menu list with small vertical spacing between items */}
              {items.map((item: typeof navItems[0]) => { // Iterate over the filtered navigation items
                const Icon = iconMap[item.path as keyof typeof iconMap] // Look up the icon component for this path
                return (
                  <SidebarMenuItem key={item.path}> {/* Individual menu item with path as key */}
                    <SidebarMenuButton asChild> {/* Render the button as a child element (NavLink) instead of a button */}
                      <NavLink
                        to={item.path} // Navigate to this path when clicked
                        onClick={onNavigate} // Call the optional onNavigate callback (e.g. to close mobile sidebar)
                        className={({ isActive }) => // Dynamic className based on whether this route is active
                          cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", // Base styles: flex row, rounded, padded, medium text, smooth color transition
                            isActive
                              ? "bg-slate-900 text-white" // Active state: dark background with white text
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900" // Inactive state: dark text that gets a light background on hover
                          )
                        }
                      >
                        {({ isActive }) => ( // Render function receives isActive to conditionally style children
                          <>
                            {Icon && <Icon className="h-4 w-4 shrink-0" />} {/* Render the icon if one exists for this path; shrink-0 prevents it from shrinking */}
                            <span className="flex-1 truncate">{item.label}</span> {/* Nav item label that takes remaining space and truncates if too long */}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 py-4 border-t border-slate-200"> {/* Footer section with padding and top border */}
        <SidebarMenu> {/* Menu container for the sign out button */}
          <SidebarMenuItem> {/* Single menu item for sign out */}
            <SidebarMenuButton asChild> {/* Render as a child button element */}
              <button
                onClick={handleLogout} // Call the logout handler when clicked
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", // Full-width flex row button
                  "text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors" // Turns red on hover to indicate a destructive action
                )}
              >
                <LogOut className="h-4 w-4" /> {/* Logout icon */}
                <span className="flex-1 text-left">Sign Out</span> {/* Sign out label, left-aligned */}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
