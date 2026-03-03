import { LogOut, User2, Shield } from "lucide-react"
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
import { getStoredUser, clearAuthSession, getUserDisplayName } from "../../lib/auth"
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
import { AvatarWithRing } from "../ui/avatar-with-ring"

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

const roleLabels = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer", 
  STUDENT: "Student"
} as const

export function PremiumAppSidebar({ onNavigate, ...props }: React.ComponentProps<typeof Sidebar> & { onNavigate?: () => void }) {
  const user = getStoredUser()
  const items = navItems.filter((item: typeof navItems[0]) => (user ? item.roles.includes(user.role) : false))
  const displayName = user ? getUserDisplayName(user) : "Guest User"

  const handleLogout = () => {
    clearAuthSession()
    window.location.href = '/login'
  }

  return (
    <Sidebar
      {...props}
      className="border-r border-slate-200 bg-white"
    >
      {/* Header */}
      <SidebarHeader className="px-4 pt-5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Kalasag-Tala</p>
            <p className="text-[10px] text-slate-500 font-medium mt-1 tracking-wide uppercase">NSTP Command Center</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* User Profile Card */}
        <SidebarGroup className="mb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-50 border border-slate-200">
            <AvatarWithRing user={user} size="md" frameType="gradient" showStatusDot={false} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{displayName}</p>
              {user && (
                <span className={cn(
                  "inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide",
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
        <SidebarGroup>
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Navigation</p>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-slate-900 text-white"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {Icon && <Icon className="h-4 w-4 shrink-0" />}
                            <span className="flex-1 truncate">{item.label}</span>
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
      <SidebarFooter className="px-3 py-4 border-t border-slate-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                )}
              >
                <LogOut className="h-4 w-4" />
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
