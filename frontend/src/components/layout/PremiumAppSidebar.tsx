import { LogOut, User2, Shield, ShieldCheck } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar"
import { NavLink } from "react-router-dom"
import { navItems } from "../../lib/navigation"
import { getStoredUser, getUserDisplayName } from "../../lib/auth"
import { logoutSession } from "../../lib/api"
import { cn } from "../../lib/utils"
import {
  LayoutDashboard, Users, CalendarCheck, GraduationCap, Award,
  FileBarChart, UserPlus, BookMarked, ClipboardCheck, ScanLine, FileHeart,
  Grid, Plane, BookOpen, Calendar, Medal, Trophy, RadioTower, Inbox
} from "lucide-react"
import { AvatarWithRing } from "../ui/avatar-with-ring"
import { roleTextColors, roleBgColors, roleLabels } from "../../lib/roles"
import { programTextColors, programBgColors, getEffectiveProgram } from "../../lib/programs"
import { type ProgramType } from "../../types"

const iconMap = {
  "/dashboard": LayoutDashboard,
  "/enrollment": UserPlus,
  "/students": Users,
  "/sections": Grid,
  "/courses": BookOpen,
  "/flights": Plane,
  "/materials": BookMarked,
  "/attendance": CalendarCheck,
  "/grades": GraduationCap,
  "/merits": Award,
  "/exams": ClipboardCheck,
  "/medical-certificates": FileHeart,
  "/submissions": Inbox,
  "/reports": FileBarChart,
  "/certificates": Medal,
  "/leaderboard": Trophy,
  "/calendar": Calendar,
  "/scanner": ScanLine,
  "/live-monitor": RadioTower,
  "/users": Shield,
  "/audit-logs": ShieldCheck,
  "/profile": User2,
} as const

// The premium sidebar component used in the Dashboard page layout
export function PremiumAppSidebar({ onNavigate, ...props }: React.ComponentProps<typeof Sidebar> & { onNavigate?: () => void }) {
  const user = getStoredUser() // Read the current authenticated user from localStorage
  const items = navItems.filter((item: typeof navItems[0]) => (user ? item.roles.includes(user.role) : false)) // Filter nav items to only those the current user's role is allowed to see
  const displayName = user ? getUserDisplayName(user) : "Guest User" // Get the user's display name or "Guest User" fallback

  const handleLogout = async () => { // Handler for the sign out button
    await logoutSession()
    window.location.href = '/login' // Hard redirect to the login page (full page reload to clear any in-memory state)
  }

  return (
    <Sidebar
      {...props} // Spread any additional props (e.g. variant="inset") passed from the parent
      className="border-r border-silver/30 bg-white" // Right border and white background for the sidebar
    >
      {/* Header */}
      <SidebarHeader className="px-4 pt-5 pb-4 border-b border-silver/30"> {/* Header section with padding and bottom border */}
        <div className="flex items-center gap-3"> {/* Flex row for logo icon and text */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
            <img src="/image.png" alt="Logo" className="h-9 w-9 object-contain" />
          </div>
          <div> {/* Text block next to the logo */}
            <p className="text-sm font-bold text-black leading-none">Kalasag-Tala</p> {/* App name in bold dark text */}
            <p className="text-[10px] text-darksilver font-medium mt-1 tracking-wide uppercase">National Service Training Program Management System</p> {/* Subtitle in small uppercase muted text */}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4"> {/* Scrollable content area with padding */}
        {/* User Profile Card */}
        <SidebarGroup className="mb-4"> {/* Group for the user profile card with bottom margin */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white border border-silver/30"> {/* Profile card: flex row, padded, light background, border */}
            <AvatarWithRing user={user} size="md" showStatusDot={false} /> {/* Medium avatar with the user's frame style */}
            <div className="flex-1 min-w-0"> {/* Text block that shrinks to prevent overflow */}
              <p className="text-sm font-semibold text-black truncate leading-tight">{displayName}</p> {/* User's display name, truncated if too long */}
              {user && ( // Only render the role badge if a user is logged in
                <span className={cn(
                  "inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide", // Small badge with padding and letter spacing
                  roleTextColors[user.role], // Role-specific text color
                  roleBgColors[user.role] // Role-specific background color
                )}>
                  {roleLabels[user.role]} {/* Human-readable role label */}
                </span>
              )}
              {getEffectiveProgram(user) && ( // Show the user's NSTP program badge (implementors are locked to CWTS)
                <span className={cn(
                  "inline-block mt-1 ml-1 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide",
                  programTextColors[getEffectiveProgram(user) as ProgramType],
                  programBgColors[getEffectiveProgram(user) as ProgramType]
                )}>
                  {getEffectiveProgram(user)}
                </span>
              )}
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup> {/* Group for the navigation links */}
          <p className="px-3 mb-2 text-[10px] font-semibold text-darksilver uppercase tracking-widest">Navigation</p> {/* Section label in small uppercase muted text */}
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
                              ? "bg-navy text-white" // Active state: dark background with white text
                              : "text-black/80 hover:bg-silver/20 hover:text-black" // Inactive state: dark text that gets a light background on hover
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
      <SidebarFooter className="px-3 py-4 border-t border-silver/30"> {/* Footer section with padding and top border */}
        <SidebarMenu> {/* Menu container for the sign out button */}
          <SidebarMenuItem> {/* Single menu item for sign out */}
            <SidebarMenuButton asChild> {/* Render as a child button element */}
              <button
                onClick={handleLogout} // Call the logout handler when clicked
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", // Full-width flex row button
                  "text-black/80 hover:bg-red-50 hover:text-red-600 transition-colors" // Turns red on hover to indicate a destructive action
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
