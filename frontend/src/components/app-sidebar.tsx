import { useState } from "react"
import * as React from "react"
import { LogOut, ChevronRight, Shield } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "../components/ui/sidebar"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { NavLink, useNavigate } from "react-router-dom"
import { navItems } from "../lib/navigation"
import { getStoredUser, getUserDisplayName, getUserInitials } from "../lib/auth"
import { logoutSession } from "../lib/api"
import { cn } from "../lib/utils"
import { LayoutDashboard, Users, FileText, BookOpen, CalendarCheck, ClipboardList, GraduationCap, Medal, UserCog, User2, Plane, BarChart3, Grid, Target, Calendar, ShieldCheck, FileHeart, ScanLine } from "lucide-react"
import { roleLabels, roleBadgeColors } from "../lib/roles"

const iconMap = {
  "/dashboard": LayoutDashboard,
  "/enrollment": ClipboardList,
  "/students": Users,
  "/sections": Grid,
  "/courses": BookOpen,
  "/flights": Plane,
  "/materials": BookOpen,
  "/attendance": CalendarCheck,
  "/grades": GraduationCap,
  "/merits": Medal,
  "/exams": FileText,
  "/medical-certificates": FileHeart,
  "/reports": BarChart3,
  "/users": UserCog,
  "/audit-logs": ShieldCheck,
  "/profile": User2,
  "/training": Target,
  "/terms": Calendar,
  "/scanner": ScanLine,
} as const

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const items = navItems.filter((item) => (currentUser ? item.roles.includes(currentUser.role) : false))

  React.useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(getStoredUser())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const mainItems = items.filter((item) =>
    ["/dashboard", "/enrollment", "/students", "/courses", "/sections", "/flights"].includes(item.path)
  )
  
  const academicItems = items.filter((item) =>
    ["/materials", "/attendance", "/training", "/terms", "/grades", "/merits", "/exams", "/medical-certificates"].includes(item.path)
  )
  const systemItems = items.filter((item) =>
    ["/reports", "/users", "/audit-logs"].includes(item.path)
  )

  const handleSignOut = async () => { // Handler called when the user confirms sign-out
    await logoutSession()
    navigate("/login") // Redirect to the login page
  }

  const displayName = currentUser ? getUserDisplayName(currentUser) : "Guest"
  const userInitials = currentUser ? getUserInitials(currentUser) : "G"
  const roleLabel = currentUser ? roleLabels[currentUser.role] || currentUser.role : "Guest"
  const roleColor = currentUser ? roleBadgeColors[currentUser.role] || roleBadgeColors.STUDENT : roleBadgeColors.STUDENT

  return (
    <>
      <Sidebar {...props} className="border-r border-silver/30 bg-gradient-to-b from-white to-silver/20"> {/* Sidebar with right border and subtle gradient background */}
        {/* Header */}
        <SidebarHeader className="px-6 py-5 border-b border-silver/30 bg-white"> {/* Header with padding, bottom border, and white background */}
          <a href="/dashboard" className="flex items-center gap-3 group"> {/* Logo link to dashboard, group for hover effects */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-200">
              <img src="/image.png" alt="Logo" className="h-11 w-11 object-cover" />
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
            <div className="flex flex-col"> {/* Text block next to the logo */}
              <span className="text-lg font-bold text-black group-hover:text-black/80 transition-colors">Kalasag-Tala</span> {/* App name that lightens on hover */}
              <span className="text-[10px] text-darksilver font-bold uppercase tracking-widest">National Service Training</span> {/* Subtitle in small uppercase */}
            </div>
          </a>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-3 py-4 overflow-y-auto"> {/* Scrollable navigation content area */}
          {/* Main Navigation */}
          {mainItems.length > 0 && ( // Only render the Main group if there are items to show
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-darksilver mb-2"> {/* "Main" group label in small uppercase */}
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
                                ? "bg-gradient-to-r from-navy to-royal text-white shadow-lg shadow-navy/20" // Active: dark gradient with shadow
                                : "text-darksilver hover:bg-white hover:text-black hover:shadow-sm" // Inactive: hover to white background
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
                                isActive ? "bg-white/15 shadow-inner" : "bg-silver/20 group-hover:bg-silver/30 group-hover:scale-105" // Active: semi-transparent; inactive: light gray with scale on hover
                              )}>
                                {Icon ? <Icon className="h-5 w-5" /> : <div className="h-5 w-5 bg-silver/40 rounded" />} {/* Render icon or fallback placeholder */}
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
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-darksilver mb-2">
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
                                ? "bg-gradient-to-r from-navy to-royal text-white shadow-lg shadow-navy/20"
                                : "text-darksilver hover:bg-white hover:text-black hover:shadow-sm"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />}
                              <div className={cn("relative flex h-9 w-9 items-center justify-center rounded-lg transition-all", isActive ? "bg-white/15 shadow-inner" : "bg-silver/20 group-hover:bg-silver/30 group-hover:scale-105")}>
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
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-darksilver mb-2">
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
                                ? "bg-gradient-to-r from-navy to-royal text-white shadow-lg shadow-navy/20"
                                : "text-darksilver hover:bg-white hover:text-black hover:shadow-sm"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />}
                              <div className={cn("relative flex h-9 w-9 items-center justify-center rounded-lg transition-all", isActive ? "bg-white/15 shadow-inner" : "bg-silver/20 group-hover:bg-silver/30 group-hover:scale-105")}>
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
        <SidebarFooter className="p-3 border-t border-silver/30 bg-white"> {/* Footer with padding, top border, and white background */}
          <div className="space-y-2"> {/* Vertical stack for the profile card and sign-out button */}
            {/* User Profile Card */}
            <button 
              onClick={() => navigate("/profile")} // Navigate to the profile page on click
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-all text-left group border border-transparent hover:border-silver/30 hover:shadow-sm" // Full-width button with hover effects
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-navy via-royal to-royal text-white flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow overflow-hidden"> {/* Avatar container with dark gradient */}
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
                <p className="text-sm font-bold text-black truncate">{displayName}</p> {/* User's display name, truncated */}
                <div className="flex items-center gap-1.5 mt-1"> {/* Role badge row */}
                  <Shield className="h-3 w-3 text-darksilver" /> {/* Small shield icon */}
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", roleColor)}> {/* Role badge with role-specific colors */}
                    {roleLabel} {/* Human-readable role label */}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-darksilver group-hover:text-darksilver group-hover:translate-x-0.5 flex-shrink-0 transition-all" /> {/* Right arrow that shifts on hover */}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={() => setShowSignOutConfirm(true)} // Open the sign-out confirmation dialog
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-darksilver hover:text-red-600 hover:bg-red-50 transition-all border border-silver/30 hover:border-red-200 hover:shadow-sm" // Full-width button that turns red on hover
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
