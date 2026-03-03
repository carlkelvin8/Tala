import { useState } from "react"
import { clearAuthSession, getStoredUser, getUserDisplayName } from "../../lib/auth"
import { ConfirmDialog } from "../ui/confirm-dialog"
import { useNavigate, useLocation } from "react-router-dom"
import { LogOut, Menu } from "lucide-react"
import { cn } from "../../lib/utils"
import { AvatarWithRing } from "../ui/avatar-with-ring"

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/enrollment": "Enrollment",
  "/students": "Students",
  "/materials": "Materials",
  "/attendance": "Attendance",
  "/grades": "Grades",
  "/merits": "Merits",
  "/exams": "Exams",
  "/reports": "Reports",
  "/users": "Users",
  "/profile": "Profile",
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student",
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-600",
  IMPLEMENTOR: "bg-sky-50 text-sky-600",
  CADET_OFFICER: "bg-amber-50 text-amber-600",
  STUDENT: "bg-emerald-50 text-emerald-600",
}

type TopbarProps = {
  onOpenSidebar?: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const user = getStoredUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const displayName = user ? getUserDisplayName(user) : "Guest"
  const pageLabel = routeLabels[location.pathname] ?? "Overview"
  const roleLabel = user?.role ? roleLabels[user.role] ?? user.role : "Guest"
  const roleBadge = user?.role ? roleColors[user.role] ?? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600"

  const handleLogout = () => {
    clearAuthSession()
    navigate("/login")
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6">
        {/* Left — mobile menu + page title */}
        <div className="flex items-center gap-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-slate-900">{pageLabel}</h1>
        </div>

        {/* Right — user info + logout */}
        <div className="flex items-center gap-3">
          {/* Session indicator */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-400">Active</span>
          </div>

          <div className="h-4 w-px bg-slate-100 hidden sm:block" />

          {/* User pill */}
          <div className="flex items-center gap-2.5">
            <AvatarWithRing user={user} size="sm" frameType="none" showStatusDot={false} />
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{displayName}</p>
              <span className={cn("mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold", roleBadge)}>
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-100" />

          {/* Logout */}
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Log out of your session?"
        description="You will be returned to the login screen."
        confirmLabel="Logout"
        onConfirm={handleLogout}
        destructive
      />
    </>
  )
}
