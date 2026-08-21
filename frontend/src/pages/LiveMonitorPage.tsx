import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { SectionCard } from "../components/ui/section-card"
import { toast } from "sonner"
import { cn } from "../lib/utils"
import {
  RadioTower,
  CheckCircle2,
  Clock,
  UserX,
  Users,
  Activity,
  RefreshCw,
} from "lucide-react"

type ActiveSession = {
  id: string
  title: string
  isActive: boolean
  startTime: string
  section?: { name: string; code: string } | null
  flight?: { name: string } | null
}

type LiveFeed = {
  session: {
    id: string
    title: string
    isActive: boolean
    startTime: string
    section: { name: string; code: string } | null
    flight: { name: string } | null
  }
  stats: {
    roster: number
    present: number
    late: number
    absent: number
    checkedIn: number
    attendanceRate: number
  }
  recent: {
    id: string
    name: string
    studentNo: string
    status: "PRESENT" | "LATE" | "ABSENT"
    checkInAt: string
  }[]
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

export function LiveMonitorPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: () => apiRequest<ApiResponse<ActiveSession[]>>("/api/attendance-sessions/active"),
    refetchInterval: 15000,
  })

  const sessions = sessionsData?.data ?? []
  const activeId = selectedSessionId ?? sessions[0]?.id ?? null

  const { data: feedData, isFetching, error } = useQuery({
    queryKey: ["live-feed", activeId, tick],
    queryFn: () => apiRequest<ApiResponse<LiveFeed>>(`/api/attendance-sessions/${activeId}/live`),
    enabled: Boolean(activeId),
    refetchInterval: 5000,
  })

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (error) toast.error(error instanceof Error ? error.message : "Failed to fetch live feed")
  }, [error])

  const feed = feedData?.data
  const stats = feed?.stats

  const statCards = useMemo(
    () => [
      { label: "Checked In", value: stats?.checkedIn ?? 0, icon: CheckCircle2, tone: "text-green-600 bg-green-100" },
      { label: "Present", value: stats?.present ?? 0, icon: Activity, tone: "text-emerald-600 bg-emerald-100" },
      { label: "Late", value: stats?.late ?? 0, icon: Clock, tone: "text-amber-600 bg-amber-100" },
      { label: "Absent / Waiting", value: Math.max(0, (stats?.roster ?? 0) - (stats?.checkedIn ?? 0)), icon: UserX, tone: "text-red-500 bg-red-100" },
    ],
    [stats]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-8 text-white shadow-card">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <RadioTower className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              Live Attendance Monitor
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                LIVE
              </span>
            </h1>
            <p className="mt-1 text-sm text-silver">Real-time check-ins refresh every 5 seconds</p>
          </div>
        </div>
      </div>

      {sessions.length === 0 && !sessionsLoading ? (
        <SectionCard title="No Active Sessions" description="There are no active attendance sessions right now. Start one from the Training Monitoring page.">
          <div className="flex items-center gap-3 py-6 justify-center text-darksilver">
            <Users className="h-8 w-8 opacity-40" />
            <p className="text-sm">Waiting for a session to go live…</p>
          </div>
        </SectionCard>
      ) : (
        <>
          {sessions.length > 1 && (
            <SectionCard title="Active Sessions" description="Select which session to monitor">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedSessionId(session.id)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all",
                      activeId === session.id ? "border-navy bg-navy/5 shadow-md" : "border-silver/30 hover:bg-white/50"
                    )}
                  >
                    <p className="text-sm font-semibold text-black truncate">{session.title}</p>
                    <p className="text-xs text-darksilver truncate">
                      {session.section?.name ?? "All sections"} {session.flight ? `• ${session.flight.name}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="rounded-2xl border border-silver/30 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.tone)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-silver" />}
                  </div>
                  <p className="mt-3 text-3xl font-bold tabular-nums text-black">{card.value}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-darksilver">{card.label}</p>
                </div>
              )
            })}
          </div>

          <SectionCard
            title={`Attendance Rate — ${stats?.attendanceRate ?? 0}%`}
            description={`${feed?.session.title ?? ""} ${feed?.session.section ? `• ${feed.session.section.name}` : ""}`}
          >
            <div className="h-4 w-full overflow-hidden rounded-full bg-silver/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-400 transition-all duration-700 ease-out"
                style={{ width: `${stats?.attendanceRate ?? 0}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-darksilver">
              <span>{stats?.checkedIn ?? 0} of {stats?.roster ?? 0} students</span>
              <span>auto-refreshes every 5s</span>
            </div>
          </SectionCard>

          <SectionCard title="Recent Check-ins" description="Latest students who checked in">
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {!feed && <p className="py-4 text-center text-sm text-darksilver">Loading…</p>}
              {feed && feed.recent.length === 0 && (
                <p className="py-4 text-center text-sm text-darksilver">No check-ins yet — waiting for students…</p>
              )}
              {feed?.recent.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-2.5",
                    index === 0 ? "border-green-400/60 bg-green-50 animate-pulse-once" : "border-silver/30 bg-white/50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        entry.status === "PRESENT" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                      )}
                    >
                      {entry.status === "PRESENT" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">{entry.name}</p>
                      <p className="text-xs text-darksilver">{entry.studentNo}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                        entry.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {entry.status}
                    </span>
                    <p className="text-[11px] text-darksilver mt-0.5">{timeAgo(entry.checkInAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
