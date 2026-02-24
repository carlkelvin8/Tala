import { LogOut, User2, Shield, ChevronRight } from "lucide-react"
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
import { getStoredUser, clearAuthSession, getUserDisplayName, getUserInitials } from "../../lib/auth"
import { cn } from "../../lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  Award, 
  FileBarChart,
  UserPlus,
  BookMarked,
  ClipboardCheck
} from "lucide-react"

const iconMap = {
  "/dashboard": LayoutDashboard,
  "/enrollment": UserPlus,
  "/students": Users,
  "/materials": BookMarked,
  "/attendance": CalendarCheck,
  "/grades": GraduationCap,
  "/merits": Award,
  "/exams": ClipboardCheck,
  "/reports": FileBarChart,
  "/users": Shield,
  "/profile": User2,
} as const

const roleLabels = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer", 
  STUDENT: "Student"
} as const

const roleAccents = {
  ADMIN: "bg-violet-500",
  IMPLEMENTOR: "bg-sky-500",
  CADET_OFFICER: "bg-amber-500",
  STUDENT: "bg-emerald-500"
} as const

const roleTextColors = {
  ADMIN: "text-violet-600",
  IMPLEMENTOR: "text-sky-600",
  CADET_OFFICER: "text-amber-600",
  STUDENT: "text-emerald-600"
} as const

const roleBgColors = {
  ADMIN: "bg-violet-50",
  IMPLEMENTOR: "bg-sky-50",
  CADET_OFFICER: "bg-amber-50",
  STUDENT: "bg-emerald-50"
} as const

export function PremiumAppSidebar({ onNavigate, ...props }: React.ComponentProps<typeof Sidebar> & { onNavigate?: () => void }) {
  const user = getStoredUser()
  const items = navItems.filter((item: typeof navItems[0]) => (user ? item.roles.includes(user.role) : false))
  const displayName = user ? getUserDisplayName(user) : "Guest User"
  const userInitials = user ? getUserInitials(user) : "GU"

  const handleLogout = () => {
    clearAuthSession()
    window.location.href = '/login'
  }

  return (
    <Sidebar
      {...props}
      className="border-r border-slate-200/80 bg-white shadow-[1px_0_20px_0_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <SidebarHeader className="px-5 pt-6 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 shadow-md">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 tracking-tight leading-none">Kalasag-Tala</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide uppercase">NSTP Command Center</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 flex flex-col gap-1">
        {/* User Profile Card */}
        <SidebarGroup className="mb-2">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="relative flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold shadow-sm">
                {userInitials}
              </div>
              {user && (
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                  roleAccents[user.role]
                )} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{displayName}</p>
              {user && (
                <span className={cn(
                  "inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md tracking-wide",
                  roleTextColors[user.role],
                  roleBgColors[user.role]
                )}>
                  {roleLabels[user.role]}
                </span>
              )}
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="flex-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Navigation</p>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item: typeof navItems[0]) => {
                const Icon = iconMap[item.path as keyof typeof iconMap]
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1",
                            isActive
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 flex-shrink-0",
                              isActive
                                ? "bg-white/15"
                                : "bg-slate-100 group-hover:bg-slate-200"
                            )}>
                              {Icon && <Icon className="h-4 w-4 shrink-0" />}
                            </span>
                            <span className="flex-1 truncate">{item.label}</span>
                            <ChevronRight className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                              isActive
                                ? "text-white/60 translate-x-0.5"
                                : "text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5"
                            )} />
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
      <SidebarFooter className="px-3 py-4 border-t border-slate-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-1"
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 group-hover:bg-red-100 transition-colors duration-200 flex-shrink-0">
                  <LogOut className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
