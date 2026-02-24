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
import { getStoredUser, clearAuthSession, getUserDisplayName, getUserInitials } from "../lib/auth"
import { cn } from "../lib/utils"
import { LayoutDashboard, Users, FileText, BookOpen, CalendarCheck, ClipboardList, GraduationCap, Medal, UserCog, User2, Plane, BarChart3, Grid } from "lucide-react"

const iconMap = {
  "/dashboard": LayoutDashboard,
  "/enrollment": ClipboardList,
  "/students": Users,
  "/sections": Grid,
  "/flights": Plane,
  "/materials": BookOpen,
  "/attendance": CalendarCheck,
  "/grades": GraduationCap,
  "/merits": Medal,
  "/exams": FileText,
  "/reports": BarChart3,
  "/users": UserCog,
  "/profile": User2,
} as const

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student",
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  IMPLEMENTOR: "bg-sky-100 text-sky-700",
  CADET_OFFICER: "bg-amber-100 text-amber-700",
  STUDENT: "bg-emerald-100 text-emerald-700",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const items = navItems.filter((item) => (currentUser ? item.roles.includes(currentUser.role) : false))

  // Update user data when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(getStoredUser())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for updates
    const interval = setInterval(() => {
      setCurrentUser(getStoredUser())
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Group items by category
  const mainItems = items.filter((item) => 
    ["/dashboard", "/enrollment", "/students", "/sections", "/flights"].includes(item.path)
  )
  
  // Debug: Log to verify sections is included
  console.log("Main items:", mainItems.map(i => i.path))
  console.log("Icon for /sections:", iconMap["/sections"])
  const academicItems = items.filter((item) => 
    ["/materials", "/attendance", "/grades", "/merits", "/exams"].includes(item.path)
  )
  const systemItems = items.filter((item) => 
    ["/reports", "/users"].includes(item.path)
  )

  const handleSignOut = () => {
    clearAuthSession()
    navigate("/login")
  }

  const displayName = currentUser ? getUserDisplayName(currentUser) : "Guest"
  const userInitials = currentUser ? getUserInitials(currentUser) : "G"
  const roleLabel = currentUser ? roleLabels[currentUser.role] || currentUser.role : "Guest"
  const roleColor = currentUser ? roleColors[currentUser.role] || roleColors.STUDENT : roleColors.STUDENT

  return (
    <>
      <Sidebar {...props} className="border-r border-slate-200 bg-gradient-to-b from-white to-slate-50">
        {/* Header */}
        <SidebarHeader className="px-6 py-5 border-b border-slate-200 bg-white">
          <a href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 shadow-md group-hover:shadow-lg transition-all duration-200">
              <span className="text-lg font-bold text-white">KT</span>
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors">Kalasag-Tala</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NSTP Command</span>
            </div>
          </a>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-3 py-4 overflow-y-auto">
          {/* Main Navigation */}
          {mainItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Main
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {mainItems.map((item) => {
                    const Icon = iconMap[item.path as keyof typeof iconMap]
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
                              {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                              )}
                              <div className={cn(
                                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                                isActive ? "bg-white/15 shadow-inner" : "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-105"
                              )}>
                                {Icon ? <Icon className="h-5 w-5" /> : <div className="h-5 w-5 bg-slate-300 rounded" />}
                              </div>
                              <span className="flex-1 relative">{item.label}</span>
                              {isActive && (
                                <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />
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
          {academicItems.length > 0 && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Academic
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {academicItems.map((item) => {
                    const Icon = iconMap[item.path as keyof typeof iconMap]
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
                              {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                              )}
                              <div className={cn(
                                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                                isActive ? "bg-white/15 shadow-inner" : "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-105"
                              )}>
                                {Icon && <Icon className="h-5 w-5" />}
                              </div>
                              <span className="flex-1 relative">{item.label}</span>
                              {isActive && (
                                <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />
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

          {/* System Navigation */}
          {systemItems.length > 0 && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {systemItems.map((item) => {
                    const Icon = iconMap[item.path as keyof typeof iconMap]
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
                              {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                              )}
                              <div className={cn(
                                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                                isActive ? "bg-white/15 shadow-inner" : "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-105"
                              )}>
                                {Icon && <Icon className="h-5 w-5" />}
                              </div>
                              <span className="flex-1 relative">{item.label}</span>
                              {isActive && (
                                <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />
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
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 border-t border-slate-200 bg-white">
          <div className="space-y-2">
            {/* User Profile Card */}
            <button 
              onClick={() => navigate("/profile")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left group border border-transparent hover:border-slate-200 hover:shadow-sm"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={displayName} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold">{userInitials}</span>
                )}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield className="h-3 w-3 text-slate-400" />
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", roleColor)}>
                    {roleLabel}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 flex-shrink-0 transition-all" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200 hover:border-red-200 hover:shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <ConfirmDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out? You'll need to sign in again to access your account."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleSignOut}
      />
    </>
  )
}