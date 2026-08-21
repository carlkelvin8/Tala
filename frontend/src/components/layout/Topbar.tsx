import { useState, useEffect, useRef } from "react"
import { getStoredUser, getUserDisplayName } from "../../lib/auth"
import { logoutSession } from "../../lib/api"
import { ConfirmDialog } from "../ui/confirm-dialog"
import { useNavigate, useLocation } from "react-router-dom"
import { LogOut, Menu, Bell, CheckCheck } from "lucide-react"
import { cn } from "../../lib/utils"
import { AvatarWithRing } from "../ui/avatar-with-ring"
import { ThemeToggle } from "../ThemeToggle"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "../../lib/api"
import { ApiResponse } from "../../types"

// Map of URL paths to human-readable page labels for the topbar title
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/enrollment": "Enrollment",
  "/students": "Students",
  "/materials": "Materials",
  "/attendance": "Attendance",
  "/scanner": "QR Scanner",
  "/audit-logs": "Audit Logs",
  "/training": "Training Monitoring",
  "/terms": "Terms",
  "/sections": "Sections",
  "/courses": "Courses",
  "/flights": "Flights",
  "/grades": "Grades",
  "/merits": "Merits",
  "/exams": "Exams",
  "/reports": "Reports",
  "/users": "Users",
  "/profile": "Profile",
  "/medical-certificates": "Medical Certificates",
  "/certificates": "Certificates",
  "/leaderboard": "Leaderboard",
  "/calendar": "Calendar",
  "/live-monitor": "Live Monitor",
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student",
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-600",
  IMPLEMENTOR: "bg-sky-50 text-royal",
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
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const displayName = user ? getUserDisplayName(user) : "Guest"
  const pageLabel = routeLabels[location.pathname] ?? "Overview"
  const roleLabel = user?.role ? roleLabels[user.role] ?? user.role : "Guest"
  const roleBadge = user?.role ? roleColors[user.role] ?? "bg-silver/20 text-darksilver" : "bg-silver/20 text-darksilver"

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => apiRequest<ApiResponse<{ count: number }>>("/api/notifications/unread-count"),
    refetchInterval: 10000,
  })

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/notifications"),
    enabled: notifOpen,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/notifications/${id}/mark-read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [notifOpen])

  const unreadCount = unreadQuery.data?.data?.count ?? 0
  const notifications = notificationsQuery.data?.data ?? []

  const handleLogout = async () => {
    try {
      await logoutSession()
    } catch {
      // proceed to login even if API call fails
    }
    navigate("/login")
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-silver/20 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-silver/20 hover:text-black/80 lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-black">{pageLabel}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-darksilver">Active</span>
          </div>

          <div className="h-4 w-px bg-silver/20 hidden sm:block" />

          <ThemeToggle />

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-silver/20 hover:text-black/80"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-silver/20 bg-white shadow-elevated z-50">
                <div className="flex items-center justify-between border-b border-silver/20 px-4 py-3">
                  <h3 className="text-sm font-semibold text-black">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="flex items-center gap-1 text-xs text-royal hover:text-navy font-medium"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="h-8 w-8 text-silver mx-auto mb-2" />
                      <p className="text-xs text-darksilver">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif: any) => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead) markReadMutation.mutate(notif.id)
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-silver/10 hover:bg-silver/10 transition-colors",
                          !notif.isRead && "bg-royal/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!notif.isRead && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-royal shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-black truncate">{notif.title}</p>
                            <p className="text-[11px] text-darksilver mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-darksilver mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <AvatarWithRing user={user} size="sm" showStatusDot={false} />
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-semibold text-black leading-none">{displayName}</p>
              <span className={cn("mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold", roleBadge)}>
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-silver/20" />

          <button
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-red-50 hover:text-red-500"
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
