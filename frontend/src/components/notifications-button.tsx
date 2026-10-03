import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, CheckCheck } from "lucide-react"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { cn } from "../lib/utils"

/* Shared notification bell + dropdown panel.
   Uses real notification data (/api/notifications, /api/notifications/unread-count)
   with live unread badge. Rendered in both the AppLayout Topbar and the
   dashboard SiteHeader so every role gets the same working control. */
export function NotificationsButton({ className }: { className?: string }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

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

  return (
    <div ref={notifRef} className="relative">
      <button
        onClick={() => setNotifOpen(!notifOpen)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-silver/20 hover:text-black",
          className
        )}
        aria-label="Notifications"
        aria-expanded={notifOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-hidden rounded-xl border border-silver/20 bg-white shadow-elevated">
          <div className="flex items-center justify-between border-b border-silver/20 px-4 py-3">
            <h3 className="text-sm font-semibold text-black">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-royal hover:text-navy dark:text-sky-300"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-silver" />
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
                    "w-full border-b border-silver/10 px-4 py-3 text-left transition-colors hover:bg-silver/10",
                    !notif.isRead && "bg-royal/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-royal" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-black">{notif.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-darksilver">{notif.message}</p>
                      <p className="mt-1 text-[10px] text-darksilver">
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
  )
}
