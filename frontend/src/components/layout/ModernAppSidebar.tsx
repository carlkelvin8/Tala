import { ChevronUp, User2, LogOut, Settings, Bell, HelpCircle } from "lucide-react"
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
import { getStoredUser, clearAuthSession } from "../../lib/auth"
import { cn } from "../../lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  CalendarCheck, 
  ClipboardList, 
  GraduationCap, 
  Medal, 
  UserCog,
  BarChart3,
  Shield,
  Award,
  Clock,
  FileSpreadsheet,
  UserPlus,
  BookMarked,
  Calendar,
  Star,
  ClipboardCheck,
  FileBarChart
} from "lucide-react"
import { Avatar } from "../ui/avatar"
import { Badge } from "../ui/badge"

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

const roleColors = {
  ADMIN: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  IMPLEMENTOR: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white", 
  CADET_OFFICER: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
  STUDENT: "bg-gradient-to-r from-slate-500 to-gray-500 text-white"
} as const

const roleLabels = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer", 
  STUDENT: "Student"
} as const

export function ModernAppSidebar({ onNavigate, ...props }: React.ComponentProps<typeof Sidebar> & { onNavigate?: () => void }) {
  const user = getStoredUser()
  const items = navItems.filter((item: typeof navItems[0]) => (user ? item.roles.includes(user.role) : false))

  const handleLogout = () => {
    clearAuthSession()
    window.location.href = '/login'
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Sidebar {...props} className="border-slate-200 bg-white/95 backdrop-blur-sm">
      <SidebarHeader className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-lg">
            <span className="text-lg font-bold text-white">KT</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-slate-900">Kalasag-Tala</span>
            <span className="text-xs text-slate-500">NSTP Command Center</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        <SidebarGroup className="space-y-2">
          <div className="mb-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-white shadow-md bg-gradient-to-br from-slate-600 to-slate-800 text-white font-semibold">
                {user ? getInitials(user.email) : 'U'}
              </Avatar>
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-slate-900">{user?.email}</span>
                <Badge className={cn("w-fit text-xs font-medium", roleColors[user?.role || "STUDENT"])}>
                  {roleLabels[user?.role || "STUDENT"]}
                </Badge>
              </div>
            </div>
          </div>

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
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            "hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm",
                            "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                            isActive 
                              ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg" 
                              : "text-slate-600 hover:text-slate-900"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                              "group-hover:bg-white/20",
                              isActive ? "bg-white/20" : "bg-slate-100"
                            )}>
                              {Icon && <Icon className="h-4 w-4" />}
                            </div>
                            <span className="flex-1">{item.label}</span>
                            {isActive && (
                              <div className="h-2 w-2 rounded-full bg-white/60" />
                            )}
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

        <div className="mt-8 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-semibold text-slate-900">Need Help?</span>
              <span className="text-xs text-slate-600">Check our documentation</span>
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a 
                href="/profile" 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <User2 className="h-4 w-4" />
                Profile
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}