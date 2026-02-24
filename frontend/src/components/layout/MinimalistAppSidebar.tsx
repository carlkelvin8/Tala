import { LogOut, User2 } from "lucide-react"
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
  BookOpen, 
  CalendarCheck, 
  GraduationCap, 
  Award, 
  Shield,
  FileBarChart,
  UserPlus,
  BookMarked,
  ClipboardCheck
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

const roleLabels = {
  ADMIN: "Admin",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Officer", 
  STUDENT: "Student"
} as const

export function MinimalistAppSidebar({ onNavigate, ...props }: React.ComponentProps<typeof Sidebar> & { onNavigate?: () => void }) {
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
    <Sidebar {...props} className="border-slate-100 bg-white">
      <SidebarHeader className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
            <span className="text-sm font-bold text-white">KT</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Kalasag-Tala</span>
            <span className="text-xs text-slate-500">NSTP</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <div className="mb-3 px-2">
            <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50">
              <Avatar className="h-8 w-8 bg-slate-200 text-slate-700">
                {user ? getInitials(user.email) : 'U'}
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-900 truncate">{user?.email}</span>
                <Badge variant="outline" className="w-fit text-xs">
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
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                            "hover:bg-slate-100 hover:text-slate-900",
                            "focus:outline-none focus:ring-1 focus:ring-slate-300",
                            isActive 
                              ? "bg-slate-900 text-white" 
                              : "text-slate-600"
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

      <SidebarFooter className="border-t border-slate-100 px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}