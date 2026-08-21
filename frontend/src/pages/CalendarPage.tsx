import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { SectionCard } from "../components/ui/section-card"
import { cn } from "../lib/utils"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, GraduationCap, Radio } from "lucide-react"

type CalendarSession = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  isActive: boolean
  section?: { name: string; code: string } | null
}

type ExamSession = {
  id: string
  title: string
  scheduledAt: string
  status: string
  durationMin: number
}

type CalendarEvent = {
  dateKey: string
  title: string
  time: string
  type: "session" | "exam" | "live"
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })
}

export function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const { data: sessionsData } = useQuery({
    queryKey: ["calendar-sessions", year, month],
    queryFn: () =>
      apiRequest<ApiResponse<CalendarSession[]>>(
        `/api/attendance-sessions/calendar?from=${monthStart.toISOString()}&to=${monthEnd.toISOString()}`
      ),
  })

  const { data: examsData } = useQuery({
    queryKey: ["calendar-exams"],
    queryFn: () => apiRequest<ApiResponse<ExamSession[]>>("/api/exams"),
  })

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    const add = (event: CalendarEvent) => {
      const list = map.get(event.dateKey) ?? []
      list.push(event)
      map.set(event.dateKey, list)
    }

    for (const session of sessionsData?.data ?? []) {
      const d = new Date(session.date)
      add({
        dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        title: session.title,
        time: session.startTime ? fmtTime(session.startTime) : "",
        type: session.isActive ? "live" : "session",
      })
    }
    for (const exam of examsData?.data ?? []) {
      const d = new Date(exam.scheduledAt)
      if (d.getFullYear() === year && d.getMonth() === month) {
        add({
          dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          title: exam.title,
          time: fmtTime(exam.scheduledAt),
          type: "exam",
        })
      }
    }
    return map
  }, [sessionsData, examsData, year, month])

  const gridDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = Array.from({ length: firstDayOfWeek }, () => null)
    for (let day = 1; day <= daysInMonth; day++) cells.push(day)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const navigate = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const upcoming = useMemo(() => {
    const all: CalendarEvent[] = []
    for (const [dateKey, list] of eventsByDate) {
      if (dateKey >= todayKey) all.push(...list)
    }
    return all.sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(0, 6)
  }, [eventsByDate, todayKey])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-8 text-white shadow-card">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <CalendarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="mt-1 text-sm text-silver">Training sessions and exams at a glance</p>
          </div>
        </div>
      </div>

      <SectionCard
        title={`${MONTHS[month]} ${year}`}
        description="Training sessions and exams"
        actions={
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} aria-label="Previous month" className="rounded-lg border border-silver/30 p-1.5 hover:bg-silver/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }} className="rounded-lg border border-silver/30 px-3 py-1.5 text-xs font-medium hover:bg-silver/10">
              Today
            </button>
            <button onClick={() => navigate(1)} aria-label="Next month" className="rounded-lg border border-silver/30 p-1.5 hover:bg-silver/10">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1 text-center text-[11px] font-bold uppercase tracking-wider text-darksilver">
              {day}
            </div>
          ))}
          {gridDays.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} />
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const events = eventsByDate.get(dateKey) ?? []
            const isToday = dateKey === todayKey
            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-20 rounded-lg border p-1.5 text-left transition-colors",
                  isToday ? "border-navy bg-navy/5 ring-1 ring-navy/30" : "border-silver/25 hover:border-silver/40",
                )}
              >
                <span className={cn("text-xs font-semibold tabular-nums", isToday ? "text-navy" : "text-black")}>
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 2).map((event, i) => (
                    <div
                      key={i}
                      title={`${event.title} — ${event.time}`}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight",
                        event.type === "live"
                          ? "bg-green-100 text-green-700"
                          : event.type === "exam"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {event.type === "live" && "• LIVE "}
                      {event.type === "exam" && "📝 "}
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <p className="text-[9px] text-darksilver pl-1">+{events.length - 2} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-darksilver">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-400" /> Training session</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-green-500" /> Live now</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-purple-400" /> Exam</span>
        </div>
      </SectionCard>

      {upcoming.length > 0 && (
        <SectionCard title="Upcoming" description="Next events on the schedule">
          <div className="space-y-2">
            {upcoming.map((event, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-silver/30 bg-white/50 px-4 py-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    event.type === "exam" ? "bg-purple-100 text-purple-600" : event.type === "live" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  )}
                >
                  {event.type === "exam" ? <GraduationCap className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">{event.title}</p>
                  <p className="text-xs text-darksilver">{new Date(event.dateKey + "T00:00:00").toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })} • {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
